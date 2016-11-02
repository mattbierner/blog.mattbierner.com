---
layout: post
title: A Review of ECMAScript Language Function Syntaxes and the Rational Behind Khepri's
  Function Syntax
date: '2013-12-16'
---
I review and critique a few ECMAScript language function expression syntaxes. Then I overview [Khepri's][khepri] function syntax and discuss how it has helped the language. 

# A Review of ECMAScript Language Function Expression Syntaxes

## ECMAScript 5.1
The [ECMAScript 5.1][ecmascript51] function syntax values consistency over brevity and clarity. Function expressions start with the `function` keyword and must be defined with a block statement body.

```js
var fac = function(n) {
    return n === 0 ? 1 : n * fac(n - 1);
};
```

For short functions that map to expressions, about half of the code is visual noise. `function`, the opening and closing braces, and `return` just add unnecessary typing for the programmer and obscure the actual logic.

## ECMAScript 6
The [ECMAScript 6 draft][ecmascript6draft] adds fat arrow function syntax for lambda functions. This is a significant step in the right direction, but I disagree with the syntax choices of fat arrows. (It should also be noted the fat arrows actually have subtly different behavior than regular functions too).

```js
var fac = n => n === 0 ? 1 : n * fac(n - 1);
    
// or
var fac = (n) => n === 0 ? 1 : n * fac(n - 1);
    
// or, with function body
var fac = n => {
    return n === 0 ? 1 : n * fac(n - 1);
};
```

Fat arrows are very concise and require only two characters for every function. [Coffeescript][coffeescript] and many other *script languages use similar syntax (Khepri 0.0.0 - 0.2.0 also used this). 

#### Conflict with Expression 
I find fat arrow syntax is inconsistent. There is not no symbol to identify the start of a arrow function expression, so without additional grammar productions it is imposible to distinguish fat arrow parameters from expressions.

Expressions like `n` or `(p1, p2, p3)` are valid on their own, so a left to right parsing would be ambiguous until `=>` is hit.

```js
var x = (p1, p2, p3) => p3;

//Extreme cases would require excessive backtracking:
var lots_of_args = (p1, p2, /*.....*/, p1000) => 1;
```

The spec handles this problem with the `CoverParenthesisedExpressionAndArrowParameterList` production. That name alone should signal something is wrong.

#### Fat Arrow is Not a Standard Binary Operator
We could consider `=>` an infix binary operator, but `=>` works completely differently than those. Normal binary operators take a left and right expression and apply an operation to them, but `=>` effects the parsing of the expression on its lefthand side. When `=>` is encountered, the lefthand side is taken as a list of symbols, not the expression's value.

#### Worked Into a Corner
ECMAScript 6 introduces syntax for binding patterns in parameter lists, but limits patterns to regular function expressions. To see why, consider:

```js
var first = [f, ...r] => f;
```

This hypothetical syntax conflicts with both array literals and bracket accessors.

```js
[a, b, c] => 0;
[a, b, c][i] => i;

//Even limiting parameters to parenthesized parameter lists will not work.
([x, y]) => x;
```

Binding patterns are arguably most useful in lambda functions, so limiting them to function expressions feels completely arbitrary.

Any expansion of function expression syntax requires significant additions to the grammar.

# Khepri
Khepri grew out of my frustration with Javascript's verbosity for functional style programming. Indeed, Khepri 0.0.0 was just ECMAScript 5.1 with lambda function syntax and no semicolon insertion. I find it quite striking how easily ECMAScript can be modified to support lambda functions.

Khepri's function syntax is inspired by Haskell. I don't claim this is the only, or even best, way to express functions, but it works well for Khepri's purposes and has allowed the language to easily support new features.

#### A Minimal Function Syntax
ECMAScript language functions must be able to:

* Take zero or more parameters (ideally patterns or other elements too).
* Give some mapping for the function.
* Optionally give the function a name.
* Be unambiguous with lookahead 1 parsers.

#### Lambda Functions
Khepri supports both regular ECMAScript 5.1 function expression syntax and a lambda function syntax. 

The `\` symbol denotes the start of a lambda function and the `->` symbols denote a mapping. 

```js
var fac = \n -> n === 0 ? 1 : n * fac(n - 1);

// No parameters, right associative
var constant = \x -> \() -> x;

// Multiple parameters (commas are optional in all patterns)
var add = \x y -> x + y;
```

Another way to think about this is that `\` is a prefix for a parameter list literal and `->` is an infix operator that creates a lambda function that maps a parameter list to a expression.

Lambda Functions can also map to block statements

```js
\e -> {
    if (e) {
        action1();
        return false;
    }
    action2();
    return true;
};

// Returning object literals from lambda functions
// requires wrapping in parenthesis.
\x -> ({'x': x});
```

## Patterns
Using `\` to identify parameter lists allows Khepri to easily introduce additional functionality into parameter lists without any conflicts. This is used for unpack patterns:

```js
// Unpack the first argument into x at 0, and y at 1.
\[x y] -> x;

// Unpack the first argument into x at 'x' and y at 'z'.
\{x, 'z': y} -> x + y;

// Nested Patterns
var dot2 = \[[a b], [x y]] -> a * x + b * y;
```

## Arguments
The only way to access the arguments object is using a pattern to unpack in a lambda function. This eliminates the need for the magic `arguments` identifier.

```js
\args(a1 a2 ...) -> args.length;

// All functions can also be written using anon argument unpacks
\(p1 p2 ...) -> p1 + p2;
```

Unlike the other patterns, which can also be used in function expressions, only lambda functions can use the arguments unpack. Function expressions always use anon argument unpacks.

## Named Functions 
Since regular ECMAScript functions are valid in Khepri, one way to name functions already exists. But ECMAScript function expression can't use an arguments unpack, so shorthand for naming lambda functions is also available:

```js
var fac = function fac \n ->
    n === 0 ? 1 : n * fac(n - 1);

var fac = function fac \n -> {
    return n === 0 ? 1 : n * fac(n - 1);
};

var fac = function \n ->
    n === 0 ? 1 : n * fac(n - 1);
```

## Style Guidelines
I generally follow these rules for deciding which form to use:

* Always prefer unnamed lambda functions.
* Only use standard ECMAScript 5 function expressions for constructors.
* Never use the syntax `function \n -> n`.
* Only use the arguments unpack for accessing the arguments value or for empty parameter lists.
* Prefer `\() -> 1` to `\ -> 1`.
* Prefer omitting commas in patterns.
* Always use whitespace between pattern elements, i.e. `{x} {y}` instead of `{x}{y}`.
* Use commas with very long names or when complex patterns would make understanding the signature more difficult


# Closing Thoughts
Khepri's syntax for function is brief, consistant, and avoids some of the pitfalls that I feel exist in other solutions. It has allowed functions to be significantly augmented with complex patterns and lets commas be optional. 


[khepri]: https://github.com/mattbierner/khepri
[ecmascript51]: http://www.ecma-international.org/ecma-262/5.1/
[ecmascript6draft]:https://people.mozilla.org/~jorendorff/es6-draft.html
[Coffeescript]: http://coffeescript.org/#literals