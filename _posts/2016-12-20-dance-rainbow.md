---
layout: post
title: "I'm Only Dancing So That I Can See the Rainbow"
date: '2016-12-20'
description: "Using the power of dance to modify my vision"
series: modded_reality
titleImage:
    file: "blur1.jpg"
---

{% include image.html file="blur1.jpg" %}

*I'm Only Dancing So That I Can See the Rainbow* is an experiment using dancing to alter my vision. With fairly simple hardware and software, I explored three experiences based on this premise: using each of my limbs to control the strength of individual colors in the world, applying fun visual shaders that amplified as I danced more, and controlling the playback of music along with my vision. Let's take a look.

# Dance Suit
This experiment builds on the same hardware and software platform that I've used for [my previous modded reality experiments][mr], with a pair of fisheye cameras connected to a Raspberry Pi to stream realtime mjpeg video to an iPhone in a [Google Cardboard](https://vr.google.com/cardboard/) headset.

The most interesting new bit of hardware is undoubtedly the dance suit. It's nothing fancy really. Body movement data is collected using [Lilypad analog accelerometers][lilypad] attached to the wrists and ankles. The accelerometers are fastened in place by straps, and each accelerometer is connected to the Raspberry Pi by five wires: power, ground, and wires for the analog x, y, and z signals. 

{% include image.html file="sensors.jpg" description="I freely admit that most of the hardware I put together would not be out of place in a fifth grade science fair" %}

The analog signals from the four accelerometers are fed through a pair of [MCP3008 analog-to-digital converters](mcp3008) connected to the Pi using [hardware SPI](https://www.raspberrypi.org/documentation/hardware/raspberrypi/spi/README.md#hardware). This converts the signal for each axis (x, y, z) to a binary value between 0 and 1023, with an ideal at rest signal of around 512. All this is hooked up on a breadboard strapped to the Pi, with the whole mess worn as a small backpack for portability. All things considered, it's actually not uncomfortable.

{% include image.html file="back-close.jpg" %}

A Python script on the Raspberry Pi samples the sensors sixty times per second, bundling the collected movement data up into json messages broadcast over a websocket. You can find the [complete source code for the sensor here][src].

Ample quantities of tape, conductive thread, and zip ties keep the whole thing together and the resulting device—while, given all the exposed wiring, is perhaps not the best suited for particularly sweaty dance halls—did hold up well enough. You never completely forget that you're wearing it of course, but there's enough slack in the wires to allow a mostly normal range of motion. 

{% include image.html file="arms.jpg" %}

Beyond obvious enhancements such as using wireless sensors – although, quite frankly, playing cyborg dress-up is like 90% of the fun of these experiments, and can you ever *really* have too many wires for that?—the biggest limiting factor of this system is the type of sensor I'm using. Accelerometers only provide information about relative acceleration, not where each limb is positioned or even how it is moving. A sensor package with a gyroscope and magnetometer would be far better at more accurately tracking body movement, but still would not be able to accurately determine where your hands or feet are in relation to your body.  For that, if you don't need a true wearable, I imagine a Kinect or other external camera based capture device would be ideal.

Additionally, this system only collects movement data from four points on the peripheries of the body, which, at best, offers an extremely constrained view of dance. It doesn't directly track your body or hips or head, nor does it capture fine motion of the limbs, hands, and feet. Honestly, calling this system a "dance suit" at all is a pretty big exaggeration but I couldn't think of any better term, so dance suit it is.

{% include image.html file="front.jpg" description="Ready for the rave" %}

{% include image.html file="back.jpg" %}

Yet, despite all these limitations, the hardware was good enough to power the  experiments I was after. Going in, my goal was not to recreate a dance powered version of *Tilt Brush* (although that may be a worthy future endeavor) but to only roughly track movement of each limb independently. The system was definitely constraining, and it meant that I had to somewhat adopt my visualizations to work with the system instead of the other way around, but it also made everything very easy to throw together. And, although I'm biased of course, I feel that you can still create some pretty cool shit.

# Vision

{% include image.html file="back3.jpg" description="I eventually hope to externalize my entire nervous system" %}

The VR headset setup is very similar to that used in my [heartbeat visualization experiment][blood], with a camera mounted to the front of a Google Cardboard headset to emulate normal human vision. I'm using the stereoscopic camera from the [selfie stick experiment][selfie] this time around, which visually provides a slightly more immersive experience to the wearer and also gives you a much less cyclopean, and generally more friendly, outward appearance.

One other noteworthy improvement to the headgear: I finally got around to creating a proper head mount. Up until now, I had been holding the Cardboard in place with a single strap fastened around the back of the head. This strap often proved to be pain to put on correctly and was not stable enough for running or other quick movements (most cheap, non-google versions of Cardboard also use the same single strap setup and therefore suffer from the same problems).

For the improved head mount, I connected two straps to front of the cardboard unit in an X shape, looping them over the top of the head and around the sides to create a loose helmet that can be easily slipped on and off. This takes some of the weight of the cardboard off your nose and face, and allows for much more vigorous head movement.

{% include image.html file="headset.jpg" description="Why the hell didn't I do this back in August?" %}

The software side of the vision pipeline is also similar to my [heartbeat visualization experiment][blood]. The two cameras are connected to the Raspberry Pi, which creates streams using [mjpeg streamer][mjpeg-streamer]. The iPhone accesses these streams over LAN using a simple webpage. Rather than directly displaying the input video streams for each eye however, the live video is processed using WebGL shaders, many of which are dynamically controlled by the motion data received from the accelerometers. You can find the [source for the viewer here][src].

I explored some more advanced shader effects this time around, and also experimented with combining multiple effects to create bizarre new experiences. Altering my vision using these shaders was so much fun, that actually I got temporarily sidetracked doing all sorts of crazy shit to my vision. Even the corniest Photoshop effects and Instagram filters turn out to be surprisingly awesome when applied to your vision. It's definitely an area that I'll be exploring further.


# Dancing with Myself
{% include image.html file="blur6.jpg" %}

With the basic hardware and software in place, my first experiment was a very literal take on "I'm Only Dancing so that I Can See the Rainbow". The basic promise of this initial experiment is perhaps best described as *Pleasantville* with a dash of *Footloose*: the world starts out as a dreary place wholly lacking color, and only by dancing do the colors begin to fade in, bringing the world back to it's normal hues, and then beyond into some technicolor utopia... (whoa, do you think it could be like an allegory or something?)

To make matters a little more interesting, I delegated responsibility for each of the world's primary colors (red, green, blue) to a different body part, with my right hand controlling the reds, my left hand controlling the greens, and my feet controlling the blues. This means you've really got to put your whole body into it if you want to see the rainbow.
 
Now, before today's demonstration, a quick admission: it is an indisputable fact that I cannot dance—I cannot foxtrot, or Kathak, or t-step, or mamba, or Riverdance, or waltz, or grind, or conga, or striptease, or twist, or Charleston, or Tanoura, or square dance, or even stagger intoxicatedly about to a beat—and this does make me question why I chose to undertake an experiment wholly focused on dancing in the first place. No matter.

But channeling the combined exuberances of Elaine Benes, Ghyslain Raza, and Napoleon Dynamite (quite the pedigrees to live up to actually) I decided to give it a go. And, given all the awkwardness that was sure to ensue, naturally the only fitting tune for my first choreographic excursion was Billy Idol's *Dancing with Myself*.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/TuUiSBzez30" description="Limbs flailing, arms akimbo, feet kicking up dust..." %}

Even though I'm typically far too self-conscious to enjoy unaided dancing, the experience was actually pretty fun.  Moving my limbs and watching the world burst into color in response was kind of magical. It captures some indefinable physicality that virtual reality never truly does, even though immersive VR can offer far more surreal experiences.

Quick air punches provided sudden bursts of color, while slower sweeping motions allowed for somewhat finer control. This isn't a precise instrument by any means however. Trying to match my movement to the beat and maintain my vision in a natural looking state was a fun challenge, but most of the time I was alternating between near grayscale vision and a hyper-saturated dream world. 

I certainly don't think all this hardware improved my dancing however, and all the wires and VR goggles really actually only made the entire exercise look even more ridiculous. Still, short of head-banging, I didn't find my dancing to be encumbered or limited in any way, so I really don't have any excuses here.


# Rush Rush
{% include image.html file="blur2.jpg" %}

Since I enjoyed writing shaders to alter my vision so much, next I decided to change my vision in a much more substantial way. This experiment is set to, and draws inspiration from, *Rush Rush* by Debbie Harry. Vision starts out more or less normal, with dancing slowly amplifying the various effects.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/R3G0-FkZ-Ss" %}

Reaching full strength requires vigorously dancing for about a minute, but the reward is undoubtedly worth it, with pulsing layers of distortion, dizzying motion trails, and a glowing colorscape of neon pinks and cyans. Rush rush indeed.

Even more so than *Dancing with Myself*, the dream like quality of the effects made me feel somewhat detached, and I truly got lost in the moment. I imagine that if this sort of headset were combined with the sensory overload and/or altered states of consciousness common to some live musical venues, you could create some truly mind blowing experiences.


# Maniac
{% include image.html file="blur4.jpg" %}

I also explored using the dance suit to control both my vision and the music. The choice of music this time around was *Maniac* by Michael Sembello, with a visual effect that tries to emulate an 80s workout video (much credit for the basic [TV shader effects here goes to Felix Turner](https://www.airtightinteractive.com/demos/js/badtvshader/)).

The way the visual effects work is similar to *Rush Rush*, but now my dancing also controlled the speed of the music. Standing still, the music was paused. As I started to slowly move about, the music began to play at a super low pitch, like some *Gloomcvlt* sampling. When I sped up a little and got my whole body moving, I sometimes reached almost normal playback, while dancing too fast on the other hand sent poor Michael into overdrive, with borderline *Alvin and the Chipmunks* vocals.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/vyUonKQ-h2o" description="A courtship display is a set of display behaviors in which an animal attempts to attract a mate and exhibit their desire to copulate. These behaviors often include ritualized movement (\"dances\"), vocalizations, mechanical sound production, or displays of beauty, strength, or agonistic ability — [Wikipedia](https://en.wikipedia.org/wiki/Courtship_display)" %}

One quick note: unlike the previous two videos, the audio here was recorded separately since I was unable to get low enough audio latency from the iPhone to the speaker for realtime use. That's why I'm wearing the earbuds here, and recorded the sound directly on a computer instead.

In contrast to the slow buildup of *Rush Rush*, this time I made the music and visual effects much more sensitive to my current movement. Pause, even just for a second, and the music quickly drops off. This sensitivity, combined with the spiky nature of the accelerometer data, is why there's a somewhat throbbing quality to the music and visuals.

The system's far more rapid response made me much more aware of how I was moving, but not necessarily in a negative, overly self-conscious way. The experience was actually more like some rhythm game. It was a fun challenge to try to maintain a more or less steady playback rate, one that required constantly monitoring my motions and making rapid adjustment based on their impacts. As you can see in the video, I was not very successful at doing this. While a proper rhythm game using this sort of technology could be fun as well, I think that a more generative, open-ended visual and audio experienced based on body movement could be even more interesting.


# Thoughts

{% include image.html file="footloose.jpg" description="Sadly, even after all this dancing, my butt is not nearly as cute as Kevin Bacon's" %}

Even using basic hardware and software, the resulting experiences were a lot of fun. Each one is unique and hints at the enumerable ways that a system like this could be used or expanded upon to create novel interactive experiences. As mentioned, a more comprehensive suite of sensors would really open things up, and I didn't even try applying this system to actual choreographed dancing. Most of concepts map to more traditional VR and AR as well.

Check out the [source code][src] if you're interested in exploring how this was all implemented, and [let me know](/about) if you have any fun ideas for other dancing experiences that could be created using this system.



[blood]: /all-this-blood
[mr]: /series/modded_reality
[selfie]: /selfie-reality

[src]: https://github.com/mattbierner/im-only-dancing-so-that-i-can-see-the-rainbow

[mjpeg-streamer]: https://github.com/jacksonliam/mjpg-streamer
[lilypad]: https://www.sparkfun.com/products/9267
[mcp3008]: https://learn.adafruit.com/raspberry-pi-analog-to-digital-converters/mcp3008