---
layout: post
title: Adding State
date: '2014-02-07'
---
Building Atum using monads makes it easy to add new features to the interpreter without breaking its existing functionality. All we have to do is update the monad. Existing computations will continue to work and new computations can be written that make use of the interpreter's new features. 

In this post, I add state to the [delimited continuation monad][mb-decont], and define a small set of operations for working with state.

*[Monad Transformers and Modular Interpreters][modular-interpreters]* details an  elegant approach to interpreter design in a purely functional language. Atum is inspired by this work, but makes some compromises that I feel work better for Javascript (In this case, I believe you probably want to would use the [delimited control transformer][cct] `CCT` over a state monad).

# Adding State to the Interpreter Monad
Adding state to a monad requires the monad to thread state though computation along with values. Building on the delimited continuation monad, state also need to be threaded though the continuations. A small set operations will allow computations to get and set the state.

## ComputeContext
Atum breaks the state into two records:

`ComputeContext` is the top level state object passed though computations and continuations. It records data required by core computations and operations, but doesn't know anything specific about the target language being evaluated.

The user state holds the ECMAScript interpreter state, storing things like current environment and source location of executing code. The user state is stored inside the `ComputeContext`. 

The initial `ComputeContext` record is defined using [Bes][bes] and has two fields: `userData` for the user state and `unique` for a unique identifier in the state.

```js
var ComputeContext = record.declare(null, [
    'userData', // The user state
    'unique']); // Unique open identifier
```

The initial computation context is:

```
ComputeContext.empty = ComputeContext.create(null, 1);
```

## Basic Operations
The [StateT transformer][statet] adds state to a monad by making the value passed though continuations a pair of value and state. For Atum, I find it clearer to explicitly thread a state object though computations instead of using a pair.

`just` and `bind` from the delimited continuation monad are updated to take an additional state parameter `ctx` along with the continuation `k`. The continuations themselves take two arguments: a value and a state.

`just` sets the value while passing the state though.
 
```js
var just = function(x) {
    return function(ctx, k) {
        return appk(k, x, ctx);
    };
};
```

`bind` passes the input state to `c`, and threads the state resulting from `c` though to the result of `f`. Function `f` only operates on the value result of `c`.

```js
var bind = function(c, f) {    
    return function(ctx, k) {
        return c(ctx, pushSeg(f, k));
    };
};
```

The updated version of `appk` threads the state though the continuations.

```js
var appk = function(k, x, ctx) {
    do {
        if (typeof k === 'function')
            return k(x, ctx);
        
        var top = first(k);
        if (top instanceof Seg)
            // pass `f` value but thread state though result
            return top.frame(x)(ctx, rest(k)); 
        
        k = (top instanceof P ? rest(k) : top);
    } while (true);
};
```

## Continuation Operations
The [four primitive delimited continuation operations][mb-decont] also have to be updated to thread state along with a value though computations and continuations. `pushPrompt`, `withSubCont`, and `pushSubCont` all simply pass state though.

```js
var pushPrompt = function(prompt, c) {
    return function(ctx, k) {
        return c(ctx, cont.pushP(prompt, k));
    };
};

var withSubCont = function(prompt, f) {
    return function(ctx, k) {
        var sub = cont.splitSeq(prompt, k);
        return f(sub[0])(ctx, sub[1]);
    };
};

var pushSubCont = function(subk, c) {
    return function(ctx, k) {
        return c(ctx, cont.pushSeq(subk, k));
    };
};
```

`newPrompt` can be implemented properly now. It returns a prompt that is unique in the computation context, using `unique` stored in `ComputeContext` and updating the state by incrementing this value. `ComputeContext` is a [Bes][bes] record so `setPrompt` returns a copy of `ctx` with a new value for `unique`.

```js
var newPrompt = function(ctx, k) {
    return cont.appk(
        k,
        ctx.unique,
        ctx.setUnique(ctx.unique + 1));
};
```

## Running Computations
Computations are run by passing in an initial state `ctx` along with the outermost continuation `k`.

```js
var run = function(c, ctx, k) {
    reutrn c(ctx, cont.push(k, cont.empty));
};
```

Running a [previously defined][mb-lift] computations demonstrates that previous non-stateful computations continue to work.:

```js
run(
    add(
        number(3),
        add(
            number(2),
            number(1))),
    ComputeContext.empty,
    console.log); // number 6
```


# State Operations
A few new operations allow computations to get and set the state.

## Compute Context Operations
`modifyComputeContext` changes the state. It takes a function `f` and returns a computation that maps its state to a new state using `f`. The new state is also returned as the value:

```js
var modifyComputeContext = function(f) {
    return function(ctx, k) {
        var newCtx = f(ctx);
        return appk(k, newCtx, newCtx);
    }
};
```

`setComputeContext` sets the state to a new value directly instead of using a mapping function:

```js
var setComputeContext = fun.compose(modifyComputeContext, fun.constant);
```

`computeContext` returns the current state as a value and does not change the state.

```js
var computeContext = modifyComputeContext(fun.identity);
```

And `extractComputeContext` uses a function `f` to extract some data from the state and returns this data as a value.

```
var extractComputeContext = function(f) {
    return bind(computeContext, from(f));
};
```

## User Context Operations
The same operations are defined for interacting with the user state.

```js
var modifyContext = function(f) {
    return modifyComputeContext(function(ctx) {
        return ctx.setUserData(f(ctx.userData));
    });
};

var setContext = fun.compose(modifyContext, fun.constant);

var context = modifyContext(fun.identity);

var extractComputeContext = function(f) {
    return bind(context, from(f));
};
```

# Next
We now have an interpreter with state and can start defining stateful computations. I'll build on this work next time to add memory and references to the interpreter, while still using persistant data structures.


[atum]: https://github.com/mattbierner/atum
[bes]: https://github.com/mattbierner/bes

[modular-interpreters]: http://haskell.cs.yale.edu/wp-content/uploads/2011/02/POPL96-Modular-interpreters.pdf

[cct]: http://hackage.haskell.org/package/CC-delcont-0.2/docs/Control-Monad-CC.html
[statet]: http://hackage.haskell.org/package/transformers-0.2.1.0/docs/Control-Monad-Trans-State-Lazy.html

[mb-lift]: /primitive-operations-as-computations/
[mb-decont]: /the-delimited-continuation-monad-in-javascript/