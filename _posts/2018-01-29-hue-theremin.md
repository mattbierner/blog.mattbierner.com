---
layout: post
title: Hue Theremin
description: Using a theremin to control Hue led lightbulbs 
titleImage:
    file: 'title.gif'
date: '2018-01-29'
---

{% include youtube.html width="720" height="405" src="https://www.youtube.com/embed/qJyJR4q5OQc" %}

Small project using a theremin to control the color and brightness of Philip's Hue led lightbulbs. See above video.

# Implementation

**Hardware**

- [Moog Theremini](https://www.moogmusic.com/node/92916)
- [Hue lightbulbs + hub](https://www2.meethue.com/en-us)
- Computer

The Theremini outputs two streams of midi messages, one for volume and one for pitch. A [simple node app][src] running on the computer translates these messages into color values and then updates the lights using the Hue rest API.

The Hue rest API seems to be limited to around 10 updates per second, which currently limits how many lights you can control in realtime.

# Next Steps
Controlling light and color lets you create artificial synesthesias, exploring relationships between physical position, sound, and visuals. This same basic setup could also be used to build much more creative color mappings, perhaps altering the colors based on relative change instead of absolute position or even varying the mapping in accordance with a larger musical piece like at a EDM concert. And with multiple lights, you can create even more dynamic experiences.

And controlling lights is only one example application. Midi means that you can very easily hookup just about anything in order to create new interactive experiences and, even when you turn off the sound, theremins are just a cool interface. The possibilities are endless.

Checkout the [source code][src] to get started. Let me know if you have any fun project ideas or thereminize anything awesome.
 
*(PS: If you are a professional theremin player and are interested in helping out with a secret project, please [contact me](/about). I promise it will be strange)*

[src]: https://github.com/mattbierner/hue-theremin