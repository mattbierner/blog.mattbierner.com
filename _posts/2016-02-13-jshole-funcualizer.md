---
layout: post
title: Funcualizer
description: "Converting Javascript methods into performant functions"
series: jshole
date: '2016-02-13'
---

[Funcualizer is a small Node library][npm] that converts Javascript methods into plain old functions:

```js
const funcualizer = require('funcualizer');

const slice = funcualizer(Array.prototype.slice);

slice([1, 2, 3], 2) === [3]
slice("abc", 0, 2) === ['a', 'b']
```

Funcualizing a method removes the need to `.call` it, and makes it easy to use existing APIs in functional-style Javascript programming.

Having tried a number of approaches to the method->function problem, including [the `|| this` pattern][or_this], I created this library to bring together some of what I've learned. The library lets you select for flexibility or for performance, with some funcualized implementations [performing about the same as their handwritten counterparts][benchmarks].

[Source and documentation are available on Github][src].

## Why
At a glance, Javascript methods are just functions:

```js
function Vec2(x, y) {
    this.x = x;
    this.y = y;
};

Vec2.prototype.add = function(b) {
    return new Vec2(this.x + b.x, this.y + b.y);
};

const v = new Vec2(0, 1);
```

But this similarity is a classic beginners trap. Consider:

```js
const addV = v.add;

// Error, this === undefined
addV(new Vec2(3, 4));
```

Although `add` looks like a function, it also relies on a `this` binding which is lost in `addV`. Instead, methods must use `call`, `apply`, and `bind`:

```js
add.call(v, new Vec2(3, 4));

const addV = v.add.bind(v);
addV(new Vec2(3, 4));
```

The difference between methods and functions is super annoying for functional-style programming. The usual fix is writing a wrapper for the method:

```js
const add = (a, b) => a.add(b);

add(v, new Vec2(3, 4));
```

Or we could `.bind` all methods and `.call` all things, but that's no fun. Here's where Funcualizer comes in.

## Explicit This
Funcualizer takes a method and makes `this` an explicit parameter. The basic implementation is probably easier to understand:

```js
const funcualizer = (method) =>
    (self, ...args) =>
        method.apply(self, args);
```

This allows methods to be treated exactly like normal functions:

```js
const add = funcualizer(Vec2.prototype.add);

add(v, new Vec2(3, 4));
[new Vec2(0, 1), new Vec2(3, 4), new Vec2(6, 5)].reduce(add);
```

And, like with `.call` and `.apply`, it lets us use any object as the `this` parameter, not just instances with that method:

```js
add({ x: 0, y: 1 }, { x: 3, y: 4 });
```

## Pre and Post
The Funcualizer library can create functions that take `this` as either the first or the last parameter:

```js
// Takes `this` as the first argument of the resulting function
funcualizer(Array.prototype.slice) === funcualizer.pre(Array.prototype.slice)

// Takes `this` as the last argument of the resulting function
const slice_post = funcualizer.post(Array.prototype.slice);

slice_post(2, [1, 2, 3]) === [3]
slice_post(0, 2, "abc") === ['a', 'b']
```

The `post` argument order is especially useful for partial application and function composition:

```js
const take_first_three = slice_post.bind(null, 0, 3);

take_first_three([1, 2, 3, 4, 5]) === [1, 2, 3]
```

## Dynamic
When dealing with inheritance patterns, usually we don't want to invoke a specific method implementation, but rather the implementation bound to a given name. `dynamic_pre` and `dynamic_post` lookup and invoke a method by name on the `this` argument of the function when it is called:

```js
const toString = funcualizer.dynamic_pre('toString');

toString([1, 2, 3]) === "1,2,3"
toString({}) === "[object Object]"
toString({ toString: () => 'bla' }) === 'bla'
```

Here, `toString` actually ends up invoking a different method for each of these three objects.

## Performance
All the functions covered so far perfectly forward their arguments to the inner method. This is convenient and suitable for almost all normal use cases, but introduces a [small amount of overhead][benchmarks] compared to a handwritten method->function implementation:

```js
// Performance baseline
const add = function(self, v1) {
    return self.add(v1);
};
```

Funcualizer allows you to sacrifice generality in order to eliminate this overhead. The `pre$`, `post$`, `dynamic_pre$`, and `dynamic_post$` Api variants target fixed [arity](https://en.wikipedia.org/wiki/Arity) methods. Besides taking a method or method name, these functions take the expected `arity` of the method (`pre$` and `post$` can optionally infer this from `method.length` if you want to be lazy). Otherwise, the resulting functions operate exactly the same way:

```js
const add = funcualizer.pre$(Vec2.prototype.add, 1 /* number of args */);

add(v, new Vec2(3, 4));
```

[Simple benchmarks show][benchmarks] that `pre$` and `post$` perform about the same as a handwritten method->function implementation, with performance gains of 30-50% over normal `pre` and `post`.

{% include image.html file="benchmarks.png" %}

Again, not super important for most day-to-day programming tasks, but a good option if you are concerned about performance and don't need to forward arbitrary argument sets.

## Next Steps
I've been using these basic patterns for years now and found them helpful, so I hope other people will also benefit from this small library.

Again, [check out the documentation on Github][src] if you are interested in using the library. Contributions are always welcome as well.

[benchmarks]: https://jsperf.com/free-function-forward-cost/8
[npm]: https://www.npmjs.com/package/funcualizer
[src]: https://github.com/mattbierner/funcualizer
[or_this]: /jshole-or-this
