---
layout: post
title: "Reality Shaders"
description: 'Example project about apply shaders to real world surfaces using ARKit'
series: modded-reality
titleImage:
    file: 'demo.gif'
---

For the past month or so, I've been working on an iOS AR app that lets you push your face out from behind real world walls as if they were made of a stretchy material. A video is probably worth a thousand words here:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/JX80kxolWEc" %}

> **Update**: [Here's the app][walls] from the video

When I shared a preview of this app in action, a few developers were curious about how I achieved the effect. So I've put together a [small example project][source] I'm calling "Reality Shaders" which demonstrates how I distort real world surfaces in AR using shaders.

**Links**:

- [Source][source]
- [In The Walls][walls] (app from the video)

The project includes a couple of simple demos:

- Using a vertex shader to distort the geometry of real world surfaces. 
- Using a fragment shader to distort the texture sampling of a real world surface.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/BzwldX_Jz50" %}

Here's the basic idea: place an AR plane in the world. Texture it using the real world image data at that position. Without further effects, this means that the virtual plane should blend in perfectly with the rest of the scene. We can then apply a shader to the plane to distort or transform the real world surface in interesting ways. This shader is not just a simple view overlay but is applied in world space, which means that its position is stable as you move about.

A more advanced take on this idea might instead texture a 3D model using a the real-world surface—imagine a wall folding open to reveal a hidden scene. Again this would not be simply adding a virtual door onto a wall, but actually having the wall itself crack open like a hidden door. There's plenty of other potential too, such as [hiding real world objects](https://augmented.reality.news/news/q-a-with-jay-samit-future-ar-could-be-world-times-square-acid-0178972/) (perhaps after having digitized them so that they can be transformed and moved around virtually).

While the technique isn't novel and does have some technical limitations, I think AR that modifies the real world instead of merely adding virtual object overlays is under-explored. If nothing else, this approach can be to make overlay-style AR scenes just a little bit more convincing (think the virtual door example above). For my part though, I'm more interested in making my walls dance along to the music or pushing my face out from the walls Friday the 13th style.

So checkout [the example][source] and let me know if you come up with any fun applications for reality shaders.

[source]: https://github.com/mattbierner/reality-shaders-example
[walls]: /in-the-walls