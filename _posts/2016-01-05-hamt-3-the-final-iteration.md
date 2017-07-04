---
layout: post
title: Hamt 3 - The Final Iteration
date: '2016-01-05'
description: Hamt V2 is out with support for Javascript iterators.
titleImage:
    file: "hamt-logo.png"
---

{% include image.html file="hamt-logo.png" %}

Hot on the heels of [Hamt V1][hamt1], here comes Hamt V2. This release focuses on superficial API compatibility with [ES6's `Map`][map], making it easier to start using immutable data structures in your code. This also means that Hamt's finally showing [Javascript iterators][iteration] some love.

You can find the updated [documentation][] on Github along with the [source code][src]. Install the latest version of Hamt by running `$ npm install hamt`. 

Let's take a look.

# Iterable
Hamt maps now implement the [ES6 iterable protocol][iteration] so you can use them in `for of` loops and with any API that takes a Javascript iterable:

``` js
const hamt = require('hamt');

const h = hamt.empty
    .set('key', 'value')
    ...
    .set('more key', 'another value');
    
for (let [key, value] of h)
    console.log(key, value);

Array.from(h);
myFunction(...h);
```

Unlike `hamt.fold`, iterators are lazy, so you can access only the map elements you need, or break out of iteration early:

```js
/// check that all values in `map` satisfy function `f`
const all = (pred, map) => {
    for (let [key, value] of map)
        if (!pred(value))
            return false;
    return true;
};

// Kind of silly to short circuit for a map of this size but,
// for large maps, this ability is important.
let h = hamt.emtpy
    .set('a', 4)
    .set('b', 84)

all(x => x < 100, h) === true;

h = h.set('c', 101);
all(x => x < 100, h) === false;
```

For compatibility with ES6's `Map`, the `keys` and `values` functions have also been updated to return iterators instead of arrays:

```js
const h = hamt.empty
    .set('key1', 1)
    .set('key2', 2)

// These two are the same
Array.from(hamt.keys(h))
Array.from(h.keys()) === ['key1', 'key2']

// These two are the same
Array.from(hamt.values(h))
Array.from(h.values()) === [1, 2]
```

Keep in mind that like `hamt.fold`, iteration is unordered. The insertion order does not determine the order of iteration.

# Other API changes

## `map.size`
For compatibility with `Map`, you can now also get the number of elements in a map with the `.size` property.

```js
const h = hamt.empty.set('a', 1).set('b', 2);
h.size === 2;
```

`.size` is still an alias for `hamt.count(map)`, which is a `O(N)` operation (I'll fix that one of these days...)

## `hamt.set` argument order fixed
In Hamt V1, I reversed the argument order of `hamt.set` to be `hamt.set(value, key, map)`. For some reason, yesterday me thought that it would be more common to bind the `value` parameter in `hamt.set`. That was stupid. This argument order is confusing and far less useful than I imagined. Thankfully, even V1 kept the correct order for the method based API: `map.set(key, value)`. 

It turns out that binding the `key` argument is actually a whole lot more helpful, so Hamt 2 restores the old `hamt.set(key, value, map)` argument order:

```js
// Now, code like this is easy to write again
const setKey = hamt.set.bind(null, 'key');

myMap = setKey(4, myMap);
```

## `hamt.entries`
`hamt.pairs` has been replaced by `hamt.entries`. Unlike `pairs`, `entries` returns a Javascript iterator over the key, value pairs in a map:

```js
const h = hamt.empty
    .set('key1', 1)
    .set('key2', 2)

const it = h.entries();
let x = it.next();
x.value === ['key1', 1]

x = it.next()
x.value === ['key2', 2]

x = it.next();
x.done === true;
```

## `hamt.forEach` and `map.forEach`
`forEach` iterates over an entire map using a function:

```js
const h = hamt.empty
    .set('key1', 1)
    .set('key2', 2)

h.forEach((value, key, map) => {
   console.log(value, key); 
});
```

In cases where you need to iterate over all values of a map, `forEach` is much faster than using `for of` or iterators (and for even better perf, use `hamt.fold` directly).

# Resources
For a complete API reference, see the updated [documentation][documentation]. And if you run into any issues, feel free to [file a bug][issues] or submit a pull request.

Also, despite the name of this post, this most definitely is not the final release of Hamt. After this though, we'll have to do a reboot or something because calling the next major release Hamt 4 would just be embarrassing.


[hamt1]: /h-a-m-t-ii-the-chaining/

[documentation]: https://github.com/mattbierner/hamt#api
[src]: https://github.com/mattbierner/hamt
[issues]: https://github.com/mattbierner/hamt/issues

[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[iteration]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols