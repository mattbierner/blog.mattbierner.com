---
layout: post
title: "Gif Player"
description: 'VS Code extension that adds a play/pause button and scrubber to gifs'
series: gif
titleImage:
    file: 'example.gif'
---

In what is without doubt the most practical [`.gif` post](/series/gif) yet, allow me to introduce [Gif Player][extension]: a VS Code extension that adds a play/pause button and scrubber to any gif you open in VS Code.

**Links**

- [Extension][extension]
- [Source](https://github.com/mattbierner/vscode-gif-player)

{% include image.html file="example.gif" description="Using Gif Player in VS Code" %}

Gif Player uses [VS Code's Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors) to implement a feature that I wish every browser and operating system had out of the box. <!-- not to mention every blog... --> Rather than building this functionality into VS Code though, I thought Gif Player would be a perfect use case for Custom Editors (I am more than a tad biased since I created VS Code's Custom Editor API).

And although Gif Player is terribly lacking in both cats and Nick Cage (a problem which I leave to the reader), the extension did at least build on code from my [past `.gif` projects](/series/gif).

So, [give it a try!][extension]

[extension]: https://marketplace.visualstudio.com/items?itemName=bierner.gif-player