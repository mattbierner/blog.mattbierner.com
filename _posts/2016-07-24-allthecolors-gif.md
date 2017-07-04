---
layout: post
title: "allthecolors.gif"
date: '2016-07-24'
description: "Gifs with every color, from 0x000000 to 0xffffff"
series: gif
titleImage:
    file: "main.png"
---

{% include image.html file="main.png" %}

Six months ago, [@wholerainbow][wholerainbow] began its quixotic quest to post every single [24-bit RGB color][24-color] to Twitter. The bot has made remarkable progress since then, working its way up from `0x000000` all the way to `0x00b600`, well over one quarter of one percent of the way there!

Inspired by this effort, I recently created a small collection of gifs that each contain every 24-bit RGB color, from `0x000000` to `0xffffff`. Now, gifs are not exactly known for their color fidelity—being limited to 90s-esque 256 color pallets—a failing which actually adds to their charm in many respects (although there are [clever workarounds](https://notes.tweakblogs.net/blog/8712/high-color-gif-images.html)). Directly storing some 16,777,216 colors in a single gif therefore requires  stretching the limits of practicality. Be forewarned that these gifs are too awesome for some browsers, which simply cannot handle this much color.


# rainbow-array.gif

{% include image.html file="array.png" %}


First up, *rainbow-array.gif* ([view](https://mattbierner.github.io/allthecolors.gif/rainbow-array), [file](https://dl.dropboxusercontent.com/s/skuaud9x4ss447m/rainbow-array.gif?dl=0)). Each frame of this gif is 16 by 16 pixels, allowing 256 unique colors per frame. To hit all 16,777,216 colors,  the animation contains 65535 frames, each lasting 4 hundredths of a second (25fps) for a total run time of around 44 minutes. This is orders of magnitude faster than the 160 odd years will @wholerainbow require to achieve a similar feat. 

The colors increase by counting from `0x000000` to `0xffffff`, working left to right in each frame. File size is abut 70MB.


# rainbow-stack.gif
{% include image.html file="stack.png" %}

*rainbow-stack.gif* ([view](https://mattbierner.github.io/allthecolors.gif/rainbow-stack), [file](https://dl.dropboxusercontent.com/s/96nypblxn2kh4ak/rainbow-stack.gif?dl=0)) is another take on the problem. 

In this gif, each frame is 2 by 1 pixels, with two colors per frame. Why two colors instead of one? Well, the minimum size of a gif local color table is two, so using only one color per frame would be downright wasteful.

The entire gif has 8,388,608 frames, each lasting 4 hundredths of a second (25fps). The animation lasts around 93 hours and is best viewed in a single sitting. Colors on the left side count up `0x000000` to `0x800000`, while the colors on the right side count down from `0xffffff` to `0x800000`. The resulting gif is abut 250MB.


# rainbow-stack-walk.gif
{% include image.html file="stack-walk.png" %}

*rainbow-stack-walk.gif* ([view](https://mattbierner.github.io/allthecolors.gif/rainbow-stack-walk), [file](https://dl.dropboxusercontent.com/s/hbk7dats08f7mfb/rainbow-stack-walk.gif?dl=0)) has the same basic layout as *rainbow-stack.gif*, but treats RGB space as a cube and uses a space filling Hilbert curve to choose which colors to go to. The two colors start at either end of the curve and work inwards towards each other. This eliminates the jarring transitions seen in the other methods.


# rainbow-stack-max.gif

*rainbow-stack-max.gif* ([view](https://mattbierner.github.io/allthecolors.gif/rainbow-stack-max), [file](https://dl.dropboxusercontent.com/s/ddlgp4ia0lji06s/rainbow-stack-max.gif?dl=0)) shares the format of *rainbow-stack.gif*, but is optimized to take as long as possible.

Gifs store animation frame delay in hundredths of a second using two bytes, giving a max delay of around 650 seconds. With 8,388,608 frames, this gives the animation a total run time of around 172 years. Even showing two colors at a time, this is still slower than @wholerainbow's 160 year run time, but not quite the [world's longest gif](http://nextshark.com/juha-van-ingen-janne-sarkela-longest-gif/).

As a followup, it would be interesting to create a 2 pixel image with every combination of 2 colors, giving 140,737,463,189,505 frames. With a maximum, 650 second delay between frames, the entire animation would last some 2.9 billion years. I'm not entirely sure the gif format can handle this though and the resulting file would be literally 4 petabytes...



[24-color]: https://en.wikipedia.org/wiki/Color_depth#True_color_.2824-bit.29
[wholerainbow]: https://twitter.com/wholerainbow