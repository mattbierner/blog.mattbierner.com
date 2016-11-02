---
layout: post
title: Memoization in Bennu
date: '2013-12-17'
---
The first version of [Parse-ECMA][parse-ecma] had some performance problems. Parsing simple expressions took up to 45 seconds. Today, Parse-ECMA can lex and parse the entire 2000 line require.js source in about 4 seconds. Almost all of this performance gain came from adding [memoization][memoization] to Bennu.

Memoization in [Bennu][bennu] caches and reuses parser results, and is especially important with backtracking. I overview the problem of memorizing monadic parser combinators and detail the implementation of memoization in Bennu.

# Memoization Problem Overview
The top result for ["Javascript Memoization"][jsmemo] features this gem:

```js
function memoize(param){
    if (!memoize.cache)
        memoize.cache = {};
    if (!memoize.cache[param]) {
        var result = f(param); //custom function
        memoize.cache[param] = result;
    }
    return memoize.cache[param];
}
```

which, besides being completely incorrect as a general purpose solution (look at what happens for object inputs or functions that return falsy values), is stateful and difficult to reason about.

None of the existing Javascript memoization solutions I found were appropriate for Bennu.


## Why We Need Memoization
Consider the parser:

```js
// Repeated parsing are almost never this obvious.
var p = either(
    attempt <| then(reallyExpensiveParser, character 'a'),
    then(reallyExpensiveParser, character 'b'));
```

Clearly running `reallyExpensiveParser` is really expensive, so we should minimize the number of times it is run.

But consider what happens if the first `reallyExpensiveParser` succeeds and then the input `'b'` is encountered. When the `character 'a'` parser fails, `attempt` backtracks and the second choice of the `either` is run. This runs `reallyExpensiveParser` again with the same input to get the same value.

## Issues with Argument Based Memoization
Standard memoization memoizes a function on its input, mapping arguments to cached values. But this wont work for the inner continuation functions used in Bennu's implementation.

```js
always = \x ->
    // This is what we want to memoize
    new Parser\state cok cerr eok eerr ->
        eok(x, state);
```

In the example with `reallyExpensiveParser`, the two calls to `reallyExpensiveParser` have the same `state`, but different `cok`, `cerr`, `eok`, and `eerr` continuations. Memorizing the inner function on all of the inputs would be completely worthless because we could only reuse a parser's results if it is called with the exact same continuations.

# Bennu Memoization

## Threading an Immutable Memoization Table Through Parsers

In order to implement memoization functionally, the memo table that maps inputs to results must be threaded through the parsers. Bennu's monadic interface makes this change easy. Only base parsers have to be changed, those constructed using combinators will automatically gain this behavior, so no third party code will have to change.

Memo data cannot be stored on the parser state object since backtracking restores old states, so the table must be threaded separately though both parsers and continuations. Let's call the opaque memoization structure `m` for now.

To add memoization to the `always` parser, the implementation takes an additional parameter `m` and passes `m` back through the continuation `eok`.

```js
always = \x ->
    new Parser\state m cok cerr eok eerr ->
        eok(x, state, m);
```

Most parsers just pass along `m`. `either` shows that while backtracking restores state, it does not restore the previous memoization table:

```js
either = \p q ->
    \state#{position} m cok cerr eok eerr -> let
        peerr = \errFromP _ mFromP -> let
            qeerr = \errFromQ _ mFromQ ->
                eerr(new ChoiceError(position, errFromP, errFromQ), state, mFromQ);
        in
            q(state, mFromP, cok, cerr, eok, qeerr);
    in
        p(state, m, cok, cerr, eok, peerr);
```

Top level calls to parsers are free to pass in an existing memoization table or provide a empty one.

## Memoization Key

Using the argument set as the memoization table lookup will not work, so what should the memoizer use for keys? `m` is shared between all parsers, so one part of the key must identify the target parser. The other part must be the state, since the state contains all the information that could effect the parser's output: position, input stream, and user data.


## What To Store

The memoize a parser, unlike a regular function, we can't cache the returned result of a parser in the memo table. Parsers are continuation based, and evaluating a continuation will evaluate the rest of the program:

```js
always = \x ->
    new Parser\state m cok cerr eok eerr ->
        // Storing the result of eok(x, state m) makes no sense
        // because evaluating the continuation would
        // evaluate the rest of the program
        eok(x, state, m);
```

Rather than store the result of `eok(x, state, m)`, memo table entries hold data that represents the behavior of calling the `eok` continuation passed to a parser with `x` and `state`. This can be used to reconstruct a constant time parser with this behavior.

Reconstructing a parser's behavior requires: the value succeeded with, the state succeeded with, and how the parser completed (`eok`, `err`, `cok`, `cerr`). Since different continuations may be passed to a memoized parser, the continuation functions themselves cannot be cached.

# Basic Implementation
You can find the complete implementation in [Bennu][bennu].

## The Memo Parser

I decided early in development that Bennu would use manual memoization. This is mainly for performance reasons; memoization adds time and space overhead, so memorizing results from parsers like `always 3` seems wasteful. 

After modifying all basic parsers to pass a memo table, we also need a parser that uses and updates the memo table. The `memo` parser memoizes a parser `p`. When run, it returns either the cached result for `p` in constant time, or performs `p` and caches the result.

```js
memo = \p ->
    \state m cok cerr eok eerr -> {
        var key = {'id': p, 'state': state};
        
        // Check if already have entry
        var entry = Memoer.lookup(m, key);
        if (entry) {
            // run the entry in constant time
            return entry(state, m, cok, cerr, eok, eerr);
        }
        
        // Otherwise perform `p` and cache the result
        return p(state, m,
            \x pstate pm ->
                cok(x, pstate,
                    Memoer.update(pm, key, \_ m cok _ _ _ -> cok(x, pstate, m))),
            \x pstate pm ->
                cerr(x, pstate,
                    Memoer.update(pm, key, \_ m _ cerr _ _ -> cerr(x, pstate, m))),
            \x pstate pm ->
                eok(x, pstate,
                    Memoer.update(pm, key, \_ m _ _ eok _ -> eok(x, pstate, m))),
            \x pstate pm ->
                eerr(x, pstate,
                    Memoer.update(pm, key, \_ m _ _ _ eerr -> eerr(x, pstate, m))));
    };
```

When lookup fails, parser `p` is run with a special set of continuations that intercept the result of `p` and update the memo table. 

```js
// the memo cok continuation
\x pstate pm ->
    cok(x, pstate,
        Memoer.update(pm, key, \_ m cok _ _ _ -> cok(x, pstate, m)));
```

`\_ m cok _ _ _ -> cok(x, pstate, m)` is the value stored in the table. It is a parser that, when fed a set of continuations, always continues with a value `x` and state `pstate` from the outer continuation, and the action represented by the outer continuation.  

## A Simple Memo Table
A linked list is the most simple way to represent the memo table functionally. This is the structure Bennu originally used:

```js
var Memoer = function\key, val, delegate =self-> {
    self.key;
    self.val = val;
    self.delegate = delegate;
};

Memoer.lookup = \cell key -> {
    for (var m = cell; m; m = m.delegate)
        if (m.key.id === key.id && m.key.state.eq(key.state))
            return m.val;
    return null;
};

Memoer.update = \m key val -> new Memoer(key, val, m);
```

# Optimization

## Tree Storage

One problem with the simple memoization table is that lookups are linear. Lookup performance can be improved by storing entries in a ordered tree. Position is the obvious choice for sorting the tree data, with each node containing a key, value map. 

Bennu uses [Seshet][seshet] for this tree. Seshet stores data in an immutable [AVL tree][avltree]. A self balancing tree is especially important for parsers because position is constantly increasing and an unbalanced tree would quickly degrade into a linked list.  

## Pruning Unreachable Results

Another observation is that many memoized entries become unreachable during parsing. Once a parser has committed on a branch, all entries that came before the current position are unreachable. Parsers commit immediately, except for `attempt` which holds its branch open for backtracking.

```js
var a = character 'a' |> memo,
    b = character 'b' |> memo;


var p = sequence(
    a,
    a,
    either(
        attempt <| sequence(a, a, a),
        sequence(a, a, b)));
```

For input `'aaaab'`, after `'aa'` is consumed, the two memoized results are unreachable and can be safely pruned. The `attempt` holds open the branch so that when the next two `'a'` are consumed, the parser doesn't commit yet. If it did commit, the memo table would lose the entry for the third and fourth `'a'` and have to reparse when it backtracks to `next(a, a, a)`.

Parse's pruning implementation is pretty basic, and [Seshet][seshet] handles pruning the tree based on a lower bound position. Along with the current Seshet memo tree, Bennu tracks a memoization window. The memoization window is a stack of frames, each of which contains a lower bound position. The bottom of the stack contains the lowest position that is still reachable.

`attempt` manages the window. It pushes a frame when the `attempt` parser is entered and pops its frame when the parser exits.

```js
attempt = \p ->
    \state m cok cerr eok eerr -> {
        var peerr = \x s m -> eerr(x, s, Memoer.popWindow(m));
        return p(
            state,
            Memoer.pushWindow(m, state.position),
            \x, s, m -> cok(x, s, Memoer.popWindow(m)),
            peerr,
            \x, s, m -> eok(x, s, Memoer.popWindow(m)),
            peerr);
    };
```

Using a stack of frames ensures that nested attempts work properly. 

Since `token` is the only parser that advances the stream, it is the only parser that actually needs to commit. When `token` succeeds, it commits and prunes the memo table to either the window or the current token position.

```js
token = \consume -> let
    \state#{position} m cok cerr eok eerr -> {
        if (state.isEmpty()) {
            return eerr(errorHandler(position, null), state, m);
        } else {
            var tok = state.first();
            if (consume(tok)) {
                var nextState = state.next(tok);
                return cok(tok, nextState, Memoer.prune(m, nextState.position));
            }
            return eerr(errorHandler(position, tok), state, m);
        }
    };
```

This simple scheme keeps the memoization tree small and makes lookups efficient.



[jsmemo]: http://addyosmani.com/blog/faster-javascript-memoization/
[memoization]: http://en.wikipedia.org/wiki/Memoization
[avltree]: http://en.wikipedia.org/wiki/AVL_tree
[bennu]: https://github.com/mattbierner/bennu
[parse-ecma]: https://github.com/mattbierner/parse-ecma
[seshet]: https://github.com/mattbierner/seshet