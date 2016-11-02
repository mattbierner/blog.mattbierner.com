---
layout: post
title: H.A.M.T. II – The Chaining
date: '2016-01-04'
description: Hamt is back and rocking a new method based API. 
---
**Update** - Jan 5, 2016

Turns out that Hamt V1 was not long for this world, but the good news is that [the real Hamt V2 is now out](/hamt-3-the-final-iteration/), with all the method chaining goodness of V1 plus support for Javascript iterators.

*Original post follows below.*

-----

Well actually it's version 1. And version 1.1 is already out as well. Details, mere details. The point: everyone's favorite immutable map Javascript library is back and sporting some new bling.

Hamt is a Javascript implementation of a [*H*ash *A*rray *M*apped *T*rie][hash-array-mapped-trie], an immutable map data structure with good performance characteristics. The library was first released a little under two years ago, and, while bugs have been fixed and the code has been tuned for performance, the API has remained fairly static. The 1.0 update allowed me to make non-backwards compatible changes to the existing APIs, while also adding a new method chaining API that is more concise and Javascripty.

As always, you can use the latest version of Hamt with Node by running `$ npm install hamt`. The library now also works with Require.js or as a global. The [source][src] and [documentation][] are on Github. 

Let's take a quick look.

# 2 Chain
Lisp programmers felt right at home with the old Hamt 0.x API, since it used free functions exclusively. To create a map with three values, you used to write:

```js
// Hamt 0.x
var hamt = require('hamt');

var map =
    hamt.set('me', 'boat',
        hamt.set('george', 'watchington',
            hamt.set('u', 'realest', hamt.empty)));

hamt.count(map) === 3
hamt.get('u', map) === 'realest'
hamt.keys(map) === ['u', 'me', 'george']
```

Hamt was designed for functional programming, so I initially resisted tainting the API with anything resembling object orientation. My development of the [Apep Javascript text generation library][apep] showed that even functional libraries can greatly benefit from an API that better utilizes Javascript conventions, such as objects and method chaining. But I didn't want to just scrap the old free function API either, since it easily supported functional techniques such as binding and composition.

So Hamt 1.0 adds a new, method based API that will be more familiar to Javascript programmers. All API operations are now defined both as free functions and as methods on a map. The method API is notably more concise and readable:

```js
// Hamt 1.x
var hamt = require('hamt');

var map = hamt.empty
    .set('me', 'boat'),
    .set('george', 'watchington')
    .set('u', 'realest');

map.count() === 3
map.get('u') === 'realest'
map.keys() === ['u', 'me', 'george']
```

The free function API continues to work just fine too, but a few operations, such as `hamt.set` and `hamt.modify`, have a different argument order that is more appropriate for binding:

```js
var map = hamt.empty.set('key', 0);

map = map.modify('key', x => x + 1);

// Note that the argument order here is reversed compared to
// the method chaining API 
map = hamt.modify(x => x + 1, 'key', map);

// This order is better for binding:
var inc = hamt.modify.bind(null, x => x + 1);

map = inc('key', map);
```

# Other API Changes
There are a few other breaking changes in Hamt 1 that make the library more consistent and get it ready for future work.

## `isEmpty`
`isEmpty` is a safe, constant time way to check if a given map contains any elements.

```js
hamt.empty.isEmpty() === true
hamt.isEmpty(hamt.empty.set('key', 'not empty')) === false
```

Comparing a map to `hamt.empty` using equality is not supported. `isEmpty` should always be used instead. With the direct equality comparison, there is a risk that two versions of the library will be loaded with different `hamt.empty` values. `isEmpty` also allows changing the internal implementation of the library more easily.

## `get`
`get` now returns `undefined` instead of `null` for values that do not exist. This mirrors how ES6's `Map.prototype.get` works. 

## `hamt.set`
`hamt.set` now takes its arguments as `hamt.set(value, key, map)`. This order is somewhat confusing coming from a C-syntax based language, but it better supports binding and is consistent with the argument order of `hamt.modify`.

`map.set` continues to take arguments as `map.set(key, value)`. Code should be updated to use the method based API where possible.

## `delete`
Also for ES6 compatibility, you can now call `map.delete('key')` as an alias of `map.remove('key')`.

## `fold`
`fold` has been tweaked to call the accumulator function with the arguments `(sum, value, key)` instead of `(sum, {key, value})`. This allows you to use simple accumulator functions more easily

```js
var add = (x, y) => x + y;

hamt.empty
    .set('a', 1)
    .set('b', 3)
    .set('c', 10)
    .fold(add, 0) === 14
```

# Resources
Check out the improved [documentation on GitHub][documentation] for the complete set of APIs.

I've also updated [the benchmarks][benchmarks] with the latest version of Hamt (along with the other tested libraries as well).

Going forward, I'm planning to update the [Hamt+][hamt+] fork of Hamt to support the same API as Hamt v1, so the two libraries are fully API compatible again. On the roadmap for Hamt 1.2 is lazy traversal of maps, as well as support for Javascript iterators.

[documentation]: https://github.com/mattbierner/hamt#api
[src]: https://github.com/mattbierner/hamt
[hamt+]: https://github.com/mattbierner/hamt_plus

[benchmarks]: http://github.com/mattbierner/js-hashtrie-benchmark
[hash-array-mapped-trie]: http://en.wikipedia.org/wiki/Hash_array_mapped_trie

[apep]: https://github.com/mattbierner/apep