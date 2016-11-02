---
layout: post
title: Persistent Hash Tries in Javavascript
date: '2014-02-23'
---
The [hash trie][wiki-hash-trie] is a [persistent][persistent] map data structure with good lookup and update performance. I overview hash tries and cover a basic Javascript hash trie implementation.

The example code is written in [Khepri][khepri] and taken from the [hashtrie][hashtrie] library. Hashtrie is based on [Clojure's PersistentHashMap](https://github.com/clojure/clojure/blob/master/src/jvm/clojure/lang/PersistentHashMap.java).

# Overview
Hash tries are [tries] that use a *h* bit hash as the key. Each hash is split into sections of *m* bits and internal nodes each contain *2^m* entries for a section of the hash. The trie has at most *h/m* levels. Common values for *h* are 32 or 64, while *m* is often 4 or 5.

Assuming there are no collisions, lookup and update performance depends only on the number of bits in the hash and the number of buckets for each internal node. Persistence is achieved by path copying.

## Example trie
For `h=8` and `n=2` the hash trie has 4 levels. Each internal node contains all possible mappings for a 2 bit hash fragment: `00, 01, 10, 11`. The path from the root to a leaf is the compete hash of that entry.

```
{root
    {00
        {00 ...}
        {01
            {00 ...}
            {01 ...}
            {10 ...}
            {11
                00    // entry for hash: 00 01 11 00
                01    // entry for hash: 00 01 11 01
                10    // entry for hash: 00 01 11 10
                11}}  // entry for hash: 00 01 11 11
        {10 ...}
        {11 ...}}
    {01 ...}
    {10 ...}
    {11 ...}}
```

## Lookups
Lookups are performed by progressively matching sections of the hash against internal nodes until the entire hash has been matched. This checks at most `h/m` nodes. Getting the child of an internal node can be performed in constant time by indexing into an array.

```
// Pseudo code lookup for: 10 11 01 00

level1 = root[00]
level2 = level1[01]
level3 = level2[11]
level3[10]
```

## Updates
Updates rebuild at most `h/m` internal nodes on a path, with the cost of rebuilding an internal node being the cost to rebuild an array of size `2^m`. 

## Other Notes
Instead of storing all leaves at the lowest level, we can reduce memory usage and improve performance by collapsing empty paths. During lookups and updates, we stop as soon as we find the first leaf on a path.


# Javascript Implementation
In Javascript, we will use a 32 bit hash, split into eight 4 bit sections.

```js
var HASH_SIZE = 32;

var SIZE = 4;

var BUCKET_SIZE = Math.pow(2, SIZE); // 16

var LEVELS =  HASH_SIZE / SIZE; // 8
```

## Hash Function
Unlike many high level languages, Javascript does not have native support to map objects or values to hash codes. Hash tries can use any type of key, so long as the key can be hashed. For this example however, I’m going to use string keys.

The `hash` function, based on [this StackOverflow](http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery) answer, hashes a string.

```js
hash = \str -> {    
    var hash = 0;
    for (var i = 0, len = str.length; i < len; i = i + 1)
    with c = str.charCodeAt(i) in {
        hash = (((hash << 5) - hash) + c) | 0;
    }
    return hash;
};
```

## Hash Fragments
`hashFragment` gets the part of a hash we are interested in at a given level.  It takes a hash `h` and a `shift` (which is a multiple of SIZE), and returns only the `SIZE` bit section of the hash we are interested in.

```js
var mask = BUCKET_SIZE - 1; // 0b1111

var hashFragment = \shift h ->
    (h >>> shift) & mask;
```

Using the 8 bit hash `10110100` example:

```js
hashFragment(0, 0b10110100); // 0b00
hashFragment(2, 0b10110100); // 0b01
hashFragment(4, 0b10110100); // 0b11
hashFragment(6, 0b10110100); // 0b10
```

## Node Structures
There are two types of leaf nodes: `LeafNode` and `CollisionNode`.  

```js
var LeafNode = function \hash key value =self-> {
    self.hash = hash;   // Complete hash of the key
    self.key = key;     // Key of the leaf
    self.value = value; // Value stored for key.
};

var CollisionNode = function \hash children =self-> {
    // Complete hash of the leaf
    self.hash = hash;           
    
     // List of `LeafNode` with same hash but different keys
    self.children = children;  
};
```

The empty leaf node `empty`, is used in the implementation and to represent an empty trie.

```js
empty = null;
```

`InternalNode` manages a set of one or more children, addressable by hash fragment offsets into a sparsely populated array. Only children that actual exist are set in the array.

```js
var InternalNode = function \count children =self-> {
    // Number of real children
    self.count = count;
    
    // Array map of hash fragment to child.
    self.children = children;
};
```

# Lookups
Looking up an entry is straightforward; simply descend a path of internal nodes using progressive hash fragments until a leaf is found. Since the trie only expands leaf nodes to internal nodes as needed, this leaf may not match the query.

## Nothing
When a entry does not exist in the trie, we will return an internal `nothing` value.

```js
var nothing = ({});
```

Using a special value for `nothing` allows the trie to store any type, including falsy values.

`isNothing` checks if a value is nothing

```js
var isNothing = (===)@nothing;
```

`maybe` returns a value or a default `alt` if the input is nothing.

```js
var maybe = \val alt ->
    ?isNothing val
        :alt
        :val;
```

## Implementation
`lookup` takes the current `shift` of the lookup, the complete lookup hash `h`, the lookup key `k`, and a node `n`.

```js
var isEmpty = (!);


var lookup = \shift h k n ->
    ?isEmpty n
        :nothing
        :n.get(shift, h, k);
```

Lookup operations are specialized for each node type.

Leaf nodes return nothing if the lookup key is not equal to the query key.

```js
LeafNode.prototype.get = \_ _ k =self->
    ?k === self.key
        :self.value
        :nothing;
```

Collision nodes return the first matching value in their collision list or nothing.

```js
CollisionNode.prototype.get = \_ _ k ={children}-> {
    for (var i = 0, len = children.length; i < len; i = i + 1)
    with {key value} = children.(i) in {
        if (k === key)
            return value;
    }
    return nothing;
};
```

Internal nodes use `shift` to calculate a hash fragment, get a child from `children` using the hash fragment, and perform a lookup on this child. Since the child lookup happens at the next level of the tree, the shift is incremented. When the child is `undefined`, `lookup` returns nothing. 

```js
InternalNode.prototype.get = \shift h k =self-> let
    frag = hashFragment(shift, h),
    child = self.children.(frag)
in
    lookup(shift + SIZE, h, k, child);  
```

## API

```
/// Get value for `k` or return `alt`.
tryGet = \alt k m  ->
    maybe(
        lookup(0, hash k, k, m),
        alt);

/// Get the value for `k` or return `null`
getHash = tryGet @ null;

/// Does an entry for `k` exist?
has = \k m ->
    !isNothing lookup(0, hash k, k, m);
```


# Updates
Updates take a hash trie and return a new hash trie with the update applied. Like lookup, updates walk a path of internal nodes until finding a leaf. But instead of returning a value, updates edit the Leaf and then reconstruct all node on the path back to the root in reverse order.

Rather than use separate routines to edit, insert, and delete nodes, a single `alter` function will handle everything. `alter` takes a `shift`, function `f` which maps the current node value to a new node value, target hash `h`, traget key `k`, and node `n`.

```js
var alter = \shift f h k n ->
    ?isEmpty n
        :alterEmpty(shift, f, h, k)
        :n.modify(shift, f, h, k);
```

Deletes occur when `f` returns `nothing`, while inserts occur when an empty node is edited and `f` does not return `nothing`.

#### empty::modify
Editing an empty node calls the modify function `f` with zero arguments. If `f` does not return `nothing`, a new node is inserted.

```js
var alterEmpty = \_ f h k ->
    v = f()
in
    ?isNothing v
        :empty // noop
        :new Leaf(h, k, v); // insert node
```

#### LeafNode::modify
There are two cases for leaf nodes: the leaf itself is being modified, or the leaf is the last element of a path and may be expanded to an internal node.

Leaves are edited if their key matches the target key. In this case, the edit function may either delete the node by returning `nothing`, or edit the node by returning a new value.

When modify is called on a leaf node and the target key does not match the node, instead of editing the leaf, a new node may be inserted. If a new leaf is inserted, the current leaf and new leaf nodes are merged to become descendants of a new internal node.

```js
LeafNode.prototype.modify = \shift f h k =self->
    ?k === self.key
        // Editing leaf
        :let v = f(self.value) in
            ?isNothing v
                :empty  // delete
                :new LeafNode(h, k, v) // edit
        
        // Potential expansion
        :let v = f() in
            ?isNothing v
                :self // noop
                :mergeLeaves(shift, self, new LeafNode(h, k, v)); // insertion
```

Two leaf nodes are merged recursively. Internal node levels are inserted until the two nodes no longer have conflicting hash fragments. Collisions occur when nodes have the same hash.

```js
var mergeLeaves = \shift n1 n2 -> let
    h1 = n1.hash,
    h2 = n2.hash
in
    ?h1 === h2
        :new CollisionNode(h1, [n2, n1])
        :let
            subH1 = hashFragment(shift, h1),
            subH2 = hashFragment(shift, h2)
        in
            ?subH1 === subH2
                // recursively merge next level
                :create1Internal(subH1, mergeLeaves(shift + SIZE, n1, n2))
                // Found lowest level, insert both children.
                :create2Internal(subH1, n1, subH2, n2);
```

Internal node creation operations:

```js
var create1Internal = \h n -> {
    var children = [];
    children.(h) = n;
    return new InternalNode(1, children);
};

var create2Internal = \h1 n1 h2 n2 -> {
    var children = [];
    children.(h1) = n1;
    children.(h2) = n2;
    return new InternalNode(2, children);
};
```


#### CollisionNode::modify
Collision nodes modify the matching leaf in their collision list. Deleted nodes are removed from the collision list. If a deletion results in a collision with one entry, the list is collapsed into a leaf node.

```js
CollisionNode.prototype.modify = \_ f h k =self-> let
    list = updateCollisionList(self.children, f, k)
in
    ?list.length > 1
        :new CollisionNode(self.hash, list)
        
        // collapse collision to leaf
        :list.(0); 
```

`updateCollisionList` takes a list of LeafNodes and returns a new list with the leaf with key `k` updated. If `f` returns nothing, 

```js
var updateCollisionList = \list f k ->
    ? !list.length
        :[]
        :let first = list.(0), rest = list.slice(1) in
            ?first.key === k
                // found node to edit
                :let v = f(first.value) in
                    ?isNothing v
                        :rest // deletion
                        :[v].concat(rest) // edit
                        
                // continue search on rest of list.
                :[first].concat(updateCollisionList(rest, f, k));
```


#### InternalNode::modify
InternalNode updates are the most complicated. Editing an internal node modifies a (potentially empty) child and rebuilds the `children` array with the modified child.

Child modification may either edit an existing child, insert a new child, or delete an existing child. Empty internal nodes are collapsed.

The child is edited with `alter`, increasing the shift by `SIZE` since the child is at the next level of the trie.

```js
InternalNode.prototype.modify = \shift f h k =self-> let
    frag = hashFragment(shift, h),
    child = self.children.(frag),
    newChild = alter(shift + SIZE, f, h, k, child)
in
    ? isEmpty child && !isEmpty newChild
         // added
        :new InternalNode(
            self.count + 1,
            arrayUpdate(frag, newChild, self.children))

        :? !isEmpty child && isEmpty newChild
             // removed
            :?self.count - 1 <= 0
                :newChild // collapse
                :new InternalNode(
                    self.count - 1,
                    arrayRemove(frag, self.children))
            
            // modified
            :new InternalNode(
                self.count,
                arrayUpdate(frag, newChild, self.children));
```

The child array update operations copy the array, then update it. This copies at most 16 elements.

```js
var arrayUpdate = \at v arr -> {
    var out = arr.slice(); // copy
    out.(at) = v;
    return out;
};

var arrayRemove = \at arr -> {
    var out = arr.slice(); // copy
    delete out.(at);
    return out;
};
```

## Update API

```js
var constant = \x -> \() -> x;

/// Edit entry for `k` with `f`.
/// `f` maps the current value to a new value.
/// `f` may create a new node if the target does not exist
modify = \k f m ->
    alter(0, f, hash k, k, m);

// Set entry for `k` to `v`.
setHash = \k v m ->
    modify(k, constant v, m);

/// Remove entry for `k`.
/// Noop if entry does not exist
removeHash = let del = constant nothing in
    \h k m ->
        modify(k, del, m);
```


```js
var h = set(‘a’, ‘x’,
    set(‘b’, ‘y’,
        empty);

// Edit node
var h1 = modify(‘b’, \x -> x.charCodeAt(0), h);
get(‘b’, h1); // 121
get(‘b’, h); // ‘y’

// Insert Node
var h2 = set(‘c’, ‘z’, h);
get(‘c’, h2); // ‘z’
get(‘c’, h); // null

// Set Node
var h3 = set(‘b’, ‘n’, h);
get(‘b’, h3); // ‘n’
get(‘b’, h); // ‘y’

// Remove Node
var h4 = remove(‘b’, h);
get(‘b’, h4); // null
get(‘b’, h); // ‘y’
```


# Folds 
One other useful operation is to aggregate information about every entry in the trie. The hash trie is unordered, so only order independent operations can be used. 

`fold` takes a function `f`, initial value `z`, and trie `m`. `f` is called with the previous result and the current key and value as in a object:

```js
fold = \f z m ->
    ?isEmpty m
        :z
        :m.fold(f, z);
```

The specialization for the nodes:

```js
Leaf.prototype.fold = \f z =self->
    f(z, self);

Collision.prototype.fold = \f z ={children}->
    children.reduce(f, z);

InternalNode.prototype.fold = \f z ={children}->
    children.reduce(fold@f, z);
```

## Usage
`fold` can be used to count the total number of entries:

```js
count = fold@ (+, 1) @ 0;
```

Or sum all values in the trie

```js
var add = \total {value} -> total + value;

sum = fold @ add @ 0;
```

Or implement other functions like `map` and `filter` (although specialized implementations of these would be more efficient):

```js
filter = \pred m ->
    fold(
        \p {key value} ->
            ?pred(key, value)
                :set(key, value, p)
                :p,
        empty,
        m);

map = \f m ->
    fold(
        \p {key value} ->
            set(key, f(key, value), p),
        empty,
        m);
```


# Summary
Hash tries are a good way to implement persistent hash maps or hash sets. They perform well, even as the size of the trie grows very large. For maps with more than ~20 entries, hash tries are also faster than achieving persistance using object copying.

I use hash tries as the memory data structure in [Atum][atum]. Just replacing object copies in this single location nearly doubled performance of the entire application.

The [hashtrie][hashtrie] library provides functionality beyond what I have covered here.

## Custom Key Types
The hash trie can easily be extended to use a custom key equality function. Pass an additional key compare argument to `lookup` and `alter`, and replace direct `===` key compares with this.

## Benchmarks
The more optimized [hashtrie][hashtrie] library performs very well, and is the fastest persistent hash trie Javascript library that I could find for gets and updates. 

[HAMT][hamt] is a hash trie storage optimization that drastically improves fold performance over the regular hash trie library.

The complete comparison results and the benchmarks are [available here][benchmarks].

```
Get nth element
hashtrie(10)      :      6656504.53 +/- 0.35% op/s
hashtrie(100)     :      5706375.45 +/- 0.28% op/s
hashtrie(1000)    :      4983980.62 +/- 0.13% op/s
hashtrie(10000)   :      3772045.35 +/- 2.02% op/s
hashtrie(100000)  :      1263399.72 +/- 2.57% op/s

Put nth element
hashtrie(10)      :      2498038.80 +/- 0.56% op/s
hashtrie(100)     :      1521326.10 +/- 5.50% op/s
hashtrie(1000)    :      1174134.59 +/- 0.83% op/s
hashtrie(10000)   :       778189.51 +/- 0.53% op/s
hashtrie(100000)  :       731133.51 +/- 0.56% op/s

Remove nth element
hashtrie(10)      :      1969302.11 +/- 0.28% op/s
hashtrie(100)     :      1443240.09 +/- 0.30% op/s
hashtrie(1000)    :      1090193.29 +/- 0.82% op/s
hashtrie(10000)   :       832995.92 +/- 1.40% op/s
hashtrie(100000)  :       498946.42 +/- 1.17% op/s

Put N elements
hashtrie(10)      :       192412.54 +/- 0.87% op/s
hashtrie(100)     :        13578.35 +/- 1.49% op/s
hashtrie(1000)    :         1076.75 +/- 0.51% op/s
hashtrie(10000)   :           74.66 +/- 2.02% op/s

Remove N Elements
hashtrie(10)      :       172198.62 +/- 0.84% op/s
hashtrie(100)     :        13000.77 +/- 6.13% op/s
hashtrie(1000)    :         1103.61 +/- 0.99% op/s
hashtrie(10000)   :           68.82 +/- 7.01% op/s

Count using fold
hashtrie(10)      :       121489.60 +/- 1.87% op/s
hashtrie(100)     :        15009.38 +/- 1.88% op/s
hashtrie(1000)    :         1452.19 +/- 2.08% op/s
hashtrie(10000)   :          129.26 +/- 2.10% op/s

Sum using fold
hashtrie(10)      :       386453.40 +/- 2.21% op/s
hashtrie(100)     :        37985.30 +/- 0.69% op/s
hashtrie(1000)    :         3506.61 +/- 0.42% op/s
hashtrie(10000)   :          323.98 +/- 1.04% op/s
```

[tries]: http://en.wikipedia.org/wiki/Trie
[wiki-hash-trie]: http://en.wikipedia.org/wiki/Hash_tree_(persistent_data_structure)
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure

[atum]: https://github.com/mattbierner/atum
[khepri]: https://github.com/mattbierner/khepri
[hamt]: https://github.com/mattbierner/hamt
[hashtrie]: https://github.com/mattbierner/hashtrie
[benchmarks]: https://github.com/mattbierner/js-hashtrie-benchmark
