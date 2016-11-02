---
layout: post
title: Neith - Zippers for Javascript
date: '2014-01-16'
---
Zippers allow efficient manipulation of immutable, hierarchical data structures through a formalized interface. This post overviews the [Neith][neith] Javascript library implementation of [Huet zippers][Heut].

Neith is a Javascript library that supports zippers for hierarchical, lazy, potentially infinite data structures. It is based on [clojure.zip][clojure-zipper]. The example code is written in [Khepri][khepri] and taken from [Neith's implementation][neith].  For an overview or introduction to zippers see [Heut's paper][Heut] or [Haskell/Zippers][haskell-zippers].

# Generic Neith Zippers
Neith supports zippers for any tree-like data structure. One important restriction on the data structures is that every element in a zippered data structure must be identifiable by a unique implicit or explicit path. Graphs therefore cannot be zippered using Neith. 
 
## The Zipper Context
Zippers work by decomposing a data structures into a focus element and a representation of its location in the larger data structure; which together form a context. All zipper operations take a context and output either a new context or some information extracted from the context.

Without a type system, it is also necessary to store metadata about the zipper itself. Neith splits the zipper context into two [Amulet][amulet] data records: `Context` and `Loc`.

#### Context
`Context` holds the top level context object, consisting of the a `Loc` data structure context and the metadata defining a zipper.

Neith zippers are defined with two functions: `children` maps an data structure element to its child elements and `constructNode` reconstructs elements, mapping an element and its children to an new element with those children. 

```js
var Context = declare(null, [
    'loc',              // Location.
    'children',         // Function mapping element to its children.
    'constructNode']);  // Function that builds a node.
```

`children` returns a [Nu][nu] stream, so Neith can define zippers for lazy data structures which lazily generate the child stream. 

#### Location
`Loc` is the actual zipper context. It stores the focus element and information about its location in the larger data structure.

```js
var Loc = declare(null, [
    'focus',    // Focus element.
    'parent',   // Location of parent.
    'path',     // Stream of parent elements leading from focus to root.
    'left',     // Stream of elements to the left of the focus.
    'right']);  // Stream of elements to the right of the focus.
```

`path`, `left`, and `right` are all (possibly empty or infinite) [Nu][nu] streams. `path` is stored in the order leading from the focus to the root. The first element of both `left` and `right` are the immediate siblings of the focus and the last elements are the elements furthest away; meaning that `left` is reversed compared to the source data structure. This ordering greatly simplifies the movement logic. 

## Zipper Creation
Zippers are created with an initial focus and the two metadata functions stored in `Context`.

```js
zipper = \children constructNode focus ->
    new Context(
        new Loc(focus, null, NIL, NIL, NIL),
        children,
        constructNode);
```

#### List Zipper
A zipper for a list can be defined using `zipper`. The list zipper operates on a [Nu][nu] stream of elements, and can move down into nested lists.

```js
listZipper = let
    children = \element -> ?isStream element :element :NIL,
    construct = \element children -> children
in
    zipper@(
        children,
        construct);
```

Creating a list zipper:

```js
var lz = listZipper <| stream.from[
    stream.from[1, 2, 3],
    stream.from[4]];
```

#### Basic Binary Tree Zipper
The zipper for a full binary tree is also easily defined. A more generic approach for trees will be offered later.

```js
var Binary = declare(null, ['value', 'left', 'right']);

binaryZipper = let
    children = \element#{left right} ->
        stream.from[left, right],
    
    construct = \element#{value} children ->
        new Binary(
            value,
            first children,
            first(rest children))
in
    zipper@(
        children,
        construct);
```

```js
with $ = Binary.create in {
    var bz = binaryZipper <|
        $(1,
            $(2,
                null,
                $(3, null, null)),
            $(4,
                null,
                null));
}
```

# Operations
Every public Neith zipper operation takes a context as its last parameter. Taking the context as the last parameter instead of the first allows currying multiple argument operations, and sequences of operations can be organized into imperative looking code using Khepri's `|>` operator.

## Queries
Query operations extract information from the zipper context. The zipper context should be considered opaque, and third party code should only interact with zippers using these operations.

```js
/// Get the focus element.
extract = \ctx -> ctx.loc.focus;

/// Get the parent of the focus.
parent = \ctx -> ctx.loc.parent;

/// Get ordered list of the focus's left siblings.
lefts = \ctx -> ctx.loc.left;

/// Get ordered list of the focus's right siblings.
rights = \ctx -> ctx.loc.right;

/// Get ordered path of nodes leading to, and including, the focus.
path = \ctx -> cons(extract ctx, ctx.loc.path);

/// Get ordered list of focus's children.
children = \ctx -> ctx.children(extract ctx);
```

A few useful predicate queries can also be defined.

```js
hasChildren = children \> (!) <\ isEmpty;

hasParent = parent \> (!==)@null;

isChild = hasParent;

isRoot = (!) <\ hasParent;

isLeaf = (!) <\ hasChildren;

/// Is the focus the leftmost of its siblings?
isFirst = lefts \> isEmpty;

/// Is the focus the rightmost of its siblings?
isLast = rights \> isEmpty;
```

## Basic Movement
Four primitive two dimensional movement operations traverse the underlying data structure, mapping a context to a new context for a new location. `left` and `right` move within a level of a data structure, while `up` and `down` move between levels. Invalid movement operations, such as moving down in an empty tree, return null.

#### Down
`down` moves to the leftmost child of the focus. This pushes the current focus onto the path and stores the current location as the parent.

```js
var setLoc = Context.setLoc;

down = \ctx ->
    ?isLeaf ctx 
        :NIL
        :let
            cs = children ctx,
            focus = first(cs),
            parent = ctx.loc,
            path = cons(extract ctx, ctx.loc.path),
            lefts = NIL,
            rights = rest cs
        in
            setLoc(ctx,
               new Loc(focus, parent, path, lefts, rights)));
```

The list zipper takes a list as its initial focus, so it is necessary to move down into the list to actually manipulate the list elements.

```js
lz
    |> down
    |> extract |> toArray; // [1, 2, 3]
    
lz
    |> down
    |> down
    |> extract; // 1

lz
    |> down
    |> down
    |> down; // null
``` 

#### Right
`right` moves to the immediate right sibling of the focus. The `setSurround` helper function sets all Location information for a level.

```
var setSurround = \ctx left focus right ->
    setLoc(ctx,
        Loc.setRight(
            Loc.setLeft(
                Loc.setFocus(ctx.loc, focus),
                left),
            right));

right = \ctx ->
    ?isLast(ctx) :null
        :let rs = rights ctx in
            setSurround(ctx,
                cons(extract ctx, lefts ctx),
                first rs,
                rest rs);
```

```
lz
    |> down
    |> right
    |> extract |> toArray; // [4]
    
lz
    |> down
    |> right
    |> down
    |> extract; // 4
    
lz
    |> down
    |> right
    |> right; // null
``` 

#### Left
`left` is the inverse of `right` and moves to the immediate left sibling of the focus. Since the left siblings are stored in reverse order, the left sibling of the focus is simply the first element of `lefts`.

```js
left = \ctx ->
    ?isFirst(ctx) :null
        :let ls = lefts ctx in
            setSurround(ctx,
                rest ls,
                first ls,
                cons(extract ctx, rights ctx)));
```

```js
lz
    |> down
    |> right
    |> left
    |> extract |> toArray; // [1, 2, 3]
    
lz
    |> down
    |> down
    |> right
    |> right
    |> left
    |> extract; // 2
``` 

#### Up
`up` is the inverse of `down` and moves up a level to the first element of the path. But unlike the other movements, `up` also reconstructs the parent's focus from the current location using the `constructNode` function before moving to it. Reconstruction is what allows zippers to transform the underlying data structures.

```js
up = \ctx ->
    ?isRoot(ctx) :null
        :setLoc(ctx,
            Loc.setFocus(
                parent ctx,
                constructParent ctx)));
```

`constructParent` reconstructs the parent element. The `constructNode` function defining a given zipper expects an ordered list of all children, which `constructParent` builds from the current location's left siblings (which also must be reversed since the list is stored in reverse order), its focus, and its right siblings. 

```js
var construct = \ctx parent children ->
    ctx.constructNode(
        parent,
        children);

var constructParent = \ctx -> 
    construct(ctx,
        extract(parent(ctx)),
        append(
            reverse <| lefts ctx,
            cons(extract ctx, NIL),
            rights ctx));
```

## Compound Movements
More powerful movement operations can be defined using the four basic movements.

#### Root
One useful movement operation is `root`, which fully zips up the data structure to its origin.

```js
root = \ctx ->
    let parent = up(ctx) in
        ?parent :root parent :ctx;
```

`root` and `extract` can be used to recover the complete data structure.

```js
lz
    |> down
    |> down
    |> right
    |> right
    |> root
    |> extract; // stream(stream([1, 2, 3]), stream([4]))
```

#### Sibling Movement
Moving over multiple siblings is also easy using recursion.

```js
/// Move to the leftmost sibling of the focus.
leftmost = \ctx ->
    let l = left ctx in
        ?l :leftmost l :ctx;

/// Move to the rightmost sibling of the focus.
rightmost = \ctx ->
    let r = right ctx in
        ?r :rightmost r :ctx;
```

```
listZipper <| stream.from[1, 2, 3]
    |> down
    |> rightmost
    |> extract; // 3
```

#### DFS
These very useful movements emulate depth first search tree traversals. 

```js
/// Move to the next node in a DFS excluding the focus's children.
nextUpDfs = \ctx ->
    let parent = up ctx in 
        ?parent
            :(right parent || nextUpDfs parent)
            :parent;

/// Move to the next node in a DFS traversal.
nextDfs = \ctx ->
    (down ctx || right ctx || nextUpDfs ctx);

/// Move to the previous node in a DFS traversal.
prevDfs = \ctx ->
    let l = left(ctx) in
        ?l
            :rightLeaf l
            :up ctx);
```

```js
static console;

var print = \ctx -> { console.log(extract ctx); return ctx; };

listZipper <| stream.from[stream.from[1, 2], stream.from[3]]
    |> nextDfs
    |> print // prints 1
    |> nextDfs 
    |> print // prints 2
    |> nextDfs
    |> print // prints 3
    |> nextDfs; // null
```

## Editing
The real power of zippers is in efficiently transforming immutable data structures using imperative looking code. Normally, editing a node in an immutable tree data structure is an `log(n)` operation, assuming we already have the node we want to edit, because the entire tree must be rebuilt on every edit. Using a zipper, many common editing operations are possible in constant time, although recovering the complete transformed data structure does have a cost. This makes zippers well suited for efficiently applying multiple transforms to a data structure.

#### Editing the Focus
The focus element can be edited in constant time. `replace` replaces the current focus element with a new one.

```js
replace = \node ctx ->
    Context.setLoc(
        ctx,
        ctx.loc.setFocus node);
```

```js
listZipper <| stream.from[1, 2, 3]
    |> down
    |> replace@'new'
    |> root
    |> extract |> toArray; // ['new', 2, 3]
```

Another useful operation is to modify the focus. `modify` uses function `f` to map the current focus to a new focus.

```js
modify = \f ctx ->
    replace(
        f(extract ctx),
        ctx);
```

```js
listZipper <| stream.from[1, 2, 3]
    |> down
    |> modify @ ((+)@10)
    |> root
    |> extract |> toArray; // [11, 2, 3]
```

#### Editing Siblings
In addition to editing the focus, zippers can transform other parts of the context in constant time.

These base operation edit the list of left and right siblings, staying on the focus.

```js
setLefts = \ls ctx ->
    modifyLoc(ctx, \loc -> Loc.setLeft(loc, ls));

modifyLefts = \f ctx ->
    setLefts(f(lefts ctx), ctx);

setRights = \rs ctx ->
    modifyLoc(ctx, \loc -> Loc.setRight(loc, rs));

modifyRights = \f ctx ->
    setRights(f(rights ctx), ctx);
```

Directly manipulating `lefts` and `rights` is too low level for many operations. `insertLeft` and `insertRight`, which insert a sibling to the left or right of the focus respectively, are more useful.

```js
insertLeft = \node ctx ->
    modifyLefts((cons, node), ctx);

insertRight = \node ctx ->
    modifyRights(cons@node), ctx);
```

```
listZipper <| stream.from[1, 2, 3]
    |> down
    |> insertLeft@ 0
    |> right
    |> insetRight@ 8
    |> root
    |> extract |> toArray; // [0, 1, 2, 8, 3]
```

#### Removal
Removing elements also proves fairly straightforward once all the possible cases are considered. `remove` removes the focus (implicitly along with its children) and moves to either the first right sibling, or the first left sibiling, or the parent.

```js
remove = \ctx ->
    ?isLast ctx
        ?isFirst ctx
            // Element has no siblings, move to parent
            :(?hasParent ctx :constructParent ctx :null)
            // Otherwise, has left siblings so go to left and erase rights 
            :setRights(NIL, left ctx)
        // Has some right siblings, more right and erase first lefts.
        :modifyLefts(skip@2, right(ctx)));
```

#### Editing Children
The basic editing operations can be composed to build more complex transforms for specific applications. These edits transform the children of the focus.

```js
/// Insert a left child for the focus. Stays in the current location.
insertChild = \node, ctx ->
    ?hasChildren ctx
        :(ctx
            |> down
            |> insertLeft@ node
            |> up)
        :replace(
            construct(ctx, extract ctx, cons(node, NIL)),
            ctx);

/// Insert a child at the right for the focus. Stays in current location.
appendChild = \node, ctx ->
    ?hasChildren(ctx)
        :(ctx
            |> down
            |> rightmost
            |> insertRight@ node
            |> up)
        :insertChild(node, ctx));
```

# Further Work

## Labeled k-ary Trees
A general purpose zipper for variations of labeled n-ary trees (like ASTs) is fairly trivial to define. Specialized edit and query operations allow editing both edges and nodes.

I cover Neith's implementation of tree zippers [in this post](/zippering-n-ary-ordered-trees-in-neith/).

## Better Failure
I designed Neith to be simple to use with standard Javascript techniques. One area that suffers as a result is failure handling.

Invalid Neith operations return `null`. A better solution is to return `Maybe` values and build zipper computations by composing potentially failing operations using applicatives or monads. [This approach][learn you a zipper] is superior, and common in languages like Haskell, but would have made Neith's API more difficult to work with.



[Zippers]: http://www.haskell.org/haskellwiki/Zipper
[learn you a zipper]: http://learnyouahaskell.com/zippers
[Heut]: http://www.st.cs.uni-saarland.de/edu/seminare/2005/advanced-fp/docs/huet-zipper.pdf
[haskell-zippers]: http://en.wikibooks.org/wiki/Haskell/Zippers
[clojure-zipper]: http://richhickey.github.io/clojure/clojure.zip-api.html
[neith]: https://github.com/mattbierner/neith
[nu]: https://github.com/mattbierner/nu
[amulet]: https://github.com/mattbierner/amulet
[khepri]: https://github.com/mattbierner/khepri