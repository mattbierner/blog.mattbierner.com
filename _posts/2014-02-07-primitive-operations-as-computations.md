---
layout: post
title: Lifting Primitive Operations to Computations
date: '2014-02-07'
---
With a [monad defined][mb-decont] and a small library of [primitive operations][mb-atum-prims], we can start building a library of ECMAScript interpreter computations.

I'll demonstrate how and why [Atum][atum] lifts primitive operations to computations in the delimited continuation monad. The result is the first version of an ECMAScript interpreter: a very simple calculator. 

# Lifting and Composition
I previously defined a small library of [primitive hosted value types and operations][mb-atum-prims]. But those function have no concept of delimited control and cannot be used directly with the delimited continuation monad. A few higher-order functions handle this problem.

## From
`from` takes an n-ary function `f` and composes it with `just`.

```js
var from = function(f) {
    return function(/*...*/) {
        return just(f.apply(this, arguments)));
    };
};
```

`from` applied to a few of the primitive value operations:

```js
/// Primitive value creation computations
var boolean = from(boolean_value.create);
var string = from(number_value.Number.string);
var number = from(number_value.Number.create);

/// Type conversion computations
var toBoolean = from(type_conversion.toBoolean);
var toNumber = from(type_conversion.toNumber);
var toString = from(type_conversion.toString);
```

The converted forms can now be used directly in delimited continuation monad computations.

```js
run(
    bind(boolean(true), toString),
    console.log); // prints string "true"
```

## Lift
`lift` takes a unary function `f` and returns a new function that performs `f` in the monadic context. The result of `lift` is a unary function takes a monadic value `m` as its argument, and returns a monadic result of `f` applied to the result of the input computation.

```js
var lift = function(f) {
    return function(m) {
        return bind(m, function(x) {
            return just(f(x));
        });
    };
};
```

`lift2` applies the same logic to a binary function. 

```js
var binary = function(left, right, f) {
     return bind(left, function(x) {
        return bind(right, function(y) {
            return f(x, y);
        });
    });
};

var lift2 = function(f) {
    return function(m1, m2) {
        return binary(m1, m2, function(x, y) {
            return just(f(x, y));
        });
    };
};
```

Lifting eliminates a lot of boilerplate wrapping and unwrapping of values. 

```js
var addM = lift2(number_value.add);

run(
    addM(
        number(3),
        addM(
            number(5),
            number(1))),
    console.log); // number 9
```

## Composition
One other useful operation is to compose two monadic functions. [Kleisli composition][kleisli-compose] takes two unary functions `f` and `g` that map values to computations, and returns a new function that maps to the result of `f` and `g` sequenced with `bind`.  

```js
var compose = function(f, g) {
    return function(x) {
        return bind(f(x), g);
    };
};
```

`compose` composes `f` and `g` left-to-right. The `isTrue` computation for example checks if a hosted value is truthy:

```js
var isTrue = compose(
    toBoolean,
    from(boolean_value.isTrue));
```

# Number Computations
We can now start building up a library of ECMAScript computations by applying `lift` and `from` to the primitive value operations.

## Number Operations
All of the binary number value operations convert both of their arguments to numbers.

`_binaryOperation` lifts a primitive number operations and convert its arguments using two type conversion computations.

```js
var _binaryOperation = function(op, leftType, rightType) {
    leftType = (leftType || toNumber);
    rightType = (rightType || toNumber);

    return function(left, right) {
        return lift2(op)(
            leftType(left),
            rightType(right));
    };
};
```

Most number operations use only the most simple `toNumber` conversion.

```js
var add = _binaryOperation(number_value.add);
var subtract = _binaryOperation(number_value.subtract);
...
var lt = _binaryOperation(from(number_value.lt));
```

The bitwise operations convert their arguments to more specific number types, such as signed or unsigned 32 bit integers.

```js
exports.leftShift = _binaryOperation(number_value.leftShift,
    toInt32,
    toUint32);

var signedRightShift = _binaryOperation(number_value.signedRightShift,
    toInt32,
    toUint32);

var unsignedRightShift = _binaryOperation(number_value.unsignedRightShift,
    toInt32,
    toUint32);

var bitwiseAnd = _binaryOperation(number_value.bitwiseAnd,
    toInt32,
    toInt32);

var bitwiseXor = _binaryOperation(number_value.bitwiseXor,
    toInt32, 
    toInt32);

var bitwiseOr = _binaryOperation(number_value.bitwiseOr,
    toInt32,
    toInt32);
```

# Semantics
With this small library of number computations, we can define an ECMAScript interpreter that supports literals and binary numeric operations.

The top level of the interpreter maps an AST node to its computation semantics. 

```js
var mapSemantics = function(node) {
    switch (node.type) {
    
    case 'Literal':
        switch (kind) {
        case 'number':  return number(node.value);
        case 'boolean': return boolean(node.value);
        case 'string':  return string(node.value);
        case 'null':    return compute.just(nil.NULL);
        }
        
    case 'BinaryExpression':
        var l = mapSemantics(node.left),
            r = mapSemantics(node.right);
        switch (node.operator) {
        case '+': return add(l, r);
        case '-': return subtract(l, r);
        case '*': return multiply(l, r);
        case '/': return divide(l, r);
        case '%': return remainder(l, r);
    
        case '<<':  return leftShift(l, r);
        case '>>':  return signedRightShift(l, r);
        case '>>>': return unsignedRightShift(l, r);
        
        case '&':   return bitwiseAnd(l, r);
        case '^':   return bitwiseXor(l, r);
        case '|':   return bitwiseOr(l, r);
    
        case '<':   return lt(l, r);
        case '<=':  return lte(l, r);
        case '>':   return gt(l, r);
        case '>=':  return gte(l, r);
        }
    }
};
```

Computations are evaluated by `evaluate` with a outermost continuation `k`. 

```js
var evaluate = function(c, k) {
    return c(cons(k, NIL));
};
```

This primitive interpreter only understands binary literal expressions. `evaluateText` uses [Parse-ECMA][parse-ecma] to parse some ECMAScript source text, and evaluate the first binary expression from the program body. 

```js
require([
    'parse-ecma/lex/lexer',
    'parse-ecma/parse/parser'],
function(
    parser,
    lexer){
    
var evaluateText = function(input, k) {
    var prog = parser.parse(lexer.lex(input));
    return evaluate(
        prog.body[0].expression,
        k);
};

})
```

Performing a few calculations:

```js
evaluateText("1", console.log); // 1
evaluateText("1 + 2", console.log); // 3
evaluateText("1 + 5 * 5 - 2", console.log); // 24
```

## Why
So what does all this work get us? It is certainly possible to implement a calculator, or even an entire ECMAScript interpreter, using standard CPS programming. But I find there are two primary practical benefits to building an interpreter using monads in an untyped language: it becomes easier to add new core functionality to the interpreter, and monads are one good way to express and compose computations at a higher level.

Consider this program:

```
var pausedComputation = run(
    add(
        number(3),
        add(
            callcc(abrubt),
            number(1))),
    console.log);

pausedComputation(number.create(2)); // logs number 6
```

Even though none of the number computations definitions above ever mention continuations, this computation just works.

Behind the interface of `just` and `bind`, the delimited continuation monad implements delimited control to apply and sequence continuations. But computations and higher-order function only need to know about `just` and `bind` and not about delimited control.

The other benefit is that it becomes easy to add functionality to the interpreter by changing the underling monad. In fact, I'll demonstrate this in the next post by adding state to the interpreter, and all the computations defined here will continue to work fine.


[Atum]: https://github.com/mattbierner/atum
[parse-ecma]: https://github.com/mattbierner/parse-ecma

[kleisli-compose]: http://hackage.haskell.org/package/base-4.6.0.1/docs/Control-Monad.html#v:-62--61--62-
[liftm]: http://hackage.haskell.org/package/base-4.6.0.1/docs/Control-Monad.html#v:liftM

[mb-atum-prims]: /atum-primitive-language-values
[mb-decont]: /the-delimited-continuation-monad-in-javascript