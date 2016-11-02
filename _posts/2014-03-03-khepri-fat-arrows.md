---
layout: post
title: Khepri Fat Arrows
date: '2014-03-03'
---
I overview and criticize the semantics of Javascript's `this` keyword. Then I quickly overview the ECMAScript 6 and Coffee Script solution to the `this` problem, before detailing [Khepri's][khepri] fat arrow syntax. Khepri [fat arrows][functions] make `this` binding explicit and also can [unpack][unpacks] the `this` object.

# Javascript
The Javascript `this` keyword is bound to the object that the current function was called on. The dynamic binding of `this` differs from the lexical, function block scoping of other bindings.

The `this` object is clearest when a `this` value is explicitly provided using  `Function.prototype.call`. 

```js
var f = function(x) {
    return this.z + x;
};

f.call({'z': 3}, 1); // 4
```

A member expression provides its base object as `this`.

```js
var o = {
    'z': 3,
    'f': f
};

o.f(1); // 4, same as f.call(o, 1)
```

Regular, non-member function calls do not provide any `this`. In normal mode Javascript, function calls pass the global object as `this`, while strict mode passes `undefined`.

```js
f(1); // NaN, since: undefined + 1

z = 3; // set global z
f(1); // 4, since: global.z + 1
```

MDN has a [more comprehensive review][this] of `this`.

## Nested Function Issues
Javascript's `this` semantics complicate the use of function literals for callbacks and events in methods.

```js
var C = function(x) { this.x = x; };

C.prototype.getXGetter = function() {
    return function() {
        return this.x;
    };
};

var o = new C(10);
```

The programmer intended to have `getXGetter` return a function that returns the value of `x` stored on the instance of `C`. Instead, the result of `getXGetter` returns undefined:

```js
o.getXGetter()(); // undefined

// The above code is actually:
C.prototype.getXGetter.call(o).call(undefined);
```

In the getter returned by `getXGetter`, `this.x` references the undefined `this` of the inner function, not the outer member function `getXGetter` that is called with `o` as `this`.

The solution is to explicitly bind the target `this`.

```js
C.prototype.getXGetter = function() {
    var self = this;
    return function() {
        return self.x;
    };
};

var o = new C(10);
o.getXGetter()(); // 10
```

`getXGetter` is pretty contrived, but explicitly binding `this` is an extremly common Javascript pattern.

## This as a Parameter
I think of `this` as an additional parameter supplied to functions. Python method definitions for example take an explicit `self` parameter.

```
class C:
    def method(self, arg):
        return arg
        
o = C()
o.method(3) # 3, self is automatically provided
```

I believe that ECMAScript language syntax for `this` should also model `this` as a parameter. Instead of being an exception in the language, if `this` is a parameter, it can follow the same rules as regular parameters.


# Other Languages and This

## ECMAScript 6
[ECMAScript 6][ecmascript6draft] arrow functions are more than a shorter function syntax, they are semantically different from functions defined with the `function` keyword. Among the differences, arrow functions use lexical this scoping. They do not introduce a `this` binding.

In an arrow function, `this` is resolves using lexical scoping rules to the first `this` object from a regular `function` function.

```js
C.prototype.getXGetter = function() { // normal function
    return () => // arrow function
        this.x; // `this` resolves to the `this` of `getXGetter`
};

var o = new C(10);
o.getXGetter()(); // 10
```

ECMAScript 6 is designed around backwards compatibility with ECMAScript 5, and, while arrow functions are a big language improvement, I feel they are in many ways a missed opportunity.

Specially, `this` is still a magic keyword instead of a parameter. And in heavily nested functions, you still have to bind `this` to a local variable to get correct the behavior.

```js
var Model = function() {
    var outer = this;
    
    var SubModel = function() {
        // can't reference the Model instance using `this` here
        this.onChange = () => outer.x;
    };
    
    this.x = 10;
};
```

## Coffee Script
[Coffee Script][coffeescript] uses the fat arrow `=>` to define a function that is bound to the `this` in which the function is defined.

```js
C.prototype.getXGetter = () ->
    () => this.x;
    
var o = new C(10);
o.getXGetter()(); // 10
```

Fat arrow functions behave like ECMAScript 6 arrow function, but are functionally closer to calling `Function.prototype.bind` with `this`. 

```js
C.prototype.getXGetter = function() {
    return function() {
        return this.x;
    }.bind(this);
};
```

Fat arrows suffer from the same problems as ECMAScript 6 arrow functions. The generated code also uses an extra function call:

```js
// Generated code from example above
C.prototype.getXGetter = function() {
  return (function(_this) {
    return function() {
      return _this.x;
    };
  })(this);
};
``` 

# Khepri
A Khepri function may optionally unpack the object it is called on with a this unpack. This unpacks explicitly bind `this` to an identifier, and also allow values to be extracted from the `this` object using the same [unpack patterns][unpacks] as parmeters. 

```js
// Khepri fat arrow
// Bind `self` to the `this` object.
C.prototype.getXGetter = \() =self->
    \()-> self.x;

// Generated code:
(C.prototype.getXGetter = (function() {
    var self = this;
    return (function() {
        return self.x;
    });
}));
```

Khepri eliminates the `this` expression entirely. You always need to use an explicit `this` binding.


## Fat Arrows
`this` unpacks are of the form `= PATTERN`, and may appear at the end of a function parameter list before the `->` and function body.

```js
// Bind `self` to the `this` object.
var f = \x = self ->
    x + self.z;

f.call({'z': 3}, 1); // 4
```

This unpacks follow the same rules as parameter unpacks. Values bound in a this unpack are immutable and lexically scoped. This unpacks are run after all other parameters have been unpacked, but before the function body.

```
C.prototype.getXGetter = \() =self->
    \() -> self.x;

var o = new C(10);
o.getXGetter()(); // 10
```

Like other parameters, a this unpacks may conflict with previous bindings or hide outer bindings.

```js
// Error, self already bound for scope. 
\self =self-> ...;

// Inner self binding hides outer binding
\=self-> \=self-> self.x; 
```

Fat arrows work easily with deeply nested functions and make `this` explicit:

```js
var Model = \ =model-> {
    var SubModel = \ =self-> {
        self.onChange = \e -> model.x;
    };
    
    model.x = 10;
};
```

## Ballista Arrows
Any identifier pattern, as pattern, array pattern, or object pattern can be used as the this unpack pattern.

```js
var f = \x ={z}-> x + z;
```

You can go bit crazy:

```js
\args(f z)=self#{children#{length} count}-> ...
```




[this]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
[ecmascript51]: http://www.ecma-international.org/ecma-262/5.1/
[ecmascript6draft]:https://people.mozilla.org/~jorendorff/es6-draft.html
[coffeescript]: http://coffeescript.org/#fat-arrow

[khepri]: https://github.com/mattbierner/khepri/
[unpacks]: https://github.com/mattbierner/khepri/wiki/unpack-patterns
[functions]: https://github.com/mattbierner/khepri/wiki/functions