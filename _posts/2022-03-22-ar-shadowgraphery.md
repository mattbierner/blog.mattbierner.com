---
layout: post
title: "Augmented Reality Shadowgraphery"
description: "A demo of augmented reality shadowgraphery"
series: arr
titleImage:
    file: 'title.gif'
titleVideo:
    file: 'title.mp4'
---

I remember making shadow figures on the walls and ceiling with my hands when I was younger. Even though I never progressed much beyond dopey looking dogs or misshapen lumps with rabbit ears, it was captivating to watch these creatures emerge and evolve as I subtly shifted around my hands in front of the light.

I guess you're supposed to outgrow such childish things. Hand shadows seems so quaint compared to the vast universe of entertainment now available at my fingertips. Yet even today, when a light is positioned just right and I see a nice shadow go flickinging across the wall, I'll be damned if I don't throw up a lumpy wolf and a blobby bunny or two. And you know what? It's still cool!

But what if you could create those shadow animals anywhere? What if you didn't need a light or just the right surface? And what if those shadow creatures could go on living long after you'd put your hands down?

This is what inspired my latest augmented reality prototype. It's an iOS app that uses augmented reality to let you record shadows on any surface using only your hands (or other parts of your body). You really have to see it in action though to understand why it is compelling.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/b7IJLvo0Dq8" %}

On the technical front, the main thing to understand is that this effect isn't some simple filter. Instead the shadows are projected onto the real world using depth information captured by the device's LiDAR sensor. This means that the shadows remain fixed in space even as you move about the world, sort of like they've been baked into the scene itself. <!-- If you'd like to take a hard turn towards the dark side here, the effect is also reminiscent of the 'Human Shadow Etched in Stone' -->

The result is magical. Capture a selfie and step away, and your shadow remains fixed in space. Stick out your hand and you can record small [shadowgraphic](https://en.wikipedia.org/wiki/Shadowgraphy_(performing_art)) performances on any surface around town. The app can even capture multiple looping shadow animations and re-project them into the same scene, letting you compose silly little shadow plays.

{% include video.html file="scene.mp4" poster="scene-poster.jpg" attrs="controls" description="My shadowgraphery skills are a bit lacking..." %}

If you can't tell, I'm excited. It's great when a project comes together so nicely. But as always, a nagging thought: There's a lot of flashy stuff happening in the AR/VR space right now and sometimes I wonder if there's even space for little projects like this. Why should anyone get all worked up about what is essentially using a very high-tech flashlight to casting shadowy dog shapes with your hands? It's like a baby's toy.

Or maybe that's not such a bad thing.

In many ways, this little prototype embodies what I love about augmented reality and values at the heart of [Rare Realities](https://rarerealities.com/). AR should be magical. It should let you play with and delight in the world around you. It should be open ended and invite creative exploration on your terms. And if the skilled shadowgraphers of old could bring to life creatures, people, and entires fantasies using just their hands, a candle, and perhaps a few bits of scrap, imagine what they could create using something like this? Imagine what *you* could create?

{% include video.html file="title.mp4" poster="title-poster.jpg" attrs="loop controls" %}

But now that I've gotten you all excited, I have to disappoint: the app is just a prototype. Not in the sense that it's not real. No the app works and even works rather well at that, it's just that it needs a lot of polish before it could ship. The biggest roadblock is the App Store's requirement that iOS apps run across the entire range of iOS hardware. If it were up to me, I would restrict this app to devices with a LiDAR sensor because the app was built for them.

Let me know how you'd use these AR shadows though. If there's enough interest, I'll see what I can do <!-- Admission: while I often say this, barring true virality, the only factor that determines if I ship something is if I feel like it. Not that I don't appreciate positive feedback, I don't think it's healthy to use it to guide what you make -->

And on a final note, I'd very much like to use this technology to make a music video for [Beatsy](https://rarerealities.com/beatsy/). If you can bring the musical talent and production capabilities, [get in touch](/about).
