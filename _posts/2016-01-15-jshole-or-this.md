---
layout: post
title: "|| this"
description: "Defining a single, zero overhead Javascript function that can be used as either a free function or a method"
series: jshole
date: '2016-01-16'
---

While refactoring [HAMT][] recently, I noticed a lot of boilerplate code like this:

```js
export const get = (key, map) =>
    impl(hash(key), key, map);

Hamt.prototype.get = function(key) {
    return get(key, this);
};
```

This snippet defines two public APIs: a free function `get`, which takes a key and a map, and a method `Hamt.prototype.get`, which takes a key and is called on a map. This API pattern works well for functional-style Javascript libraries, with the free function's argument order being well suited to binding and composition, while the method provides a more concise and Javascripty interface.

But such duplication! `Hamt.prototype.get` just forwards to `get`. Those three extra lines may not seem like a big deal, but imagine duplicate definitions for every public API in a library, some of which take a good number of arguments. Surely there is a better way.

# The Pattern
We can get away with using the same function for both versions of the API. Observe:

```js
export const get = Hamt.prototype.get = function(key, map) {
    return impl(hash(key), key, map || this);
};
```

The public API is unchanged. Internally though, a single function implements both the free function and the method. When `get('a', m)` is called, `key === 'a'` and `map === m`. But with `m.get('a')`, `key === 'a'` while `map === undefined`. In that case, `map || this` evaluates to `this`, which is bound to `m`.

## Why this is Clever
Two whole lines of code eliminated, just like that! Think of all those saved bytes! Now there's only a single version of the function to maintain. With the combined definition, there's no risk of the free function and method getting out of sync, and the implementations will always stay in sync as well. Less code is usually better.

And now the API supports all kinds of fun stuff, such as:

```js
const a = new Hamt();

// These are all the same
get('key', a) === a.get('key') === get.call(a, 'key')

const getFromA = get.bind(a);
getFromA('key');
```

Unlike other approaches to remove the boilerplate code involving `Function.prototype.call` or `Function.prototype.bind`, the `|| this` pattern is [zero (or low) overhead for many Javascript engines][benchmark].

## Perhaps Too Clever...
Yet all is not sunshine and rainbows. This pattern only works if the following holds:

* The method and free function take exactly the same parameters.
* The `this` parameter comes last in the free function. This order is great for binding and functional programming, but makes using function overloading and default arguments more difficult.
* The `this` parameter of the free function can not be falsy. If a falsy `this` parameter is used, the real `this` value will override it. Checking for `undefined` explicitly is better (`typeof map === 'undefined' ? this : map`) but is also not perfect.

But is this even a good idea to begin with? Consider what the API now allows:

```js
const a = new Hamt();
const b = new Hamt();

a.get('key', b) === b.get('key')
get.call(a, 'key', b) === b.get('key')

var getFromA = get.bind(a);
getFromA('key', b) === b.get(key)
```

That's probably not the expected behavior. The API surface has grown larger while becoming less obvious and more dangerous, even if forms like the above are never officially supported.

And just look at the code! Yes, removing the duplication may prevent some bugs, but there's an additional WTF cost to understand and maintain the combined function. While the combined APIs can be (fairly) clearly documented for humans, documentation generators will throw up their hands when faced with one of these.

```js
/**
    Lookup the value for `key` in `map || this`.
*/
export const get = Hamt.prototype.get = function(key, map) {
    return impl(hash(key), key, map || this);
};
```

Good luck trying to write a Doxycomment that expresses how `map` is the second parameter for `get`, but really is the `this` object for `Hamt.prototype.get`. The fact that this pattern cannot be clearly documented should set off some alarms.

Then there's the matter of performance. For Chrome and Firefox at least, the combined definition [performs exactly the same][benchmark] as the forwarding declaration. On OSX Safari, the combined definition was slower however. More [benchmarking is needed][benchmark], but the Safari result may influence some decisions.

# Conclusion and Alternatives
The `|| this` pattern is interesting. It's the only zero overhead way I could come up with to remove the duplicate definitions, and it may very well be the correct approach for some projects.

Other approaches to the problem involve `Function.prototype.call` or `Function.prototype.bind`, with performance suffering appropriately. If a different argument order is acceptable, here's a function called `free` that transforms any method into a free function. The resulting free function is equivalent to `(self, args...) => self.method(args...)`.

```js
var free = method => Function.prototype.call.bind(method);
// or, to be a true jsHole
free = Function.prototype.bind.bind(Function.prototype.call);

Hamt.prototype.get = function(key) {
    return impl(hash(key), key, this);
};

export const get = free(Hamt.prototype.get);
```

But `free` is [generally much slower](http://jsperf.com/free-function-forward-cost/2) than direct forwarding.

After switching over all of HAMT's APIs to use combined definitions, I eventually reverted the change. The potential bug prevention and brevity benefits could not be justified considering the drawbacks detailed. Still, a fun little trick to keep in mind that I had not seen discussed before.

****

**Update - Feb 13, 2016**

See the [Funcualizer library](/jshole-funcualizer/) for a more complete implementation of `free` and ways to eliminate some of it's overhead. It still involves more function calls than `|| this`, but is much more flexible and will perform well enough for the vast majority of cases.

[hamt]: https://github.com/mattbierner/hamt
[benchmark]: http://jsperf.com/method-version-of-free-function/3
