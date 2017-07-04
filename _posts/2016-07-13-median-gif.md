---
layout: post
title: "median.gif"
date: '2016-07-13'
description: "Median blending gifs"
series: gif
titleImage:
    file: "main.gif"
---

{% include image.html file="main.gif" %}

*[median.gif][site]* is an experiment blending multiple frames of animated gifs using [median blending][median]. Similar to *[scanline.gif][scanline]*, this allows viewing the entire animation in a single image, or you can play around with the rendering settings to generate new gifs.

**Links**

* [Site][site]
* [Documentation][documentation]
* [Source][source]


*median.gif* combines multiple frames on an animation by averaging the pixel values of each frame. This produces an image that captures the movement of objects in the scene, as well as which objects are stationary.

{% include image.html file="sample-all.png" description="Blending all frames to a single image" %}

The tool also includes a number of [settings][documentation] for tweaking how frames are sampled and how the blending works.


{% include image.html file="increment-4.gif" description="Increasing sample increment" %}


{% include image.html file="clamp.gif" description="Clamp frame sampling" %}


[Check out the *median.gif* site][site] to load your own gif from [Giphy](https://giphy.com) and play around with the rendering settings.



[scanline]: /scanline-gif

[site]: https://mattbierner.github.io/median-gif/
[source]: https://github.com/mattbierner/median-gif
[documentation]: https://github.com/mattbierner/median-gif/blob/gh-pages/documentation/about.md

[median]: http://petapixel.com/2013/05/29/a-look-at-reducing-noise-in-photographs-using-median-blending/