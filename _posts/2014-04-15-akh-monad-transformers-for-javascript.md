---
layout: post
title: Akh - Monad Transformers for Javascript
date: '2014-04-15'
---
Akh is a small Javascript library of monad transformers and structures. This post briefly covers why monad transformers are useful in Javascript, and offers a very high level look at the monad transformer Akh offers and their interface.

{% include image.html file="CC1279-Welcome-to-Wackyland-DX.jpg" description="Akh - A large flightless bird native to Fantasy Land" %}

# Why Monad Transformers are Useful in Javascript
Even in untyped, non-functional language like Javascript, monads are an extremely useful abstraction. It is fairly trivial to define and use monads like the state, error, and list monads in Javascript.

But beyond toy examples, real world problems often require functionality from one or more of these structures. A networked application may require both error handling and IO, or an algorithm implementation may use state, error handling, and continuation control. The question is how to compose a set of simple structures together in a maintainable and flexible way.

## The Problem with Monoliths
One potentially tempting approach is to define a big structure that has every functionality we need in our application. 

{% include image.html file="2001-last-monolith.jpg" description="My god it's full of state ... and error too" %}

Say we need state and error handling. Why not just define a new struture that does both? 

```js
var StateAndError = function \run =self-> {
    self.run = run;
};

StateAndError.of = \x ->
    new StateAndError\s ->
        ({state: s, value: {error: false, value: x}});
        
StateAndError.chain = \c f ->
    new StateAndError\s -> let
        o#{state, 'value': {error, value}} = c.run(s)
    in
        ?error
            :o // Appropriate emotion when reading such code
            :f(value).run(state);
```

But complex structures like `StateAndError` are not maintainable or flexible. Such manual composition burdens the programmer and produces fragile and unmaintainable structures. Correctly composing two or more structures together can be very difficult, and we have to break down the nice separation of concerns afforded by the original `State` and `Error` structures.

```js
/// State ops
StateAndError.get = new StateAndError\s -> 
    ({state: s, value: {error: false, value: s}});
    
StateAndError.put = \s ->
    new StateAndError\_ -> 
        ({state: s, value: {error: false, value: null}});
       
// Error op
StateAndError.fail = \x ->
    new StateAndError\s -> 
        ({state: s, value: {error: true, value: x}});
```

The state operations have know about error handling and the error handling operation must know about state and how to thread state though computations. 

Any change to the structure is going to be painful. Want to branch the stateful computations from `StateAndError` using `List`.  Get ready to rewrite every non-derived operation and spend some quality time tracking down subtle bugs.

It is also impossible to reuse a monolithic structure like `StateAndError` for a different application with slightly different requirements because `StateAndError` hardcodes the composition of State and Error in a way that can not easily be modified.

## Monad Transformers
[Monad transformers][monad-transformers] let programers compose monads while maintaining separation of concerns. A transformer takes an inner monad, and outputs a new monad with some specific functionality or properties. The `StateT` transformer outputs a monad that passes state value pairs though the inner monad, the `ListT` transformer outputs a list of results in the inner monad. Most common monads can be easily rewritten to a monad transformer applied to the identity monad.

```js
/// A branchable state computation
var M = StateT (List);
```

Multiple transformers can be used to build stack of monad transformers. Each layer in such a stack knows only how transform an opaque base monad and how to lift an operation from the base monad into the result monad.

```js
// Khepri compiler Lexical check monad, demonstrating
// a more complex stack.
// `TreeZipperT` is just `StateT` with ops for Neith zippers.
// `Unique` is just `State` with an operation to get a unique int.
var M = ErrorT (TreeZipperT (StateT (Unique)));
```

To use such a stack, programmers only have to know which operations each level provides, and where each level resides in the stack.

```js
// Lifting from top level `TreeZipperT` operations
var up = M.lift (M.inner.up);

// Lifting though multiple levels
var getState = M.lift (M.inner.lift (M.inner.inner.get));
```

In short, monad transformers allow us to compose simples structures with a single well defined function (such as state or error handling), using a set of abstract operations, all without having to understand how the structures or the composition is implemented. 
 
## Problems With Existing Implementations
A brief search turned up a few existing Javascript monad transformer implementations scattered across NPMJS and Github. However, I could not find a complete set of transformers, and many existing existing implementations are only useful for toy problems.

Javascript's limited stack size and lack of tail call elimination is a major issue for monads, specifically in the Cont and State monads.

```js
/// The easy way to implement Cont, which also will crash for
/// any interesting application
var Cont = function \run =self-> { self.run = run; };

Cont.of = \x -> new Cont\k -> k(x); 

Cont.chain = \c f -> new Cont\k -> c.run(\x -> f(x).run(k));
```

```js
// This will quickly blow up the stack using the above implementation
var f = \x ->
    ?x > 100000
        :Cont.of(x);
        :Cont.of(x + 1).chain(f);

f(0).run(\x -> x);
```

I needed a monad transformer library that could be used in real world applications. 


# Akh
[Akh][akh] is a small, extensible collection of important monad transformers and core operations. Akh structures implement the [Fantasy Land][fantasy-land] interface for monads, functors, applicative functors, and monoids. This allows Akh to be used with any library that supports Fantasy Land. The implementation is a rough translation of [MTL][mtl] to the untyped world of Javascript.

Akh includes the following transformers that implement Fantasy land interfaces:

* `IdentityT` - `akh::trans::identity` - Transforms a monad to itself. (Monad, Functor, Applicative Functor)
* `StateT` - `akh::trans::state` - State transformer. (Monad, Monoid, Functor, Applicative Functor)
* `ListT` - `akh::trans::list` - List transformer. (Monad, Monoid, Functor, Applicative Functor)
* `ContT` - `akh::trans::cont` - Continuation transformer. (Monad, Functor, Applicative Functor)
* `EitherT` - `akh::trans::either` - Either transformer. (Monad, Monoid, Functor, Applicative Functor)
* `ErrorT` - `akh::trans::error` - Error transformer. (Monad, Monoid, Functor, Applicative Functor)
* `DContT` - `akh::trans::dcont` - Delimited continuation transformer. (Monad, Functor, Applicative Functor)

Akh also provides base structures derived from these transformers, along with a small set of important operations, such as `liftM` and Kleisli composition. Full documentation of the library can be [found on the Akh wiki][documentation].

Akh's `State`, `Cont`, and `DCont` structures correctly handle tail call. The library has been successfully used for fairly complex real world applications, such as the [Khepri compiler][khepri-compile].

## Simple Monad Transformer Example
Any combination of transformers can be used to construct a monad transformer stack:

```js
// Branchable state computation
var M = StateT (List);

var run = StateT.runStateT \>> List.runList;

// Create a structure
var c = M.of(1) // simple value

    // modify State
    .chain(\x ->
        M.modify \ s -> s + x + 'xyz')
    
    // Branch states
    .concat(
         M.put('new_state').map(\ -> 3),
         M.of 10,
         M.get // get the current state)
     
     // And operate all the branched states
     .map(_ +, 'aa');
```

```js
run(c, 'state');
output:
[
    {x: '1aa', s: 'state1xyz'},
    {x: '3aa', s: 'new_state'},
    {x: '10aa', s: 'state1xyz'}
    {x: 'state1xyzaa', s: 'state1xyz'}
]
```

## Lifting
A transformed monad can lift operations from the inner monad by calling `lift`
([Documentation](https://github.com/mattbierner/akh/wiki/transformers)).

```js
// A simple example.
// In Akh, the state ops are automatically lifted by most core transformers,
// so you never have to actually write this code
var M = ErrorT State;

M.get = M.lift (State.get);
M.put = M.lift <\ State.put;
```

For larger stacks, referencing and lifting between multiple levels can be tedious. We don't have a type system, so Akh transformer allows getting the inner type of a transformer with `M.inner`.

```js
var M = ErrorT (StateT (List));
M.inner = StateT (List);
M.inner.inner = List;
```

`liftInner` ([documentation](https://github.com/mattbierner/akh/wiki/transformers#mliftinner)) allows lifting from an inner monad without directly referencing the inner types.

```js
var M = ErrorT (StateT (StateT State));

// To read/write the first state.
M.lift (M.inner.get); 

// To read/write the middle state
M.liftInner (M.inner.get);

// To read/write the innermost state.
// `liftInner` can be chained 
M.liftInner.liftInner (M.inner.inner.get);
```

## Examples and 3rd Party transformers
The [Khepri compiler][khepri-compile] demonstrates some of coding the benifits of using Akh monad transformers to structure computations.

```
// Excerpts from the Khepri lexical scoping stage 
var M = ErrorT (TreeZipperT (StateT (Unique)));

/* Scope ops */
var extractScope = M.liftInner (M.inner.inner.get);
var modifyScope = M.liftInner <\ M.inner.inner.modify;

var push = modifyScope scope.push;
var pop = modifyScope scope.pop;

/* Zipper ops */
var up = lift (M.inner.up);
var moveChild =  lift <\ M.inner.child;

var extract = lift (M.inner.node);
var inspect = M.chain @ extract;

/* high level ops */
/// Register a mutable binding the current scope
var addMutableBinding = \id loc -> 
    modifyScope \ s ->
        scope.addMutableBinding(s, id, loc);
 
/// Create a new lexical block for body.
var block = \body(...) ->
    seq(
        push,
        seqa body,
        pop);

/* Actual lexical check for a node */
addCheck@'IfStatement' <| seq(
    checkChild 'test',
    block(
        checkChild 'consequent'),
    block(
        checkChild 'alternate'));
 
addCheck@'VariableDeclarator' <| seq(
    inspect \ {id} ->
        addMutableBinding(id.name, id.loc),
    checkChild 'id',
    checkChild 'init');
```

The details are unimportant. What this example shows is how Akh monad transformers allow building a library of operations that using the different capabilities of each layer in the stack. Complex but maintainable programs can be expressed at a high level though the composition of these well-defined monad stack operations.


[Stream-m](https://github.com/mattbierner/stream-m) is a transformer for lazy, potentially infinite [Nu][nu] streams. This is closer to Haskell's `ListT` than `akh::trans::list`, which uses Javascript arrays.

[Zipper-m](https://github.com/mattbierner/zipper-m) defines a [Neith][neith] zipper monad transformer.


## Known Limitations and Contributing
Akh does not include any IO functionality at the moment, or the Reader and Writer monads. Any improvements or additions to the library are welcome.


[mtl]: http://hackage.haskell.org/package/mtl

[akh]: https://github.com/mattbierner/akh
[nu]: https://github.com/mattbierner/nu
[neith]: https://github.com/mattbierner/neith
[khepri]: https://github.com/mattbierner/khepri
[khepri-compile]: https://github.com/mattbierner/khepri-compile
[zipper-m]: https://github.com/mattbierner/zipper-m
[monad-transformers]: http://en.wikibooks.org/wiki/Haskell/Monad_transformers
[documentation]: https://github.com/mattbierner/akh/wiki
