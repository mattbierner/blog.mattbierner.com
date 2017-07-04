---
layout: post
title: "Pop Reality"
date: '2017-05-03'
description: "Connecting a lollipop to a VR headset"
series: modded_reality
titleImage:
    file: "title.jpg"
---

{% include image.html file="title.jpg" %}

People like taking selfies and people like eating candy, so why not combine the two? *Great idea!* So allow me to introduce *pop reality*, a fun new [modded reality][mr] experience that is sure to have popular appeal.

This isn't modded reality's first venture into the oral realm. Just a few months back, I stuck a camera inside of my mouth in order to stream an [oral outlook][oral] to a VR headset. Although not without its interests, that experience was perhaps rather too cerebral for your average consumer. *Pop reality* addresses this failing by instead moulding the camera inside of a deliciously saccharine lollipop. Seeing the world through your lolly is pretty much what you would expect, which is to say: amazing! Let's take a look.

# Hold Your Breath — Make a Wish — Count to Three
Making a lollipop camera is fairly simple, so feel free to follow along at home if you want in on the fun (although I take no responsibility for any molten sugar burns that occur during construction, or any desires for Sallekhana felt after using the device.) 

I decided to reuse the [cheap usb endoscope]( https://www.amazon.com/gp/product/B01MCS549Y ) from my mouth camera adventure. This small, tube shaped camera is about 6mm in diameter and about 40mm long. It also is waterproof and somewhat durable.

For the lollipop, my first thought was to just stick the endoscope inside of a *Ring Pop*. After sizing things up, I found that the endoscope was just small enough to fit nicely inside the candy, so I attempted to drill through the bottom of a clear blue *Ring Pop* up into the delicious candy above. This quickly proved hopeless, as even the smallest drill bit shattered the brittle candy into a thousand pieces. A different approach was needed.

So instead, I decided to play Wonka and create a homemade lollipop. This way the candy could be moulded around the camera perfectly. I could even reuse the plastic base of the *Ring Pop* to give the whole thing a more professional look. For this, I continued drilling a hole through the plastic base of the *Ring Pop* until the endoscope fit in. I left about 1.5 centimeters of the endoscope sticking out on the side where the candy would go, which provided a nice stalk to form the lollipop around.

{% include image.html file="pop3.jpg" %}

The [candy recipe](https://www.thespruce.com/lollipops-521375) that I followed called for heating two parts sugar with one part light corn syrup—with a dash of water thrown in for good measure—until the mixture reaches about 300 degrees Fahrenheit. For the sake of clarity, I opted not to add any dyes or flavorings. The mixing and heating went smoothly, although the temperature seemed rather high. "Won't the molten sugar just melt the plastic lens of the camera or even destroye the whole endoscope?" I wondered. Probably, but that seemed like a problem for future me to worry about.

My mould was simple, just a hemisphere out of aluminum foil, and this is the main area where I could have done a better job. My mould was far from smooth, which left the lolly with very poor optics. A proper mould—perhaps even one of a more gem-like shape—would be interesting, and the field of sucrose optics seems ripe with possibility.

{% include image.html file="mould.jpg" %}

After carefully doling the hot sugar mixture into the mould and sticking in the endoscope, I set it aside for a few hours to cool. By this point, the remaining sugar in the pan had hardened into an glass-like substance that was very difficult to clean up without near boiling water. This seemed promising. 

After around four hours of cooling, I carefully unwrapped the lollipop and examined my creation. The first thing that came to mind was an adult pacifier. This makes sense given that the lolly was built around a *Ring Pop*, which is pretty much just a candy pacifier to begin with.<!--This also was a good finding from purely business perspective. Clearly this device will have a builtin market with endoscope voyeurs of the adult baby community. Now off to Shark Tank...--> The candy itself was a clear, slightly yellowish glassy material. The foil left lots of little wrinkles and dents in the surface, but these were smoothed out by a quick dunk in a bath of hot water. The candy was also surprisingly tough, much more so even than a normal lollipop. It was almost like a hunk of glass.

{% include image.html file="pop1.jpg " %}

When I finally ventured to turn on the endoscope, lo and behold it still worked! Both the camera and the lights were fully operational. As expected though, the image quality was not good. 

For connecting the lollipop to a VR headset, I used the same software pipeline from my original mouth camera experiment. The usb endoscope is connected to a Raspberry pi which uses [mjpeg-streamer][mjpeg] to create a realtime video stream from the lolly. This stream is then viewed on an iPhone with a Google Cardboard headset.

{% include image.html file="setup.jpg" %}

I faced the same limitations with the stream that I detailed in the [mouth camera experiment][oral]. The endoscope's field of view is pretty narrow, which amplifies movements and makes depth perception difficult. Also, I had to drop the camera's resolution to a pitiful 352x288 because of how inefficient mjpeg-streamer is for YUYV video data. In retrospect, a fisheye webcam and a higher resolution really would have worked better—and just imagine a stereoscopic lollipop camera, because who doesn't want to see their tongue coming at them in glorious 3D. Perhaps a more skilled candyhacker could throw these together.

All in all though, this DIY setup worked surprisingly well. The lollipop camera is small and can be used much the same as a normal lolly. Yes, forget watches and spectacles, it seems to me that the true future of personal tech is in edibles and insertables, and you can experience this thrilling future today! All you need is a cheap endoscope and a bit of sugar.


# Come With Me — And You'll Be — In a World of Pure Imagination

{% include image.html file="portrait-of-nerd-boy-sucking-lollipop-and-looking-at-camera-in-suspense.jpg" %}

But what of *pop reality* itself? Well I'm happy to say that it does not disappoint, although it did prove somewhat less than practical. I wouldn't have it any other way.

Slipping on the goggles, the first minor problem I encountered in *pop reality* was that it was next to impossible to see anything. It was like looking through a glass block. I could make out areas of light and dark, along with the colors and vague outlines of some nearby objects, but not much beyond that. It is certainly a neat visual effect though, especially when light catches the candy at the right angle.

{% include image.html file="view1.png" %}

The viewport was also hardly ideal. As with my mouth camera experiment, the endoscope's narrow field of view made it difficult for me to piece together an understanding of the whole scene's layout. And it was hard to even see objects closer than five feet away.

Further complicating matters this time around though was aiming. I mounted the endoscope perpendicular to the *Ring Pop's* base, with the camera rotated so that everything lined up when the ring part of the pop was held vertically. In practice though, I found it very difficult to understand where I was aiming the camera or even keep the lolly properly rotated for filming. To make matters worse, the abstract nature of the view made this misalignment difficult to notice until it was too late. This made navigating the world almost impossible. Although I thankfully escaped major injury, more than a few toes were stubbed.

This effectively left *pop reality* a stationary experience, similar to *Job Simulator* or what have you. But the oral dimension—an area in which current virtual reality systems are sadly lacking—is where *pop reality* really shines.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/d1P06IXyxyk" %}

Like a regular Yuri Gagarin, I now prepared myself physically and mentally to cross over into inner space. Tongue extended, I slowly brought the lollipop capsule closer and closer to my mouth before cautiously giving it a lick. *Sweet Jesus!* It's difficult to describe the mix of horror and delight that filled me as I ran my tongue over myself for the first time. <!--real quality writing, that-->

The licking itself was more of a indistinct blur across my vision, with few tongue details really visible. Perhaps the more interesting views came from the preparatory phase, as here I could at least make out some of my face and my gaping maw.

Not content with superficialities, I next stuck the entire lolly into my mouth. This proved to be fairly uneventful, at least when compared to my [initial oral foray][oral]. Gone was the thrill of nearly choking to death—along with all accompanying wrenching and gagging—and the view was far more abstract as well. Even after adjusting the endoscope light, I could barely make out any details.

{% include image.html file="view2.png" %}

This is also when I started wishing that I had added some flavoring to the lollipop. While it didn't taste bad per se, the uncut sweetness was quickly becoming fairly cloying. A dash of lemon or cherry may have livened up matters. Still, the lollipop was holding up surprisingly well, far better than a standard lolly would have under similar circumstances.

{% include image.html file="night2.jpg" %}

Now, while I always took *pop reality* to be good clean fun, a less mature take on the experiment must be addressed. As many adverts and pinups have noted, there can be something a tad suggestive in even a normal lolly, and upon reflection, I suspected that some internet denizens would try to draw less than flattering parallels between *pop reality* and fellatio. My response: so what? If anything, the far more interesting parallel from a figurative perspective would be to auto-fellatio in order to comment on social media or whatnot, but even that is a stretch. No, life is too short to be concerned with such uninspired perceptions.

Having sailed cleanly over those salacious jaws, I will allow that something about *pop reality's* oral fixation and inward gaze seems worthy of further exploration. Yes, lopping off the *lolli* bit of *lollipop* is fitting. I however leave further musings in this direction as an exercise for the reader.


# There is No Life I Know — To Compare With — Pure Imagination
{% include image.html file="oh-snap.png" description="Suck it Snapchat, you done bet on the wrong orifice<br>(Also, frankly my dear, I rock the red background far better anyways)<!--Although I really should have worn lipstick for the photoshoot. Next time.-->" %}

As for me, I found *pop reality* to be just a good bit of fun. It is true that I could barely see anything or even move about safely—just as it is true that the oral aspects of the experiment were visually rather abstract and sometimes rather gross—but the experience as a whole was just a good time.

It seems fitting that much of *pop reality*'s appeal comes from its playful embrace of artificiality. A regular old lollipop doesn't pretend to be useful or make you better, nor does it try to accurately replicate nature. A cherry lolly is more cherry than a cherry could ever hope to be, and who knows where the hell those neon blue raspberries grow. But *that* is the appeal. And this is the future I see: a reality beyond the real, a *pop reality*. Living there you'll be free, if you truly wish to be.

Which is to say: someone really needs to start manufacturing these lollipop cameras and selling them for like $15 a pop or so. Or even better, just make one yourself today. You won't regret it.


{% include image.html file="night1.jpg" %}


[oral]: /mouth-cam
[mr]: /series/modded_reality

[mjpeg]: https://github.com/jacksonliam/mjpg-streamer
