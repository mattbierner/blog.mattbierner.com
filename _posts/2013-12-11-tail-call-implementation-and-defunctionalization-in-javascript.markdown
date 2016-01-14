---
layout: post
title: Implementing and Defunctionalizing Tail Calls in Javascript
date: '2013-12-11 23:24:12'
---
[Tail calls][tail-calls] are a necessary tool for functional-style Javascript. Without language support, tail calls are not an optimization, but  tail calls allow using recursion without worrying about stack size. 

I explore several tail call implementations and their relative performance. Even small optimizations can have big a performance impact. I start with the most simple solution, working up to one with 4x faster. Then a more drastic transformation, defunctionalization, is used to achieve 10x performance over the original. 

### Base Recursive Case
The base recursive factorial function should be familiar. I've written it to explicitly show the tail call: 

```js
var fac = let
   impl = \n, sum -> 
      ?n :impl(n - 1, n * sum) :sum
in
    \n -> impl(n, 1);
```

Large inputs would throw a `Maximum call stack` error, although Javascript's number representation ensures the output for factorial becomes meaningless well before then. As I'm only interested in the relative performance of different tail call implementations, I've purposely coded the functions to stop when Infinity is reached (inputs under `~170` should be used).

## Trampolined Tail Call Implementations
[Trampolines][trampoline] are one way to implement tail calls in Javascript. Trampolined code makes tail calls by directly returning a continuation for the call. A trampoline function externalizes control flow by repeatedly invoking tail continuations until finding a result.

The tail continuation must contain all of the information to continue the computation. A good trampoline implementation should be able to return any type, including functions. Several ways to implement a basic trampoline are detailed and their performance is compared. [The complete jsperf tests can be found here][external-tail-calls]. 

### Bind Tail Call
`Function.prototype.bind` is the easiest way to capture the tail continuation. Function `tailBind` creates a tail continuation that will invoke function `f` with a set of arguments. Tail continuations are marked with a `_next` property to distinguish them from regular function values.

```js
var tailBind = \f, ...  -> {
    var c = f.bind.apply(f, arguments);
    c._next = true;
    return c;
};
```

`trampolineBind` takes a possible continuation `k` and repeatedly invokes tail continuations until finding a value.

```js
var trampolineBind = \k -> {
    var value = k;
    while (value && value._next)
        value = value();
    return value;
};
```

Factorial can be written to hide these implementation details. In place of the call to `impl` in the recursive `fac`, a tail continuation from `tailBind` is returned. The outermost invocation of `fac` is wrapped in `trampolineBind` to extract the result. 

```js
var facBind = let 
    fac = \n, sum ->
        ?n
        	:tailBind(impl, n - 1, n * sum)
            :sum
in
    \n -> trampolineBind(fac(n, 1));
```

The use of `Function.prototype.bind` creates a lot of extra function objects. This is the worst performing tail call implementation.

### Simple Array
Suspecting that `Function.prototype.bind` is causing performance problems, this next approach inlines the behavior of a call to a bound function. Tail calls are stored as an array, with a function at the head and arguments as the remaining elements. 

```js
var tailArgs = \_f, ... -> {
    arguments._next = true;
    return arguments;
};

var trampolineArgs = \f -> {
    var value = f, call = Function.prototype.call;
    while (value && value._next)
        value = call.apply(value[0], value);
    return value;
};

var facArgs = let
    fac = \n, sum ->
        ?n
        	:tailArgs(fac, n - 1, n * sum)
            :sum
in
    \n -> trampolineArgs(fac(n, 1));
```

This [roughly doubles performance][external-tail-calls], but we can do better. A closer inspection of `trampolineArgs`  reveals that three functions are called for every tail call: `Function.prototype.apply` which calls `Function.prototype.call` which invokes the continuation.

### Smarter Array Storage
A simple array does not store data in a convenient format for making calls. By storing the data differently, one extra call can be eliminated. 

`tailArray` creates tail continuations from a function `f` and an array of arguments `args`.

```js
var tailArray = \f, args -> {
    var c = [f, args];
    c._next = true;
    return c;
};
```
This small change allows `trampolineArray` to only make two calls per tail call: `Function.prototype.apply` which invokes the continuation.

```js
var trampolineArray = \f -> {
    var value = f;
    while (value && value._next)
        value = value[0].apply(null, value[1]);
    return value;
};

var facArray = let
    fac = \n, sum ->
        ?n
        	:tailArray(fac, [n - 1, n * sum])
            :sum
in
    \n -> trampolineArray(fac(n, 1));
```

This further increases performance [by about 1.5x][external-tail-calls]. This two call `trampolineArray` is best general purpose approach I could develop to invoke tail calls. Using different a storage object however offers one final performance improvement. 

### Tail Call Object
Instead of storing tail call data in an specially marked array, they can be stored in a tail call object. `Tail` contains the same elements from the Smarter Array Storage.

```js
var Tail = function(f, args) {
    this.f = f;
    this.args = args;
};
```

Using an object is both safer and allows `trampolineTail` to reduce the `value && value._next` check to `value instanceof Tail`.

```js
var trampolineTail = \f -> {
    var value = f;
    while (value instanceof Tail)
        value = value.f.apply(null, value.args);
    return value;
};
    
var facTail = let
    fac = \n, sum ->
        return ?n
        	:new Tail(fac, [n - 1, n * sum])
            :sum
in
    \n -> trampolineTail(fac(n, 1));
```

The resulting code is about [4x faster][external-tail-calls] than the original bind implementation.


## Further Optimization
Even the Tail Call Object requires two calls for every tail call in order to unpack arguments. Sacrificing flexibility allows reducing this to a single call.

### Defunctionalization 
Instead of supporting generic continuations for any function and any arguments, the tail continuation is defunctionalized into a data structure that specifically identifies a continuation.

Defunctionalized factorial uses two continuations: `fac` for continuing computation and `done` for when a result has been found.

```js
var facDefunImp = \n, sum ->
    ?n
    	:['fac', n - 1, n * sum]
        :['done', sum];
```

The trampoline maps defunctionalized continuations to their specific implementation, requiring only a single call to invoke the continuation.

```js
var trampolineDefun = \k -> {
    var value = k;
    while (true) {
         switch (value[0]) {
         case 'done': return value[1];
         case 'fac': value = facDefunImp(value[1], value[2]); break;
         }
    }
};

var facDefun = \n -> trampolineDefun(facDefunImp(n, 1));
```

Defunctionalization is a much more destructive transform than the other tail call approches. It requires inlines and splits the factorial function's logic. For larger, more complex programs, defunctionalization will be really ugly.

Performance is [about 10x][defunctionalized-tail-calls] the original bind tail call approach.

As a side note, one interesting property of the defunctionalized factorial tail continuations is that they can be serialized.

### Tail Call Classes
If we encode tail calls by their arity, the logic of `Function.prototype.apply` can be inlined. This is a good compromise that is more general than defunctionalization but still uses a single call for the tail call. 

```js
var TailClass = function() {};

var TailClass0 = function \f =self-> {
	self.f = f;
};
TailClass0.prototype = new TailClass;
TailClass0.prototype.arity = 0;

var TailClass1 = function \f arg1 =self-> {
	self.f = f;
    self.arg1 = arg1;
};
TailClass1.prototype = new TailClass;
TailClass1.prototype.arity = 1;

var Tail2 = function\f arg1 arg2 =self-> {
	self.f = f;
    self.arg1 = arg1;
    self.arg2 = arg2;
};
Tail2.prototype = new TailClass;
Tail2.prototype.arity = 2;

var facClassImp = \n, sum ->
    ?n
    	:new TailClass2(facClassImp, n - 1, n * sum)
        :sum);

var trampolineClass = \k -> {
    var value = k;
    while (value instanceof TailClass) {
        switch (value.arity) {
        case 0: value = value.f(); break;
        case 1: value = value.f(value.arg1); break;
        case 2: value = value.f(value.arg1, value.arg2); break;
        }
    }
    return value;
};

var facClass = \n ->
    trampolineClass(facClassImp(n, 1));
```

Performance is [poorer than][defunctionalized-tail-calls] the defunctionalized calls, but still around 2x greater than the fastest other tail call implementation.

### Single Generic Tail Call Type
Finally, instead of defining a class for each arity, we can trade some performance to use a single tail call type again. 

```js
var TailGeneric = function\f, args =self-> {
    this.f = f;
    this.args = args;
    this.arity = args.length;
};

var facGenericImp = \n, sum ->
    ?n
    	:new TailGeneric(facGenericImp, [n - 1, n * sum])
        :sum);

var trampolineGeneric = \k -> {
    var value = k;
    while (value instanceof TailGeneric) {
        switch (value.arity) {
        case 0: value = value.f(); break;
        case 1: value = value.f(value.args[0]); break;
        case 2: value = value.f(value.args[0], value.args[1]); break;
        }
    }
    return value;
};

var facGeneric = \n ->
    trampolineGeneric(facGenericImp(n, 1));
```

Performance is [significantly worse][defunctionalized-tail-calls] than Tail Call Classes but better than the other alternatives.

## Closing Thoughts
Tail calls should only be used when necessary. Even the fastest tail call implementation is many times slower than direct recursion, and tail calls make debugging very difficult. When tail calls are necessary, different implementations have drastically different performance characteristics.

The Tail Call Object is best for the most generic tail call requirements, while Tail Call Classes require more code but are the best overall solution. For specific cases, defunctionalization will offer the greatest performance, although it usually makes code less maintainable.

[Parse][parse] will not work without tail calls and uses a single tail call type. This has helped increase Parse's performance many fold over the original implementation that used `bind` based tail calls.


[parse]: https://github.com/mattbierner/parse.js
[external-tail-calls]: http://jsperf.com/external-tail-calls/3
[defunctionalized-tail-calls]: http://jsperf.com/defunctionalized-tail-calls/5
[trampoline]: http://en.wikipedia.org/wiki/Trampoline_(computing)
[tail-calls]: http://en.wikipedia.org/wiki/Tail_call