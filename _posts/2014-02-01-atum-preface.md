---
layout: post
title: Atum Preface
date: '2014-02-01'
---
The functional implementation of programming languages has fascinated me recently. Breaking a language down to its core functionality, and expressing this functionality in composable functions offers many interesting opportunities not possible in a traditional, imperative language implementation.

Last year, I began development of [Atum][atum], an [ECMAScript 5.1][ecma51] interpreter in Javascript that uses functional programming techniques. In future posts, I'll be covering the interesting bits of Atum and the challenges of implementing ECMAScript.

# Why Functional Style?

The general benefits functional programming are already well documented. For programming language implementation specifically, functional-style programming makes sides effects explicit and allows complex behaviors to be build though composition.

## Composition and Side Effects
Interpreter functions explicitly express their [side effects][side-effects], so in composing functions to build more powerful language operations, we can ensure these too behave as expected. Explicit control of state is extremely helpful in programming language implementation and also enables richer tooling.

## Immutable Data Structures
The entire program state to be inspected, saved, and transformed without effecting other computations. The program state can even be extracted from a computation and run it in different computations without effecting the original. 


# Atum
Atum is the core part of a project building a complete ECMAScript implementation  in functional-style Javascript. Atum's goals are:

* Enable rapid prototyping and experimentation of the ECMAScript language.
* Support substantial hosted language alterations with minimal code changes.
* Functional style implementation.
* Minimal direct reliance on host language features.
* Support powerful debugging.

As an academic project, performance is a low priority (Atum may even be the slowest Javascript implementation ever).

## Prototyping
Atum allows prototyping new language features at a high level of abstraction, and new programming languages can even be build by composing Atum interpreter functions.

Consider a transactional try statement; that is a try statement that restores the original state if the try body fails. The details of this example are not important, but note how transactional try uses composition and a regular try statement and how the entire operation is expressed abstractly with few implementation details.

```js
var transactionalTryStatement = function(body, handlerId, handler, finalizer) {
    // Get current state.
    return bind(getState, function(state) { 
        // Then evaluate a regular try statement
        // with an exception handler that restores
        // the saved state.
        return tryStatement(
            body,
            handlerId,
            next(setState(state), handler), 
            finalizer);
    });
};
```

Even expansive language changes or additions, like lazy evaluation or probabilistic values, can be easily added by touching a few files. Atum makes language design iteration much more rapid, and even enables prototyping concepts like the transactional try that would be very difficult to implement in a traditional interpreter.

## Tooling
Atum provides a rich source of data on running programs and their state. A  program's entire state is captured in a single object, and all data structures are immutable. States can be safely saved and restored or transformed. 

Expressions can be evaluated without effecting a running program and programs can easily be paused and resumed. Such capabilities make Atum a powerful base on which tools like debuggers and development environments can be built. 



# Next
Next, I'll be covering the delimited continuation monad at the heart of Atum.


[atum]: https://github.com/mattbierner/atum
[side-effects]: http://en.wikipedia.org/wiki/Side_effect_(computer_science)
[ecma51]: http://www.ecma-international.org/ecma-262/5.1/