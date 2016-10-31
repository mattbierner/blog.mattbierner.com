---
layout: post
title: "require('emotions')"
date: '2016-05-20'
description: "$ npm install --save emotions"
---

It's amazing what you can find on npm. Just the other day, I npm installed [all of human history][all-of]. So now, allow me to present a great new npm package for your consideration: [`emotions`][npm] ([source][src])

```bash
$ npm install --save emotions
```

`emotions` adds emotions to code. Simple as that.

```js
require('emotions/love');
require('emotions/elation');

// or

import {love, elation} from 'emotions';
```

Now, you're probably asking yourself: why would I want to sully my beautiful and logical code with all those squishy, intangible emotions? Well, these aren't your father's emotions. The `emotions` package is a scientific approach to the emotional problem, with comprehensive support for 48 emotional states as defined by the [HUMAINE Emotion Annotation and Representation Language (EARL)][humaine]:

```
affection
amusement
anger
annoyance
anxiety
boredom
calm
contempt
content
courage
delight
despair
disappointment
disgust
doubt
elation
embarrassment
empathy
envy
excitement
fear
friendliness
frustration
guilt
happiness
helplessness
hope
hurt
interest
irritation
joy
love
pleasure 
politeness
powerlessness
pride
relaxed
relieved
sadness 
satisfaction
serene 
shame 
shock
stress
surprise
tension
trust
worry
```

This provides 100% coverage of the human experience.


# Use Cases
Here's a few example uses cases for the `emotions` package.

## Add Emotional Subtlety to Human Computer Interaction
Most new programmers start by writing:

```js
console.log('Hello world!');
```

Here's the same program, rewritten to understand the user and interact with them on a more human level:

```js
const emotions = require('emotions');

console.log(emotions.empathy('Hello world!'));
```

## Improve the EQ of your Product
Here's a simple web server in Node:

```js
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.write('<p>Hello world!</p>');
    res.end();
});

server.listen(3000, () => {
    console.log('server listening on port 3000');
});
```

And here's an emotional web server in Node:

```js
const http = require('http');
require('emotions/happiness');

const server = http.createServer((req, res) => {
    require('emotions/politeness');
    res.writeHead(200);
    res.write('<p>Hello world!</p>');
    res.end();
});

server.listen(3000, () => {
    require('emotions/excitement');
    console.log('server listening on port 3000');
});
```

Easy.


## When Comments are not Enough
`emotions` is also great for source code:

```js
import {despair} from 'emotions';

// 50000 lines of spaghetti code
```

Or, scope to just a block:


```js
// Garbage someone else wrote

{
    import {pride} from 'emotions';
    // Amazing code that you wrote
}

// More garbage
```

Or even to an expression:

```js
import emotions from 'emotions';

var THREE = emotions.stress(1 + 2);
```


# And Much, Much More
Those are just a few ideas of what `emotions` is capable of.

Check out the [source on Github][src] for more complete documentation of `emotions`, and `npm install emotions` to get started.


(I used to write great code; now this... `require('emotions/despair')`)

[all-of]: https://github.com/mattbierner/all-of-human-history
[npm]: https://www.npmjs.com/package/emotions
[src]: https://github.com/mattbierner/emotions
[humaine]: http://emotion-research.net/projects/humaine/earl




