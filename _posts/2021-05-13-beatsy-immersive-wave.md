---
layout: post
title: "Beatsy Immersive Wave visualizer"
description: A new immersive 3D music visualizer for Beatsy
series: arr
titleImage:
    file: 'title.gif'
titleVideo:
    file: 'title.mp4'
---

What if the world could dance along to your music? That's always been the core idea behind [Beatsy][beatsy], and today I'm excited to share the new Immersive Wave visualizer which brings this vision one big step closer to being realized.

**Links**
- [Get Beatsy for iOS][beatsy]
- [Support and documentation][docs]

The Immersive Wave visualizer sends three dimensional waves rippling through the world in response to music or microphone input. Here's a video of the new visualizer in action:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/b5v0QhDxL78" description="Demo sample music from [Dana Jean Phoenix](http://danajphoenix.com)" %}

Notice how the distortion radiates outwards in three dimensional space. It smoothly flows over complex surfaces and makes it look as if the sound is distorting the world. You can really see this in the video below, which shows the waves flowing over the concrete shapes of a brutalist fountain:

{% include video.html file="distort.mp4" poster="distort-poster.png" attrs="loop controls muted" %}

In addition to placing the visualizer in the world, you can also have the effect follow you as you move around. This makes it feel as if the distorting sound waves are emanating from where ever you are currently standing:

{% include video.html file="walk.mp4" poster="walk-poster.png" attrs="loop controls muted" %}

It's amazing to walk through the city and watch it warp around you in response to your music.

The Immersive Wave visualizer is the first in what I hope will be a series of visualizers exploring these more immersive effects. It does require a device with a LiDAR sensor but hopefully those should start spreading across the rest of the iPhone line at some point. Also all of the other Beatsy visualizers continue to run great on the now almost five year old iPhones 6s.

Beatsy is available for free [in the App Store][beatsy]. If you enjoy the app, be sure to share it with your friends and leave a review.

Looking forward to seeing what you create using this new immersive effect!

[beatsy]: https://apps.apple.com/us/app/beatsy/id1543162330
[docs]: https://github.com/mattbierner/beatsy-support

