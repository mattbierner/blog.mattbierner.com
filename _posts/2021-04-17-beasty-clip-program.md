---
layout: post
title: "The Beatsy app clip program for augmented aural excellence"
description: Calling all musicians
series: arr
---

Calling all musicians! [Beatsy][beatsy] App Clip codes are now available to everyone. This makes it easy to create unique augmented reality effects that respond to your music, and share them in the real world using scannable codes.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/5iWi_Kd7rfw" description="An app clip code in action" %}

**Links**
- [Beatsy app clip code guide][guide]
- [Contact me about creating a code][contact]
- [Beatsy][beatsy]

App clip codes link a physical code to little app experiences. The neat thing is they don't require downloading an app ahead of time: all a user needs to do is scan a code with their iPhone. This launches Beatsy and starts playing a linked song, with augmented reality distortion applied around the physical location of the code itself.

The [Beatsy app clip guide][guide] has many more details about how app clips code work and what you can use them for.

## What you can create

Beatsy app clip codes let you create any of the visualizer effects found [in the full app][beatsy]. Tweak the speaker, wave, or ferro visualizers to match your song.

You can also control the size of the visualizer effect. A sticker may use a small visualizer that is 0.25m across, while an effect placed on a large wall could scale the AR distortion up to fill the entire surface!

In addition to Beatsy's built-in visualizers, you can also create fully customize effects with a displacement video. This uses a [displacement map](https://en.wikipedia.org/wiki/Displacement_mapping) to distort the surface, enabling arbitrary visual effects.

Each pixel in the displacement video specifies how far that part of the surface will be shifted upwards by the AR effect. Parts of the plane under black pixels will have zero displacement, while parts under white pixels will be displaced to the maximum visualizer height. Grey pixels will have intermediate levels of displacement.

Here's a quick demo of what a displacement video looks like and the effect it creates:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/J3X7MX8xeNk" %}

You can create these videos by hand or using a 3D rendering program. The video automatically loops too, just like [Spotify's Canvas](https://artists.spotify.com/help/article/adding-a-canvas), so you don't have to create song length content.

## Get in touch

If linking your music to physical codes that trigger unique augmented reality effects sound interesting, please [get in touch][contact]. These codes are free to create and you can use them however you'd like: sell them as stickers or cards (or even temporary tattoos) as a fun way to physically distribute music; plaster them around town to hype an upcoming event or release; or design a unique audio and visual experience for a specific physical location. It's up to you.

The [Beatsy app clip guide][guide] has more details on what you can create and how to get started. Don't hesitate to [reach out][contact] too if you are interested in creating a code or have any questions about getting started.


[guide]: https://github.com/mattbierner/beatsy-app-clip-codes#beatsy-app-clip-codes
[contact]: /about
[beatsy]: https://apps.apple.com/us/app/beatsy/id1543162330