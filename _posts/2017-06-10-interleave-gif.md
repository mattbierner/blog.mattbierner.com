---
layout: post
title: "interleave.gif"
date: '2017-06-10'
series: gif
description: "Interleaving the frames of two gifs"
titleImage:
    file: "shark.gif"
---

{% include image.html file="logo.svg" href="https://mattbierner.github.io/interleave-gif/" %}

**Links**

- [Try it out][site]
- [Documentation][docs]
- [Source](https://github.com/mattbierner/interleave-gif)

*interleave.gif* is a small experiment in interleaving the frames of two gifs. The resulting gifs are usually pretty strobe but sometimes the effect can be fun.

{% include image.html file="bomb.gif" %}

The site allows you to interleave any two gifs from [Giphy](http://giphy.com/), and configure how frames from each are interleaved and scaled. The default behavior evenly distributes the frames of the two gifs. For example, if gif `A` has 6 frames and gif `B` has 2 frames, the resulting gif has the following frame sequence:

```
A0 A1 A2 B0 A3 A4 A5 B1
```

You can find information about the interleaving and scaling options in the [documentation][docs]. I find that the best results alternate frames in such a way that your brain combines them into a weird new animation.

{% include image.html file="shark.gif" %}


And although this experiment is not nearly as interesting as I had hoped—especially compared to some of my [other experiments with gifs][dot-gif]—it's a good stepping stone for another take on gif interleaving that I have in mind. More details on that to come.

**Update**

Check out [blueframe](/blueframe) for the other take on interleaving mentioned at the end of this post.


[site]: https://mattbierner.github.io/interleave-gif/
[docs]: https://github.com/mattbierner/interleave-gif/blob/gh-pages/documentation/about.md
[dot-gif]: /series/gif