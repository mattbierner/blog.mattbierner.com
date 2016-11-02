---
layout: post
title: Khepri Slice Unpacks
date: '2014-04-10'
---
[Khepri][khepri] V0.22 adds slice unpacks for unpacking a range of values to an array. Here I briefly cover slice unpacks. You can find the Khepri [language documentation here][documentation].

## Rational
Functions that take an arbitrary number of arguments are common in Javascript, but writing such variadic function is fairly confusing and requires a lot of boilerplate code.

```js
// Example only, using `reduce` would be better
var sumArgs = function(x /*, ...*/) {
    return arguments.length
        ? x + sumArgs.apply(null, [].slice.call(arguments, 1))
        : 0;
}; 
```

Accessing parameters offset from the end of a variadic function is similarly verbose and error prone.

```js
var lastArg = function(/*...*/) {
    return arguments[arguments.length - 1];
};
```

And because variadic function behavior is not standardized, it is easy to introduce subtle bugs:

```js
// This function almost certainly does not behave as we expect.
var first_and_last = function(x /*, ...*/) {
    return x + arguments[arguments.length - 1];
};

first_and_last(1, 2, 3, 4); // 5
first_and_last(1); // 2
```

## Slice Unpacks Intro
Khepri's slice unpacks standardizes the expression and implementation of variadic functions. 

```js
var sumArgs = \args(x ...xs) ->
    ?args.length
        :x + sumArgs.apply(null, xs)
        :0;
```

Slice unpacks expand in a function to capture zero or more values as an array. They also enable arguments at relative indicies to be consistently expressed and used.

```js
var first_and_last = \f (...) l -> f + l;

first_and_last(1, 2, 3, 4); // 5
first_and_last(1); // NaN since, 1 + undefined
```

# Slice Unpack Semantics

## Syntax
A slice unpack consists of `...` followed by an optional identifier, which is used to access the array of sliced values by name. A single slice unpack may appear anywhere in an [argument list][argument-lists] or [array unpack][array-unpacks]. 

```js
// Unpack args
var restArgs := \_ ...xs -> xs;

// Unpack first argument array
var restArr := \[_ ...xs] -> xs;
```

An arbitrary number of unpacks may appear both before and after the slice unpack:

```js
var f := \[a] b [{d}] ...xs x [y] {z} -> ...;
```

When the identifier is omitted and unpacks after the slice are used, be sure to wrap the `...` in parenthesis, or follow `...` with a comma. This prevents the next unpack from being interpreted as the identifier for the slice.

```js
// This creates a slice unpack called b
\a ... b -> ...;

// While this creates an unpack `b` for the last argument 
\a (...) b -> ...;
```

## Slice Unpack
The slice unpack will capture between *0* and *length_array - #real_unpacks* values. The number of real unpacks is the total number of unpacks that appears in the array or argument pattern, both before and after the slice.

```js
// #real_unpacks = 2
var mid := \[f ...as l] -> as;

mid [1, 2, 3, 4]; // [2, 3]
mid [1, 2, 3]; // [2]
mid [1, 2]; // []
mid [1]; // []
mid []; // []
```

The value of a slice unpack will always be a Javascript array. This behavior can be used to convert a function's arguments object to an array.

```js
// This is an error since `args` is an arguments object
\args(...) -> args.map(...)

// Since `args` is an array, this is ok.
\...args -> args.map(...);
```

## Relative Unpacks
Many languages require slice style unpacks to be the last element of a parameter list. Khepri slice unpacks may appear anywhere in the parameter list,  and this allows unpacking relative values.

Any unpacks that appears after the slice unpack are taken relative to the end of the array.

```js
var last := \[(...) l] -> l;

last [1, 2, 3]; // 3

var last_two := \[(...) s l] -> [s, l];

last_two [1, 2, 3, 4]; // [3, 4]
```

Khepri's handling of relative values differs somewhat from other scripting languages, such as [LiveScript][livescript]. In `first_and_last`, some languages take `l` to be last element of the arguments array. For a small input array, this may result in multiple parameters referencing the same value.

```js
// Behavior of relative values in LiveScript
first_and_last = (f (...) l) -> f + l;

first_and_last(1); // 2
```

I feel this is incorrect. When a slice unpack collapses to contain zero elements, Khepri behaves as if the slice unpack is removed from the unpack set. Every unpack set in an argument list or array unpack expects at least *#real_unpack* elements. 

```js
// What khepri does
var first_and_last = \f (...) l -> f + l;

first_and_last(1); // NaN
// first_and_last becomes \f l -> f + l;
// f = 1
// l = undefined
```


# Conclusion
Khepri slice unpacks standardize the behavior of variadic functions, and remove most need for error prone lookups on the `arguments` object. They also make array unpacks more powerful. Relative unpacks are also a useful addition to the language.


[khepri]: https://github.com/mattbierner/khepri
[documentation]: https://github.com/mattbierner/khepri/wiki/unpack-patterns#slice-unpack
[array-unpacks]: https://github.com/mattbierner/khepri/wiki/unpack-patterns#array-pattern
[argument-lists]: https://github.com/mattbierner/khepri/wiki/functions#arguments-pattern

[livescript]: http://livescript.net