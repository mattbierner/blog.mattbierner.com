---
layout: post
title: "Hamt + 1"
date: '2016-01-29'
description: "Now with 100000% more cephalopod!"
titleImage:
    file: "hamt-logo.png"
---

{% include image.html file="hamt-logo.png" %}

[Hamt+][src] may not have the same level of recognition or funding as Immutable.js, but we've got the better logo. Just look at that friendly [Cephalopod of Mutation](/the-lispers-in-the-darkness/), bursting onto the immutable landscape all ready to wreck up the place.

Hamt+ v1 is now out, bringing complete API compatibility with [Hamt v2.1][hamt]. This includes support for Javascript iterators and a similar API to [ES6's `Map`][map]. Compared to [regular Hamt][hamt], Hamt+ offers support for custom key types, creating maps that use custom hash functions, and, as hinted at above, transient mutation. Transient mutation allows for more efficient batch operations through scoped mutation of the normally immutable data structure.

```js
var hamt = require('hamt_plus');

const book = ["The", "Time", "Traveller", "for", "so", "it", "will", "be", "convenient", "to", "speak", "of", "him", ...];

// Build count of words in `book`
const map = hamt.mutate(map => {
    // The map can be mutated within this block, but these mutations
    // cannot leak outsite of the block.

    // Note how we don't have to assign the value of `map` to the result
    // because `map` is mutated.
    for (let word of book)
        map.modify(word, count => (count || 0) + 1);
}, hamt.empty);
``` 

A Hamt+ map can be made mutable at any time, and the mutations are guaranteed not to effect any existing references to the immutable data structure:

```js
const h = hamt.set('a', 1, hamt.make());

const h1 = h.mutate(map => {
    map.set('a', 2);
});

h.get('a') === 1
h1.get('a') === 2
```

You can also manually scope mutation using `beginMutation` and `endMutation`.

```js
const h = hamt.set('a', 1, hamt.make());

const h1 = h.beginMutation();
h1.set('a', 2);
h1.endMutation();
```

Check out the [documentation for the complete API][documentation]. As mentioned, Hamt+ can be used as a drop in replacement for Hamt. The performance of Hamt+ is slightly worse when dealing only with immutable data structures, but considerably better in cases where transient mutation can be used.

P.S. `map.size` is now constant time for Hamt+ and regular Hamt too!


[hamt]: https://github.com/mattbierner/hamt

[documentation]: https://github.com/mattbierner/hamt_plus#api
[src]: https://github.com/mattbierner/hamt_plus


[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map