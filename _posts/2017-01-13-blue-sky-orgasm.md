---
layout: post
title: "The Orgasmic Power of a Clear Blue Sky"
date: '2017-01-13'
description: "Using color vision to control a vibrator"
series: modded_reality
titleImage:
    file: "overview1.jpg"
---

{% include image.html file="overview1.jpg" description="Pantone is my pornography" %}

Well it's come to this. 2017 is upon us and to ring in the new year, I decided that it was high time to end my eye's monopoly on the visible light spectrum. No, time to let the other senses have a go at color. Why not taste color? Or smell color? Why can't I *feel* color?

Feeling color... that seemed like a good start. So I set out to convert the visible light spectrum into sensations of touch. But, as often happens, one thing quickly led to another—with feeling leading to touch, which led to haptics, which led to vibrations, which led to vibrators, and so on and so forth—and, before I knew it, I found myself with a butt plug that vibrates based on the colors that I looked at. And while not the most practical means of seeing the world—or even really all that stimulating sexually—the experience was something, and I think it suggests some interesting possibilities for the year and years ahead.

# Stimulation
So why a butt plug? Purely a matter of necessity my dear friend.

My goal was to somehow map the colors you see to sexual stimulation. I didn't care how this stimulation was delivered, but I wanted it to be entirely automated. This experiment wasn't about masturbation, nor was it about altering or augmenting traditional sexual experiences; the underlying intent was to explore remixing your senses, allowing you to relate to the world in profound new ways (in this case, such profundity just happens to involve your butt).

Hacking one's sensory experience of the world is the core idea behind what I've most pretentiously termed [*modded reality*][mr]. Although much of my previous work in the space has focused on altering vision—making it similar to augmented reality in many ways—the concept of *modded reality* is far broader, and mapping color to sexual stimulation is just an initial exploration of these greater possibilities.

This new era of *modded reality* began with a survey of programmable sex toy offerings. The automation requirement helped narrow down the field considerably, eliminating any toys that require mechanical user action for stimulation. This mostly left toys of the vibrator variety.

I then focused on small, wearable style vibrators that can be controlled using custom software. It was important that the end product here not be confined to the bedroom—rather that it leave you free to roam about and take in the world—which eliminated toys that must be held in place, or would result in rather questionable looking protrusions or bulges if worn under your clothing. Still, there is a surprisingly large selection of toys that meet all the requirements listed thus far.

But alas! cursed with a male anatomy, none seemed designed for me. And although sharing is caring, being one selfish motherfucker, I wanted to experience the rainbow too. So I started my search again, this time looking specifically for a male sex toy that met the same requirements. This was not nearly as easy. Few male sex toys seem to offer fully automated stimulation and, of those, most are like *Amazon Echo* sized. That left some sort of anal vibrator as the best option.

As for programmability, while sex toys have become considerably more high-tech in recent years, I had trouble finding any that offer some kind of public library or API to control them. Such digital chastity is a truly dastardly bit of hypocrisy given that these toys are often ostensibly promoted as libertine. I did hear some good things about the toys from [*Lovense*][lovense] though. While the company does not offer a public API, I found [some libraries for controlling them][metafetish]. So I ordered a bluetooth vibrating butt plug from *Lovense* called the *Hush*, while also picking a *Lush*, a female wearable-style vibrator that fits inside the vagina.

{% include image.html file="toys.jpg" %}

The Metafetish control libraries did not yet support the *Hush*, which uses BLE, so I set out to write my own simple library for iOS. [You can find the result here][control-lib]. The library is written in Objective-C and has been used successfully with both a *Hush* and a *Lush*. I actually found it a little concerning just how easy it was to connect to and control the toys. Like, I know Bluetooth has limited range and all, but shouldn't there be some sort of security or something here? A dastardly new era of bluejacking seems at hand.

Both the *Lush* and *Hush* offer twenty levels of vibration strength, which sounds like a lot, until you try to encode something as varied and nuanced as color using those scant twenty levels. As for translating your vision entirely to vibrations? forget about it, although that certainly didn't stop me from trying. But more on those misadventures anon.

# Vision
Back on higher ground, we now turn to the visual system. And to start with, why use color to control things?

I've always been more than a little enamored with color—from the infinite subtile and varied pallets of the natural world, to the clinical studies of color and perception of Josef Albers. And who but a true color nut could have created [Blot're](https://blot.re): the premier color network for today's millennial and their toaster? So in some respects, it was but a short hop from being a conceptual lover of colors to a more physical one. Just the thought of being able to stare into a clear blue sky—a sight whose beauty is surpassed only by the [finest slabs of concrete][concrete]—to look into the sky and feel the majesty of its blueness coursing through my loins... well, that just seemed too good to pass up.

And while it's quite true that an experiment like this would work great using any number of other visual channels—from infrared, to depth perception, to facial or object recognition—perhaps another time. No, color had to be my first.

There are many ways to reduce your vision to a single color or small collection of colors: from simple (such as averaging), to more complex (such as posterization). Because of the limited subtlety offered by the vibrators, I chose to collect color using a gun type sampler that takes a single color from the center of your vision. This keeps the data stream small and its behavior well defined.

The specific hardware and software setup used should be familiar to readers of [my previous experiments in modded reality][mr], so I'll skip over some of the details. A forward facing camera mounted on a VR headset acts as both the color sampler and as your eyes onto the world, while also overlaying a few UI elements onto your vision. Having your vision mediated by a computer isn't perfect—not least because the cameras I'm using have pretty poor color accuracy and cannot capture the subtleties and dynamic range that your eyes can—but seeing the world through these cameras ensures that your eyes have the exact same visual data as the computer that is controlling the vibrator.

Here's a quick overview of the complete sensory pipeline:

1. An iPhone is used inside of a Google Cardboard headset.
1. A simple app on the iPhone connects to the vibrator over bluetooth using [the library I mentioned][control-lib]. 
1. The app loads a webview with the viewer content. This viewer is just a webpage. It acts as your window to the world.
1. The app sets up a Javascript bridge to allow communications between the JavaScript of the webview and the native application. The bridge is used to control the vibrator from JavaScript.
1. The viewer loads a mjpeg video stream for your eyesight from the Raspberry Pi over LAN. This mjpeg video stream comes from a webcam strapped to the front of the Cardboard, and connected to the Pi over usb. [mjpeg-streamer][mjpeg-streamer] is used to create the stream.
1. The viewer Javascript code loads each frame of the mjpeg stream into a html canvas so that it can access the raw pixel data.
1. For each frame, the Javascript samples the center pixels of the video to determine the primary color. This primary color is mapped to vibration strength.
1. The Javascript sends an "update vibration" command to the native application over the JavaScript bridge.
1. The native app receives the message and sends an update to the vibrator over bluetooth.
1. The toy receives the signal and updates its vibration strength, informing the native app when the update succeeds.
1. The vibrations of the toy are picked up by your innards and transmitted to your brain.
1. Your brain receives the signal.
1. Something happens.
<!-- 1. Toast comes out -->

Those last few steps need further debugging. You can find the source code for both the app and viewer [here][src].

Despite the pipeline's kludginess, it works. Latency from the camera to your eyes is around 80ms, with the vibrator lagging another 50ms or so behind that. This delay is not too noticeable in practice.

{% include image.html file="setup.jpg" %}

One last note regarding documentation before diving into a discussion of the experience: even more so than any of my previous modded reality experiments, the experience here is really not something that can be captured on film or video, even if you have no qualms about sexually explicit content. For one, the vibrator is mostly inside the body, so only indirect representations are really possible.

One approach would have been to resort to the hyper-exaggerated moanings and writhings commonly found in pornography, but, besides the fakery, that's still just an indirect measure of the experience. It's also an entirely subjective one.

Instead, I turned to [an old friend][mouth]: jello (my inner *Mythbuster* would have much preferred ballistic gelatin, but jello is much cheaper and more readily available). To show the vibrations, I molded a *Hush* inside a cylinder of firm, cherry jello.

{% include image.html file="jello.jpg" %}

The result is a *Pop Art* masterpiece no doubt, but it does not work nearly as well as I hoped. Even with the vibrator buzzing along full tilt, the jello jiggling is just not that pronounced. Still, this jello mold is what you see in the first demonstration video.

For the second demo, I suspended the tip of the *Hush* in a dish of water. This captures the vibrations a little better, but is still not ideal. Although neither video is a particularly good representation, hopefully they provide at least some idea of what is going on. You'll just have to take my word for the rest.


# Experiment One
{% include image.html file="overview2.jpg" %}

My first experiment used hue to control vibration strength. The idea here was to roughly map the [wavelengths of visible light](https://en.wikipedia.org/wiki/Visible_spectrum) to vibration, with the shorter wavelength blues and violets mapping to stronger vibrations and the lower energy oranges and reds mapping to weaker vibrations.

[HSV](https://en.wikipedia.org/wiki/HSL_and_HSV) made the basic mapping simple. I opted to discard colors that were too near white or black since, with those, even imperceptible changes in the sampled color can drastically change the hue. A direct mapping works well enough for everything between red and blue on the color wheel (0 - 240°), but breaks down for [non-spectral colors](https://en.wikipedia.org/wiki/Spectral_color) such as purple and magenta. For those, I decided to wrap everything after violet (280°) back around, giving a smooth transition between 359 and 0°. Here's the basic algorithm:

```js
const maxHue = 280
const minSaturation = 0.2
const minValue = 0.2

function getVibrationStrength(rgb) {
    const hsv = rgbToHsv(rgb);

    // Discard colors that are too dark or too light
    if (hsv.s < minSaturation || hsv.v < minValue) {
        return 0
    }

    // map red - blue to standard range, but wrap magenta back around
    let frequency = hsv.h
    if (frequency > maxHue) {
        frequency = maxHue - ((frequency - maxHue) / (360 - maxHue)) * maxHue
    }

    return Math.floor((frequency / maxHue) * 19) + 1;
}
```

Enough code. Time to feel the rainbow.

Now, I'm a boring person, and so it is with the greatest of shamefacedness that I must admit that—before this humble experiment—I was a vibrating butt plug virgin (good 80s Punk band name BTW). So as the day dawned on a fresh new year, and I suited up for the first time, I wasn't at all sure what to except. What would this bold new form of synesthesia be like? What would the colors feel like? Would it be stimulating? Maybe too stimulating?

I started over by my workbench, which is also where I stumbled upon my first acquaintance: the vibrant red handle of some needled nosed pliers. As I shifted the color sampling reticle onto this first lover, some low strength vibrations kicked in. "Well... this is certainly strange," thought I, as my innards rumbled away. Depending on the lighting, the vibration strength of the red handle ranged between level one and three. And, I have to say, this first go was actually pretty disappointing. I'm not entirely sure what I was imagining it would be like, but the experience wasn't really stimulating at all, more like having a pager up your butt or something.

Growing more adventurous, and tiring of the prudish reds, I panned over the rest of the workbench. A brief fling with a green cutting mat kicked things up to level eight or so, while a more protracted affair with a blue screwdriver case shot things up to level fifteen. Playing the floozy, I also experimented with rapidly shifting my attention from color to color.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/dypfEtxlELc" description="" %}

While the vibrations were quite pronounced, none of it was really arousing. The device certainly wasn't not-stimulating, but I hardly found it stimulating either. And even after further experimentation, adjustments, and prolonged wear, this unfortunately remained the case. I just don't think the *Hush* was designed for this sort of application. It's not a prostate massager or anything of that nature, leading me to believe that it's primary use case is enhancing more traditional sexual activity. So, despite the aspirational title of this experiment, I personally found it quite impossible to reach orgasm using this device alone.

The device isn't without appeal however. Using it as I did, the *Hush* really becomes less of a sex toy and more like having a controllable phone vibrator in your nether regions. This opens up some interesting possibilities for everything from notifications, to gaming, to augmenting your senses.

Flipping through a set of Pantone swatches was especially rewarding. The vibrations waxed and waned as I worked my way over the colorscape, getting to know the colors in a whole new dimension and discovering hidden gems lurking among the pages. It was also fun to play designer and create swatch collections that invoke different responses. If this device were just a little more stimulating, the Pantone color guide could easily become a definitive work of conceptualist pornography (because really, what is not visual pornography but an artful arrangement of colors?)

You may notice that I've only mentioned objects thus far, which at first blush seems strange given that we are discussing sexuality. There's a good reason for this actually: clothing aside, humans are just plain boring; most are hardly colorful. Using the simple hue-to-strength mapping, color samples from lighter skin end up with low saturation and are therefore ignored, and the same goes for most hair colors. A different mapping algorithm—or even better, some hair dye and colorful tattoos—may be called for here.

In summary, although my relationships with various colors were hardly impassioned affairs, I do feel the experience gave me a new way of relating to the world. In a way, it is like some new sense, and it was surprising just how quickly my body grew used to this. I quickly found myself anticipating what the various colors around me would feel like, and I also began to notice colors about me that I had overlooked countless times before.

# Further Work
Now a quick survey of a few sub-experiments, before we finish with a project that I had once jokingly dismissed as being far too absurd.

Blessed with a rare series of clear days here in wintertime Seattle, I took the opportunity to explore relationships with various atmospheric phenomena.

The color gradations offered by sunrise and sunset are particularly nice, especially with a smattering of clouds to spread the vibrant colors of light throughout the sky.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/V9zHkmGQezA" description="With 999 more suns maybe we'd have something here..." %}

These relationships were not without their frustrations however. Photographing the sunrise or sunset is hard enough with a proper camera, and the fisheye webcams I'm using do a downright terrible job of capturing dynamic range. Most of the time, the visuals were pretty washed out, with the sky's measured saturation being too low to even trigger the vibrator. As someone who truly does find the colors of the sky beautiful, it was sad to see them being butchered so.

<hr class="stars">

A few additional color-to-vibration mappings were also explored.

Luminosity is one interesting one. For this, I used what amounts to a black and white view of the world, with black providing the weakest vibrations and white the strongest. Because no samples were discarded, the changes in vibration strength as you pan about the world are smooth.

I also tried triggering the vibrator for a single color, perhaps only going for specific shades of blue for example. This encourages wandering about on what amounts to a color scavenger hunt, seeking out and examining colors to find those that move you.

<hr class="stars">

Disappointed with the performance of the initial experiment in terms of arousal, I also connected a *Lush*, a female wearable vibrator, to the headset. A friend more anatomically equipped for such matters helped with the testing here, while also being able to compare and contrast this new experience with that of the *Hush*. Allow me to briefly summarize the findings secondhand.

Of the *Lush*, their conclusion was somewhat more positive, although hardly a ringing endorsement. Besides easier insertion, the vibrator offered at least a modicum of sexual stimulation, depending on positioning and vibration strength. More than just targeting a different area of the body, the vibrations also feel different. With the *Hush*, the vibrations are felt more throughout the body, while the *Lush* is not as strong in a sense, but feels more localized. Both are hardly comparable to wand type vibrators however, and my partner also found actually reaching orgasm using either device alone to be impossible.

A brief attempt was also made at sensory telepathy, with one person wearing the headset and the other wearing a vibrator. This turned out to be pretty lame, as the vibrations may as well be coming at random for all the receiver can tell. Hooking up two Cardboard units so that the receiver can see what the transmitter does only makes this worse, by adding a heaping serving of disorientation and nausea. Sight seems like a poor fit for this application.

All in all, while I think the *Lush* probably is the better device for this experiment, neither toy proved ideal. Both are wearable and programmable, giving them many potential uses, but neither is very stimulating sexually on its own. More research is required to find a toy that is both wearable and programmable and that can truly unlock the orgasmic power of a clear blue sky.


# A Triumphant Return to Naked Lunch
{% include image.html file="everything-that-has-a-beginning-has-an-end.jpg" description="You know how in *The Matrix Revolutions* Neo was able to see despite being blinded? Well I think I know how he was doing it..." %}

And now, let us return to an idea that I once dismissed as ["literally the worse idea ever"][hands]: seeing the world through one's ass, [as inspired by *Naked Lunch*](http://realitystudio.org/texts/naked-lunch/talking-asshole/). But perhaps that first judgement was a tad too hasty. And while literally seeing the world as an ass may very well have been the worst idea in the world in those heady days of yore, in light of recent events, I very much doubt that such an idea would even make a top ten list today. No, if 2016 can teach us anything, it's that what yesterday was the absurdist of comedies, can today be reality. Lesson well learned. So here in 2017, instead of dismissing any idea out of hand—no matter how terrible it may appear at first glance—let us instead draw inspiration from our dear Mr. President, who as a celebrated limboer once boldly declared: "although this bar is far too low today, soon I shall return and clear it with ease."

Which is all a lot of words to say: my next experiment had me not just trying to see the world through my ass, but quite literally attempting to use my asshole as my eye unto the world. (Say, what's that long, thin rectangular shape way up there in the sky?)

The idea here was to get rid of my eyes altogether, and instead rely solely on the vibrator to navigate about the world. And while certainly interesting, in practice, I found that a bit more research is needed.

My initial attempts at Naked Lunching it up kept the camera mounted on my head but blacked out the viewer screen. I later dispensed with the headset altogether and just used a blindfold, mounting the camera on my chest initially, and then on my backside because of course. Color sampling worked as before, but now I could no longer see what I was looking at.

This new reality proved problematic.

To start with, since the camera only samples a single color, it was nigh impossible to navigate the world without just feeling my way about. I previously had some trouble dealing with the [mouth camera's][mouth] narrow field of view, but the setup here is completely unusable. It is literally like trying to see the world with a single pixel.

And really, I think the technical idea behind this experiment was flawed from the start (one could also argue that the technical problems here really are rather insignificant in the broader formulation of an experiment like this). Think of how much information your visual system takes in, and then consider the challenges of rectally encoding even just a small fraction of that data. Encoding vision to vibrations would be hard if the sensory target were your hands or fingers, let alone your anus.

It was clear that the dream was hopeless, yet I did try a few approaches at encoding some additional information into the vibrations. Using time and the shape of changes in vibration allowed me to encode more data. This was promising.

In one simple experiment, I encoded a more complete representation of colors by translating the hue (wavelength) to a periodic square wave pattern—with blues producing rapid on/off cycling and reds slower cycling—and the saturation of the color to vibration strength.

```js
const maxHue = 280
const minS = 0.2
const minV = 0.15

function colorToWavelength(rgb) {
    const hsv = rgbToHsv(rgb)

    // take combined saturation & value as vibration strength
    let strength
    if (hsv.v < minV || hsv.s < minS) {
        strength = 0
    } else {
        strength = (hsv.s - minS) / (1.0 - minS) / 2.0 + (hsv.v - minV) / (1.0 - minV) / 2.0
    }
    
    let period = hsv.h
    if (period > maxHue) {
        period = maxHue - ((frequency - maxHue) / (360 - maxHue)) * maxHue
    }

    return {
        period: (period / maxHue) * 3,
        strength: Math.max(Math.floor(strength * 20), 1)
    }
}
```

This is interesting, but required that I focus on the same color for a second or two to truly comprehend it. And it still does not solve the field of view issue. Color probably wasn't even a good choice here, since it can be dispensed with without too much impact. Depth would have been far more helpful.

The many failings on display here demonstrates that, for right now, a device like this is best at simple sensory augmentation or remixing, not full blown sensory replacement. And despite the somewhat jocular tone taken with the subject, there are actually many [practical applications](https://www.washingtonpost.com/news/speaking-of-science/wp/2015/02/04/this-35-wristband-helps-the-blind-use-bat-like-echolocation/?utm_term=.d89724f94d0c) for turning visual data into haptic feedback.


# Thoughts
This experiment is really of more conceptual, rather than practical, interest. Put together a version of this device that is actually somewhat stimulating, and hook it up to some more advanced software, and you could easily create all sorts of bizarre new realities.

Most directly, a device like this could be used to design and experience various forms of erotic fetishism. Perhaps machine learning could be applied to your vision to analyze the clouds in the sky, and stimulate you based on some set of ideal cloud characteristics. Of course this would only cover the physical aspects of arousal and attraction, which is not unimportant, but also certainly not the whole story. And such a concept is also not without danger, especially if the technology were used for truly sadistic purposes.

One other obvious application is synesthetic sensory remixing and reworking, as was somewhat demonstrated by this experiment. Imagine being able to map sight, smell, taste, sound, or even touch to sexual stimulation (*truly* bizarre, I know :), but in a much more abstract way. Most current smart sex toys seem to be trying to recreate sex, just using technology. That's fine, and I have no doubt there's lots of money to be made there, but software patents have made me extremely skeptical of any new technology where the main innovation is "doing it with a computer." Rather, I find it interesting to use technology to create experiences free from sensory skeuomorphism, experiences that would otherwise be impossible, experiences of a new reality. 

Even this experiment is not without appeal. It's certainly one thing to love color and quite another to *love color*, even if that love was not as physical as I hoped. Using this device did make me relate to the world differently. It changed my sensory experience of reality. And if devices like this allow you to experience the orgasmic power of a clear blue sky, or get intimate with a rainbow, or have a sunrise turn you on, then by god let's head straight on till morn. The future lies ahead and it's going to be far stranger—and far more amazing—than can ever be imagined.


[src]: https://github.com/mattbierner/The-Orgasmic-Power-of-a-Clear-Blue-Sky
[control-lib]: https://github.com/mattbierner/lovense-ios-controller
[mjpeg-streamer]: https://github.com/jacksonliam/mjpg-streamer


[metafetish]: https://github.com/metafetish/lovesense-py
[lovense]: https://www.lovense.com/

[mr]: /series/modded_reality
[hands]: /tenome
[mouth]: /mouth-cam/
[concrete]: /21mm-rokkor/