---
layout: post
title: Incremental Parser Combinators In Javascript
date: '2013-12-08'
---
Parsers are often run against data streams that are not fully available. Maybe you want to parse user input to provide realtime feedback and improve application responsiveness, or perhaps you need to parse web socket data incrementally to limit user interface blocking.

This post overviews the problem of incremental parsing in Javascript and details the implementation used by [Parse][parse] to incrementally run monadic parser combinators.

#### Goals

* Functional style implementation.
* Input agnostic.
* Operate on unmodified Parse.js parser combinators (with a few exceptions).
* Correctly handle backtracking and end of file.
* Easy to use API.

Besides allowing parsers to be run incrementally, the implementation allows a few other interesting operations:

* Cache partially completed incremental parser states.
* Branch incremental parsers by feeding a state different inputs.
* Access the working output value of a incremental parser.

#### Links
* [Parse][parse] - Base parser combinator library and complete incremental parsing implementation.
* [Khepri][khepri] - ECMAScript derived language used for implementation.

# Problem Overview
Incremental parsing require solving two subproblems: creating resuming parsers and expressing incremental streams. 

## Incrementally Applying Parse Parsers
Behind its monadic parser combinator interface, [Parse][parse] parsers are implemented with continuations. A parser takes four continuations, and calls one based on its completion condition: `cok` when input is consumed and the parser succeeds, `cerr` when input is consumed and the parser fails, `eok` when no input is consumed and the parser succeeds, and `cerr` when input is consumed and the parser fails.

```js
// The always parser does not consume any input and
// completes successfully with a value.
always = \x ->
    \state, m, cok, cerr, eok, eerr ->
        eok(x, state, m);
```

During execution, each continuation contains the rest of the parser execution for its completion condition. By capturing a continuation and abortively returning it (not calling any continuation), parsers can easily be manually paused and resumed at set points during execution:

```js
// Abortively complete with a value by 
// not calling a continuation.
var abort = \x -> \state, m, cok, cerr, eok, eerr -> x;

/// Reify `eok` continuation and abort with it.
var pause = \state, m, cok, cerr, eok, eerr ->
    \x -> eok(x, state, m);

var resumable = sequence(
    character('a'),
    pause,
    character('b'));

var partial = parse.run(resumable, 'ab');
partial(); // ‘b’
```

We can even feed values into the paused parser and evaluate the continuation multiple times with different values:

```js
var resumable = eager <| enumeration(
    character(‘a’),
    pause,
    character(‘b’));

var partial = parse.run(resumable, ‘ab’);

partial('x'); // ['a', 'x', 'b']
partial('y'); // ['a', 'y', 'b']
partial(); // [‘a’, undefined, ‘b’]
```

The other continuations can be captured the same way, although `eok` is the most useful.

## Incremental Input
Parse.js parsers operates on [Nu][nu] streams of input. [Nu streams consist][nu-stream-api] of a head value and a function that generates the rest of the stream, allowing  lazily generated, potential infinite streams to be defined.

```js
// Stream of [1, 2, 3]
var s =
    stream(1, \() ->
        stream(2, \() ->
            stream(3, \() -> NIL)));
```

However, this definition requires every element of a valid Nu stream be accessible at construction. There is no way to define a Nu stream of something like user input because the stream cannot refer to values that do not yet exist (the keys a users will enter) when creating the initial stream. It is not clear what the head value should be, and updating the stream in response to user input would require mutation.

A good functional language can interface such streams with a parser (see the [CC-delcont resumable parsing example][delcont-resumable-parsing]), but I did not find any of these approaches suitable for Javascript. I wanted the incremental parsing API to be clear and easy to use with common Javascript programming patterns.

#### Incremental Streams
Incremental input streams consist of two parts: a stream of available data and some remainder that will contain the rest of the data in the input stream. A finished incremental stream has only available data.

The most simple incremental stream is a standard Nu stream. For a stream `s`, the available data is `s` and the remainder is the empty stream.

Incremental parsers run on the available section. In the simple stream case, this requires waiting until the entire input stream is available before any parsing takes place, which is how Parse normally operate.

#### Chunks
Instead of requiring the entire stream be available before starting parsing, we can break the stream it into chunks. As chunks become available, we shift them from remainder to the available stream and run the parser against chunks as they become available. (The idea for chunking the input was adapted from [A Parsing Trifecta][a-parsing-trifecta] with influences from [CC-delcont resumable parsing][delcont-resumable-parsing]).

A chunk is a complete Nu stream of zero or more elements. Chunk size may vary and can be determined by data availability or desired behavior. The input stream consists of zero or more chunks, each uniquely identifiable by an id. 

Given a chunk id, the incremental parsers must be able to determine the chunk of id of the next chunk in the sequence. A simple counter is used for this.

#### Backtracking
Backtracking presents one complication. Consider the parser:

```js
var aa_or_ab = either(
    attempt <| sequence(
        character(‘a’),
        character(‘a’)),
    sequence(
        character(‘a’),
        character(‘b’)))
```

`attempt` ensures that input like `’ab’` is handled correctly by saving and restoring the parser state. Without `attempt`, input `’ab’` would fail since some input is consumed before the first option in `either` fails. 

If two chunks are feed to the parser:

```js
// Begin parsing
var r = runInc(aa_or_ab);

// Provide chunk 0
var r2 = provideString(r, ‘a’);

// Provide chunk 1
var r3 = provideString(r2, ‘b’);

// End parsing and get result
finish(r3); // ‘b’
```

the parser backtracks when `’b’` is encountered. This restores a parser state at chunk 0. Instead of requesting another chunk 1 be provided, the parser should use the chunk 1 that was provided to complete the parsing.

Therefore, a chunk map must be stored external to the parser state to ensure the input stream is consistent even when backtracking. Otherwise, the incremental parser would require a new chunk 1 values for each backtracking.
 
# Implementation Overview
A custom parser state for incremental parsing chunked input is defined. The incremental state tracks the id of the working chunk. When it runs out of data for a chunk, it reifies the current parser execution and abortively returns a request for the next chunk. An `Session` data structure stores chunks. The `provide` operation provides chunks for requests while `finish` signals the end of file.

#### Structures
`IncrementalState` - `ParserState` used for incremental parsing. Wraps an internal `ParserState` state.

`Request` - Request for a chunk.

`Session` - Partially applied parser state. 

#### Core Operations
`parseIncState` - Begin incremental parsing. Returns a `Session`.

`provide` - Feed a new chunk to a Session. Returns a `Session`.

`finish` - Signal that an incremental parser is complete. Return the result from parsing.

# Code Implementation
The following code is adapted from [Parse's incremental implementation][parse-incremental-source]

## Request and Session
The `Request` and `Session` data structures are straightforward:

```js
var Request = function(chunk, k) {
    this.chunk = chunk; // Requested chunk identifier
    this.k = k; // Parsing continuation
};


var Session = function(done, k, chunks) {
    this.done = done; // Is parsing complete?
    this.k = k; // Parsing continuation

    // Array mapping chunk identifiers to chunk data.
    this.chunks = chunks; 
};

Session.prototype.addChunk = \c ->
    new Session(
        this.done,
        this.k,
        this.chunks.concat(c));

Session.prototype.hasChunk = \id -> (id < this.chunks.length);

Session.prototype.getChunk = \id -> this.chunks[id];
```

## IncrementalState
`IncrementalState` wraps an internal parser state and forwards operations to it. It tracks the current chunk and generates requests for the next chunk in the input stream.

```js
var IncrementalState = function(chunk, state) {
    this.chunk = chunk; // Working chunk id
    this.state = state; // Inner state
};
```

All the standard operations for input and position are forwarded to the inner state:

```js
IncrementalState.prototype.eq = \other ->
    (other && other.chunk === this.chunk && 
      this.state.eq(other.state));

Object.defineProperties(IncrementalState.prototype, {
     'input': { 'get': \() -> this.state.input },
     'position': { 'get': \() -> this.state.position },
     'userState': { get': \() -> this.state.userState }
});
     
IncrementalState.prototype.setInput = \input ->
    new IncrementalState(
        this.chunk,
        this.state.setInput(input));
 
IncrementalState.prototype.setPosition = \position ->
    new IncrementalState(
        this.chunk,
        this.state.setPosition(position));
 
IncrementalState.prototype.setUserState = \userState ->
    new IncrementalState(
        this.chunk,
        this.state.setUserState(userState));
```

The inner state has no knowledge of chunks but operates on the working chunk’s data stream. Stream functions are also forwarded to the inner state:

```js  
IncrementalState.prototype.isEmpty = \() -> 
 this.state.isEmpty();
    
    IncrementalState.prototype.first = \() -> this.state.first();
```

Chunks are handled in the `next` function. `next` takes a consumed token `x` and returns a parser for the remainder of the input. `IncrementalState.prototype.next` gets the inner state for the consumed token. When the inner state is empty (there is no more data for the current chunk), `IncrementalState` requests the next chunk of data.

```js
IncrementalState.prototype.next = \x -> {
    var chunk = this.chunk;

    // Get the next inner state from feeding the
    // inner state the consumed token. 
    return bind(
        next(this.state.next(x), getParserState),
        \innerState -> {
             // Check if the next inner state has any more data
             // for the current chunk
             if (innerState.isEmpty())
                 // Return a parser that abortively completes
                 // with a request for the next chunk.
                 // The request continuation takes the
                 // next chunk stream `i` and continues
                 // parsing with a new incremental parser
                 // state with inner state for input `i`.
                 return \_, m, cok ->
                    new Request(
                        chunk + 1,
                        \i -> cok(x, new IncrementalState(chunk + 1, innerState.setInput(i)), m))

             // Otherwise, the working chunk was not empty.
             // Continue parsing the rest of the data for
             // the current chunk.
             return \_, m, cok ->
                 cok(x, new IncrementalState(chunk, innerState), m) 
        });
    };
```

One important observation is that requests are made when the next inner state is empty, not the current inner state. This allows the `isEmpty` and `first` methods of `IncrementalState` to work correctly, as the current inner state always contains the stream of the current chunk. Only when the true eof is reached will the inner state contain an empty stream.

## Operations

#### Provide
`provide` passes data for a new chunk `c` to Session `r`. `forceProvide` is the internal method that contains the provide logic. `forceProvide` adds all chunks fed to it, even empty ones that `provide` ignores.

```js
var forceProvide = \r, c -> {
    // Feeding data to a complete session is a noop.
    if (r.done) return r;

    // Add the chunk and get a new session.
    var r2 = r.addChunk(c);         
    
    // Fulfill the initial request.
    // trampoline handles the internal tail call implementation.
    var result = r2.k(c) |> trampoline;
    
    // While requests are returned, and we have chunks
    // for these requests, fulfill these requests as well.
    while (result instanceof Request && r2.hasChunk(result.chunk))
        result = result.k(r2.getChunk(result.chunk)) |> trampoline;
    
    return (result instanceof Request ?
        new Session(false, result.k, r2.chunks) :
        result);
};

provide = \r, c ->
    (isEmpty(c) ?
        r :
        forceProvide(r, c));
```

Type checks are required to discriminate between a regular abortively returned value and an abortively returned request.

`provide` always parses as much as possible before returning. Backtracking may restore states for prior chunks, so multiple requests for existing chunks may be made before a new chunk is requested. The while loop handles these requests.

A `provideString` helper function is also useful for providing strings directly:

```js
provideString = \r, input -> provide(r, streamFrom(input));
```

#### finish
`finish` signals that no more input is coming. It finishes the current parser and runs the outermost continuations, returning the result.

```js
finish = let
    complete = \r -> r.k()
in
    \r -> complete(forceProvide(r, NIL));
```

In order to handle backtracking with EOF correctly, finish must register an empty chunk for the end of the file. This is why `forceProvide` is required.

Top level continuations are evaluated when `finish` is called, not when the parser completes. If they do something non functional-style, such as throwing an exception, this prevents this behavior from occurring until `finish` is called.

## Starting Parsing
`parseIncState` and `parseInc ` begin a new incremental parsing of a parser `p` and return a new Session. `parseInc` supplies a default inner state while `parseIncState ` allows a custom one to be provided.

```js
parseIncState = \p, state, ok, err -> let
    suc = \x, s -> new Session(true, (ok, x, s)),
    fail = \x, s -> new Session(true, (err, x, s)),
    
    k = \i -> parseState(
        p,
        new IncrementalState(0, state.setInput(i)),
        suc,
        fail)
in
    provide(
        new Session(false, k, []),
        state.input);

parseInc = \p, ud, ok, err ->
    parseIncState(
        p,
        new ParserState(NIL, Position.initial, ud),
        ok,
        err);
```

`suc` and `fail` are the outermost callbacks, `suc` for success and `fail` for error. Both return complete Sessions. The continuation of these Sessions is the actual `ok` or `err` callback. This ensures the `ok` and `err` are only evaluated when `finish` is called and not when the parser completes.

The continuation of the returned session, `k`, begins parsing when the first chunk stream `i` is provided. The initial `IncrementalState` is created by setting the input on the initial inner state.

The outer `provide` in `parseIncState` handles cases where the initial state has some input. It is a noop for cases like `parseInc` where the input of the `ParserState` is `NIL`.

# Examples
#### Simple Incremental Parser

```js
var r = runInc(string('abc'));

// returns 'abc'
finish(provideString(r, 'abc')); 

// returns 'abc'
finish(
    provideString(
        provideString(r, 'ab'),
        'c'));
        
// throws Expected 'c' found 'x'
finish(
    provideString(
        provideString(r, 'ab'),
        'x')); 
        
// throws Expected 'c' found end of input
finish(provideString(r, 'ab')); 
```

#### EOF
```js
var r = runInc(
    then(string('abc'), eof)));

// returns 'abc'
finish(provideString(r, 'abc')); 

// throws Expected eof found 'd'
finish(
    provideString(
        provideString(r, 'ab'),
        'cd'));
```
 
#### Inspecting Working Values
Incremental parsers can be finished multiple times. This is useful for providing feedback during parsing.

```js
  var r = runInc(
  eager <| many(character('a')));
  
  var result;
  do {
      r = provideString(r, 'a');
      result = finish(r);
  } while (result.length < 5);
  result; // ['a', 'a', 'a', 'a', 'a']
```

## External examples
* [Parse-PN][parse-pn] - Example incremental polish notation evaluator. 
* [Parse ECMA Incremental][parse-ecma-incremental] -  Incremental ECMAScript lexer.

# Limitations
The major limitation of this approach is that a custom parser state is used. Most application should never touch the parser state directly, but certain cases do require custom parser states.

##### parse.modifyParserState, parse.getParserState, and parse.setParserState
All of these operate on the `IncrementalState` instead of the real, inner parser state. If the state is only interacted with using the standard API, this is not a problem.

##### Custom Parser States
Custom parser states with custom logic and properties will not work properly. Only the standard properties and operations are forwarded to the inner state.

##### parse.getInput and parse.setInput
`parse.getInput` returns the input for just the current chunk. `setInput`  will only set the input for the current chunk and does not effect the value of the chunk stored in a `Session`.

##### Abortive Parsers
Parse does not include any abortive parsers, but a custom one may be defined. Abortive results from such a parser are returned directly from `provide` instead of a `Session`. I felt this was the correct behavior.

# Closing Thoughts
Even with the noted drawbacks, this approach works well and supports almost all unmodified Parse parsers. The solution was designed for Javascript, but could be adapted to other languages, although more appropriate solutions may exist for your language of choice.


[parse]: https://github.com/mattbierner/parse.js
[parse-incremental-source]: https://github.com/mattbierner/parse.js/blob/master/lib/incremental.kep
[nu]: https://github.com/mattbierner/nu
[nu-stream-api]: https://github.com/mattbierner/nu/wiki/Stream-API
[parse-pn]: https://github.com/mattbierner/parse-pn
[parse-ecma-incremental]: https://github.com/mattbierner/parse-ecma-incremental

[khepri]: https://github.com/mattbierner/khepri

[delcont-resumable-parsing]: http://www.haskell.org/haskellwiki/Library/CC-delcont#Resumable_Parsing
[a-parsing-trifecta]: http://comonad.com/reader/wp-content/uploads/2009/08/A-Parsing-Trifecta.pdf