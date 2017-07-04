---
layout: post
title: "scanline.gif"
date: '2016-07-06'
description: "Flattening animated gifs to a single image and generating a slit-scan like effect"
series: gif
titleImage:
    file: "cat.gif"
---

{% include image.html file="cat.gif" %}

*[scanline.gif][site]* is an experiment flattening gifs so that multiple frames of animation are shown in a single image. These images themselves can be pretty interesting, but we can also then replay the original animation to generate fun new gifs. The resulting effect is kind of like [slit-scan photography](https://en.wikipedia.org/wiki/Slit-scan_photography).

**Links**

* [Site][site]
* [Documentation][documentation]
* [Source][source]


# Concept
The original idea behind *scanline.gif* was to explore rendering every frame of an animated gif in a single (still) image. This is accomplished by breaking the final image into non-overlapping slices and rendering each frame of the animation into different slices. For example, the left side of the final image may show the first frame of the animation, while the middle section may show frame seven. It's easier to show this than explain.

Take a 13 frame gif where each frame is a solid color, starting with red at frame 1 and fading to blue at frame 13.

{% include image.html file="rb-example-start.gif" %}

Now slice the gif into 13 equal width columns. Draw each column of the image from left to right, but also advance the animation one frame between drawing columns. You end up with a single image that captures every frame of the original animation.

{% include image.html file="rb-example.png" %}

While not clearly shown in this simple example, the slices are actually three dimensional samples of the gif image cube. Each slice selects a time (frame) and  image data (pixels) from that frame. This image data is then projected back onto the final 2d image.

These images can be pretty cool but, for even more fun, you can then replay the animation by shifting which frames the slices sample. Here's what that looks like:

{% include image.html file="rb-example-columns.gif" %}



# Other Settings
Besides the basic column rendering showing above, *scanline.gif* provides a few different modes for placing the image slices. [The documentation][documentation] explains these in more detail, along with the other rendering settings, but here's a few quick examples ([original gif used for these examples](https://media2.giphy.com/media/jb5WFJTgSSonu/giphy.gif)):


{% include image.html file="cat-columns.gif" description="Columns - Equal width columns, one for each frame of the animation" %}

{% include image.html file="cat-rows.gif" description="Rows - Equal height rows, one for each frame of the animation" %}


{% include image.html file="cat-grid2.gif" description="Grid - Customizable version of columns/rows. Renders frames in a grid pattern" %}


{% include image.html file="cat-diag.gif" description="Diagonal - Rotated, customizable version of columns/rows" %}

{% include image.html file="cat-circles.gif" description="Rings - Rings of scan-lines" %}

[Check out the *scanline.gif* site][site] to load your own gif from [Giphy](https://giphy.com) and play around with the rendering settings. With a good gif, mixing the setting can produce pretty fun images and new animations.




[site]: https://mattbierner.github.io/scanline-gif/
[source]: https://github.com/mattbierner/scanline-gif
[documentation]: https://github.com/mattbierner/scanline-gif/blob/gh-pages/documentation/about.md