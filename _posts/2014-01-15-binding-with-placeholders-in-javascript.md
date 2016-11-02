---
layout: post
title: Binding With Placeholders in Javascript
date: '2014-01-15'
---
`Function.prototype.bind` is incredibly useful for binding initial arguments, but sometimes we want to bind arguments at other indices. This post offers one simple implementation of binding with [C++ inspired][c++ placeholder] placeholders for Javascript.

## Goals
* Argument agnostic.
* Support binding any function, including n-ary functions.
* Allow binding any number of arguments at arbitrary positions.

## Motivating Example
Consider a function `dot2` that calculates the two-dimensional dot product.

```js
var dot2 = function(x1, y1, x2, y2) {
    return (x1 * x2) + (y1 * y2);
};
```

`Function.prototype.bind` can only bind initial arguments, such as binding `x1` or `x1`, `y1`, and `x2`. To bind arguments like `y1` or `x1` and `x2`, we need to change `dot2`. This is often accomplished by manually forwarding arguments using an anonymous function.

```js
var dotForwarded = function(y1, y2) {
    return dot2(10, y1, 10, y2);
};

dotForwarded(2, 3); // 106
```

Placeholders are a cleaner and clearer solution:

```js
var dot10xs = placeholder(dot2, 10, _, 10, _);

dot10xs(2, 3); // dot2(10, 2, 10, 3) // 106

dot10xs(5, -1); // dot2(10, 5, 10, -1) // 95

placeholder(dot10xs, 5)(4, null, 2); // dot2(10, 5, 10, 4, null, 2) // 120
```

# Implementation
`placeholder` takes a function `f` and a set of bound arguments. The bound arguments map argument indices to bound values, and may contains holes. For example, we can bind arguments at index 0 and 2, but leave index 1 open (along implicitly with all indices greater than 2). `placeholder` returns a function that fills in unbound arguments and forwards all arguments to `f`.

Bound arguments are provided as initial arguments to `placeholder`. The index of a bound argument in the call to `placeholder` determines the index of the argument in `f` being bound.

We choose `_` to identify a hole. The selection of `_` is arbitrary, any identifier can be used but that identifier must identify a unique object. This ensures that all types of arguments, including falsy values and `undefined`, are supported.

```js
var _ = {};
```

One possible implementation of `placeholder` is given here. This implementation uses iteration to merge the bound arguments and callee arguments, and `Function.prototype.apply` to invoke `f`.

```js
var placeholder = function(f /*, ...*/) {
    var bound = Array.prototype.slice.call(arguments, 1);
    return function(/*...*/) {
        var args = []; // Arguments to call f with.
        
        // Copy all bound elements into position
        for (var i = 0, len = bound.length; i < len; ++i)
            if (bound[i] !== _) // Skip holes
                 args[i] = bound[i];
        
        // Copy provided arguments into place
        var indx = 0;
        for (var i = 0, len = arguments.length; i < len; ++i) {
            // Skip already bound positions
            while (indx in args)
                 ++indx;
            
            // Add callee argument
            args[indx++] = arguments[i];
        }
        
        // Call the function with the bound arguments.
        //
        // You can easily adapt `placeholder` to bind `this`
        // like `Function.prototype.bind` but this implementation
        // ignores `this`.
        return f.apply(undefined, args);
    };
};
```

## Performance
[This JSPerf][jsperf] shows `placeholder` has high overhead compared to manually forwarding arguments. Every call to a function using `placeholder` requires two function calls and a lot of iteration, array manipulation, and allocation.

Therefore, `placeholder` is probably not a good solution for small math functions like `dot2`. But for more substantial interfaces, `placeholder` can make code cleaner and eliminate a lot manual argument forwarding.


[c++ placeholder]: http://en.cppreference.com/w/cpp/utility/functional/bind
[jsperf]: http://jsperf.com/placeholder-overhead