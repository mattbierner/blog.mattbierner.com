---
layout: post
title: Inlining in Khepri - Introduction
date: '2014-05-04'
---
I designed [Khepri][khepri] with function inlining in mind, but inlining support was only recently added to the compiler. This post overviews the Khepri compiler's inlining support. A later post will cover some of the specific challenges of inlining Javascript and how Khepri implements inlining. 

{% include image.html file="porkysrailroad.png" %}


# The Need For Inlining 
The functional programer solves a complex problem by composing the solutions of its independent subproblems. With the function as the base unit of computation, this approach produces lots of tiny functions, each of which does a simple computation or composes other computations.

Given the importance of functions and function application, it is very important that the overhead of calling a function be minimized. While modern Javascript runtimes can perform many millions of function calls per-second, each call still adds noticeable overhead, overhead that can far outweigh the cost of evaluating the body of a small function. 

```js
// These tiny functions from Nu are called hundreds of thousands of times
// during even simple Bennu parsing.
stream := \val f -> ({ first: val, rest: f });
first := (.first);
rest := \s -> s.rest();
isEmpty := (===, NIL);
```

Inlining a function call replaces the call with the function body. Even if the Javascript runtime supports inlining, there is often a benefit to inlining in the source. While not always appropriate, inlining enables the functional-style Javascript that Khepri targets to perform nearly as well as hand optimized imperative Javascript code. 

## Use With Khepri Builtins
Khepri also relies heavily on inlining to generate efficient code for its builtins.

Typical Javascript function composition adds unacceptable overhead:

```js
var compose := \a b -> \x -> b(a(x));

var f = compose((+, 10), compose((_/, 2), (_>, 5)));
```

Without inlining, calling `f` calls a total of five functions:

1. Call the function from outer `compose`.
2. Call `(+, 10)`
3. Call the function from the inner `compose`.
4. Call `(_/, 2)`
5. Call `(_>, 5)`

Khepri uses the exact same compose function definition for its composition `\>` operator, but the output after inlining is:

```js
var f = (+, 10) \> (_/, 2) \> (_>, 5);

// Output With Inlining -----
var f = (function(z) {
    var z0 = (10 + z),
        y = (z0 / 2);
    return (y > 5);
});
```

For a total of one function call per call to `f` (the example with `compose` will optimize to the exact same optimized output). Even when the `a` and `b` functions cannot be inlined at compile time, the inner `compose` calls always can be. The Khepri output has far less definition overhead too. 


# Khepri Inlining
The Khepri compiler can inline small function calls to eliminated call overhead. This section details when a function can or cannot be inlined, and how code may be effected by inlining. 

{% include image.html file="crowbar_36335_lg.gif" description="Work safe, work smart. Your future depends on it." %}

The compiler attempts to optimize code without effecting its visible behavior, but does make a few important exceptions for inlining. [Khepri's inlining documentation](https://github.com/mattbierner/khepri/wiki/inlining) has more comprehensive inlining documentation.

## Lambda Functions
Any call to a lambda function may be inlined. Lambda functions are functions that:

* Have an expression body. Functions with block bodies cannot be inlined at this time.
* Does not use a [fat arrow unpack](https://github.com/mattbierner/khepri/wiki/functions#fat-arrows-this-unpacks).

```js
// These are lambda functions
\ -> 1;
\x -> x;
\a#[{x}, y, ...xs] -> ...' 
\args(x ...) -> args;

// and these are not
\x -> { return x; };
\=self-> self.x;
\={x}-> x;
```

## Callees
Individual function calls may be inlined only when the compiler can safely resolve the callee to a lambda function. In general, a callee bound immutably to a lambda function can always be inlined.

```js
// Immutable bindings inlining ----
// This can always be inlined
var sqr := \x -> x * x;

// As can this
var callWith2 := \f -> f(2); 

// This inlines both `calleWith2` and the inner `f` for `sqr`
callWith2(sqr);
```

But calls with mutable callees can sometimes be inlined too, if the compiler can unambiguously resolve the callee to a lambda at that point of execution.

```js
// Mutable bindings inlining ----
var sqr = \x -> x * x;
sqr 2; // here we can inline because we know what `sqr` is

// This too can be fully inlined at this point
// because we can inline `cube` and we know what `sqr` is 
var cube := \x -> sqr(x) * x;
cube 3;

// But if we do some evil mutation
sqr = null;

// We can't inline `sqr` inside `cube` anymore
cube 3; // outputs: sqr(3) * 3;
```

#### No Methods
This brings up a major limitation of Khepri's inlining; only calls to functions, and not methods, can be inlined. There is simply no way for the compiler to safely determine the value of the method at compile time.

```js
// Inlining would be nice here
var math = {
    sqr: \x -> x * x
};

math.sqr(2);

// But we safely can't because of mutation
math.sqr = \x -> 4;

// This is the correct behavior of the program.
// Inlining would result in `math.sqr(3)` being 9 instead.
math.sqr(2); // 4
math.sqr(3); // 4
```

## Function Call to Let Expression Expansion
Khepri inlines a function call by expanding it to let expression. Let expressions have very little overhead and can be further optimized by later compiler stages.

```js
var add := \x y -> x + y;
add(1, 2);

// inline expansion ----
let x = 2, y = 2 in x + y;
```

The expanded let expression binds the inlined function's parameters to the function call arguments. Inlined function call arguments are evaluated left-to-right, before the body of the function. Scoping remains the same, with arguments evaluated in the callee scope, and the function body evaluated in the function's scope.

#### Unused Binding Removal 
Once a call is rewritten to a let expression, unused argument bindings may be pruned at compile time. 

```js
var mid = \_ ...mid _ -> mid;
mid(a(), b(), c(), d());

// inline expansion ----

// Ends are never evaluated
let mid = [b(), c()] in mid;
```

Regular function calls evaluate all arguments, even those that are never used, before evaulating the body. This difference is intentional and, I believe, justified. There are far more cases where it is highly beneficial to remove such unnecessary calculations then there are cases where code depends on evaluation of unused arguments.

# Other Differences and Limitations

## Arguments Object
Khepri can inline functions that use the `arguments` object, but inlining replaces the `arguments` object with a Javascript array of values. Code should only perform lookups on the `arguments` object, so usually this should not cause problems.

```js
var f := \args(x y) ->  (x + y) * args.length;

f(1, 2);
// inlines to
let x = 1, y = 2, args = [x, y] in (x + y) * args.length;
```

But this behavior can allow an inlined function call to work correctly, while a regular call would crash.

```js
var list := \args(...) -> args;

// This always works correctly, regardless of inlining
var a := list(1, 2, 3);
[].prototype.forEach.call(a, console.log);

// While this crashes if `list` is not inlined
// because `a` would be an arguments object and
// have no method `forEach`.
var a := list(1, 2, 3);
a.forEach(console.log);
```

A slice unpack however will always return a list:

```js
var list := \...args -> args;
```

## Lazy Function Body Evaluation
Some functions rely on lazy evaluation of the function body:

```js
// Here we are using a function to delay resolution of `s` to
// create a circular list.
var s = \ -> s;
s = stream(1, s);
```

Inlining `s` in the call to `stream` would resolve the `s` in the body of `s` early to `undefined`.

Functions that require this sort of lazy evaluation cannot be converted to expressions with inlining. A block function body may be used to explicitly disable unwanted inlining.

```js
var s = \ -> { return s; };
s = stream(1, s);
```

## No Linking
Khepri can currently only inline functions in a file, and therefore cannot inline calls to any imported function. 

Implementing cross file inlining is challenging. To inline an imported function in another file, expansion must rewriting closure variables to resolve to the function's source package. And in many cases, these closure variables are not exported from the source package.


# Conclusion and Limitations
The Khepri compiler's inlining support is a powerful but limited optimization that allows programmers to write functional-style code with very little overhead.

Simply recompiling [Neith][neith] and [Akh][Akh] once the Khepri compiler added inlining support improved overall performance of these libraries by around 1.2 and 1.5 times.




[khepri]: http://khepri-lang.com
[nu]: https://github.com/mattbierner/nu
[akh]: https://github.com/mattbierner/akh
[neith]: https://github.com/mattbierner/neith