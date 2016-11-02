---
layout: post
title: Incremental Parsing With Feedback in a Web Worker
date: '2014-05-02'
---
I [previously described][mb-inc] running [Bennu][bennu] parsers incrementally. Here I show how we can offload incremental parsing to a web worker, and get realtime feedback as the worker parses data.

## Example Overview
I'm going to develop a simple word count application that uses a Bennu parser run in a web worker. For demonstration purposes, the main thread simulates an asynchronous event source to pass chunks of data to a parser web worker.

Example code is written in [Khepri][khepri]. You can can find the complete code [on Github](https://github.com/mattbierner/bennu-webworker-example), including the HTML and other less important parts of the example application. A [live version of the demo](http://mattbierner.github.io/bennu-webworker-example/) is also available. 

## Goals
* Run parsing routines on the web worker without blocking the main thread, even for very large inputs.
* Support any data source, including data from asynchronous events or data that is partially available. Potential sources include reading from a web socket or another web worker, or UI events.
* Allow the main thread to request status updates during parsing.
* Support almost any parser (the same restrictions as with normal incremental parsers apply).


# Main Thread
The main thread initializes the parser web worker, feeds chunked data to the parser, and receives updates and results from the parser.

The demo application gets text input from an HTML field, and simulates an async data source using `setInterval`. Input is broken into chunks and feed to a word count parser web worker.

After feeding a chunk to the parser, the main thread requests a status update on parsing, which will get the current word count for the input consumed so far. Once all input has been provided, the main thread is notified of the final word count result.

## Data Source and Chunking Input
Breaking input into chunks allows us to parse naturally chunked data, such as that from a web socket or keyboard events. But even with a complete input stream, chunking input is beneficial.

We can request the working result of an incremental parser between calls to `provide`, but not while a chunk is being parsed. At one extreme, the main thread feeds the parser its entire input in a single chunk. This however prevents us from getting updates during parsing.

```js
// Extreme case, an infinite data source and single provide.
var s = incremental.runInc(
    many character('a'));

// Infinite data source.
var input = gen(Infinity, 'a');

// This call never completes.
// We also cannot see the status of parsing.
incremental.provide(input, s);
```

At the other extreme, the main thread breaks input into single character chunks. Smaller chunks provide more granular and meaningful status updates during parsing.

While single character chunks may be appropriate for certain applications, such extreme chunking adds a lot of messaging overhead. A compromise between these two extremes is usually best, with the specific choice dependent on the data source and application.

```js
var s = incremental.runInc(
    many character('a'));

// Infinite data source.
var input = gen(Infinity, 'a');

// Provide characters on at a time
// This call also never completes, but the callback can see the status
// after each character is consumed
stream.forEach(\x -> {
    s = incremental.provideString(x, s);
    
    // get status
    var status = incremental.finish(s);
}, s);
```

## Messages
The main thread signals the web worker parser using four types of JSON encoded messages:

* `'begin'` signals a parsing reset.
* `'provide'` feeds a chunk of data to the parser.
* `'finish'` signals the end of input. When parser worker finishes, it sends the parsing result back to the main thread.
* `'status'` requests the current result from a partially complete parser. This is similar to `'finish'`, but leaves open the possibility more input will be provided.

```js
var worker := new Worker "worker.js";

// Message send helper functions
var post := JSON.stringify \> worker.postMessage.bind(worker);

var postBegin := post @ { type: 'begin' };

var postStatus := post @ { type: 'status' };

var postFinish := post @ { type: 'finish' };

var postProvide := post <\ \x -> ({ type: 'provide', input: x });
```

## Feeding the Parser
Although the demo application gets the input to be parsed from a text area, I simulate an asynchronous data source using `setInterval` and a manual chunking routine. `setInterval` is not necessary but, as mentioned, manually chunking input is worthwhile as it allows more granular status updates during parsing.

```js
// Main thread state.

// Buffer State
var len = 0,
    index = 0,
    input = "";

// interval id feeding data
var interval;
```

#### Begin
`begin` starts parsing some input `i`. In this example, `i` contains the complete input. After resetting the parser, the main thread kicks off the chunked input provides that feed data to the parser.


```js
var begin := \i -> {
    // Update state
    len = i.length;
    index = 0;
    input = i;
    
    // Signal a reset
    postBegin();
    
    // Start providing data
    clearInterval interval;
    interval = setInterval(provide, 50);
};
```

#### Finish

`finish` signals that parser worker that no more input is coming.  

```js
var finish := \ -> {
    clearInterval interval;
    postFinish();
};
```

## Provide

`provide` simulates the callback from an asynchronous data source. It manually gets the next chunk of input data and sends the chunk to the web worker. After feeding a chunk to the parser, `provide` requests a parsing status update. Once no more input is available, we call `finish` to get the final result.

```js
var provide := \ -> {
    var end := index + 20;
    var next := input.substring(index, end);
    index = end;
    
    postProvide(next);
    
    if (index >= len) {
        finish();
    } else {
        // Request the working value from parsing
        postStatus();
    }
};
```

## Response Handling
The main thread receives status update and parser result JSON message from the web worker parser. When parsing fails, the web worker sends the error message back to the main thread so that we can handle parser errors on the main thread instead of in the web worker.

```js
worker.onmessage = (.data) \> JSON.parse \> \x -> {
    if (x.error) {
        console.error(x.value);
    } else {
        console.log(x.value);
    }
};
```


# Worker Thread
The worker thread defines the word count parser, handles messages from the main thread, and sends parsing results back to the main thread.

This worker use an incremental Bennu parser to feed chunks of data from the main thread to a parser, and extract working results from this parser. Parsing may either succeed or fail with a result value.

## Initialization
Bennu uses AMD to define its packages and import dependancies. After loading an AMD module loader using `importScripts`, we configure it for Bennu and its dependancies. A standard `require` block  can then load Bennu.


```js
static importScripts;
static requirejs, require;

importScripts './resources/require.js';

// Configure paths to Bennu and it deps
requirejs.config {
    baseUrl: '.',
    paths: {
        'bennu': 'dependencies/bennu/dist',
        'nu-stream': 'dependencies/nu-stream/dist',
        'seshet': 'dependencies/seshet/dist/seshet'
    }
};
```

## Parser
Almost any Bennu parser can be run incrementally. For this example application, the word count parser run by the web worker tracks word count in the parser user data field. 

```js
require @ [
   'bennu/parse',
   'bennu/text',
   'bennu/incremental']
\
    parse#{next sequence many many1}
    {match}
    incremental ->
{    
    // Note that these regexps are not really correct, but they work well enough
    // for this demo
    var sep := many match(`\W`m);
    var word := many1 match(`\w`m);
    
    // Increment word count
    var inc := parse.modifyState(+, 1);
    
    var token := sequence(word, sep, inc);

    var parser := sequence(
        sep,
        many token,
        parse.getState); // get word count
    
    ...       
}
```

## Result Messaging
Parsing may either succeed with a result or fail with an error. Parsers run using Bennu's `run*` methods fail by throwing an exception, but in a web worker we don't want to throw an error in the worker thread itself. Instead the worker should pass both success and error results back to the main thread.

To avoid throwing errors, the parses is run with two custom completion functions: `ok` for success and `err` for failure. These callbacks pass data back to the main thread and are triggered when `finish` is called on the parser (which may be well after the actual parsing has completed).

```js
// Callbacks
var ok := \x ->
    postMessage <| JSON.stringify { value: x };
    
var err := \x ->
    postMessage <| JSON.stringify { error: true, value: x };
```

## Message Handlers
When initialized, the web worker registers an event handler to decode and dispatch messages.

```js
self.onmessage = \{data} -> {
    var m = JSON.parse(data);
    switch (m.type) {
    case 'begin':
        return begin();
        
    case 'provide':
        return provide(m.input);
    
    case 'status':
    case 'finish':
        return finish();
    }
};
```

#### State
The parser web worker maintains an internal state, which the various actions update or query. For this simple word count application, the internal state is just the opaque incremental parser state object that the Bennu incremental functions operate on. More advanced applications may cache and reuse previous parser states.

```js
// Web worker state.
// Opaque incrementally applied parser state from Bennu
var state;
```

#### Begin
`begin` resets parsing. The Bennu function `incremental.parseInc` gets an initial parser state before any input is consumed. `parseInc` hooks up our `ok` and `err` callbacks and sets the initial user data (current word count) to `0`.

```js
var begin := \ -> {
    state = incremental.parseInc(parser, 0, ok, err);
};
```

#### Provide
`provide` feeds a chunk of (string) data `input` to the parser with `incremental.provideString` and updates the internal state. Incremental Bennu operations like `provideString` do not mutate incremental parser objects, so we have to explicitly capture the update the web worker parser’s state after providing input. 

```js
var provide := \input -> {
    state = incremental.provideString(input, state);
};
```

#### Finish
`finish` completes parsing. The parser result is passed though one of the two callbacks we set up with `parseInc`. We could invalidate the internal parser state as well, but this example does not.

```js
var finish := \ ->
    incremental.finish(state);
```


# Conclusions
This simple application demonstrates how we can offload Bennu parsing to a web worker, allowing us to safely parse very large inputs without blocking the main thread. Furthermore, chunking the input allows the main thread to get status updates during parsing.

This approach can be applied to almost any data source and parser. 

[mb-inc]: /incremental-parser-combinators-in-javascript/
[webworkers]: https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers

[bennu]: https://github.com/mattbierner/bennu
[khepri]: https://github.com/mattbierner/khepri
