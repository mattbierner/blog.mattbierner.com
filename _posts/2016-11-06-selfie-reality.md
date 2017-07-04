---
layout: post
title: "Living Vicariously Through My Selfie Stick"
date: '2016-11-06'
series: modded_reality
description: "And why selfie reality is the bestest reality"
titleImage:
    file: "ducky.jpg"
---

{% include image.html file="ducky.jpg" description="Orwell lied. If you want a true picture of the future, imagine someone with a selfie stick in VR goggles, duck facing it up—forever..." %}

What of the selfie stick? A fine recording device to be sure, albeit one that seems to draw more than its fair share of derision and scorn. But it could be so much more! So recently, I put together a simple device that allows me to experience the world through my selfie stick.

This experiment continues my exploration of what I'm calling [modded reality][modded_reality]: using technology to alter and remix one's sensory experiences. The device used here is simple – it streams video from a camera mounted on a selfie stick to a VR headset—yet it is extremely fun to play around with, more so than any of my previous experiments. Imagine a video game style camera, but for real life. Top-down, over-the-shoulder, and third-person views are all possible, along with plenty of others. Let's take a look.


# Setup
{% include image.html file="spectacles.jpg" description="I see your spectacles and raise you this.<br>(Side note: Glasses with a camera? Is that *really* what people find exciting? I must be out of touch...)" %}

I'm using the same [hardware and software detailed before](/tenome/#setup), with a Raspberry Pi streaming mjpeg video from a pair of usb web cams to an iPhone inside of a Google Cardboard headset. The main modification—beyond the addition of the all important selfie stick of course—is that, this time around, I tried capturing stereoscopic video.

Now, I had previously explored stereoscopic vision in [my hand mounted camera experiment][hands], moving my hands/cameras next to each other to create a poor man's stereoscopic view, but proper alignment was extremely difficult to maintain. I also tried strapping two cameras next to each other in my [body cam experiment][body], but, again, good alignment was impossible and, in the end, it was better to just use a single camera duplicated across both eyes.

To achieve proper alignment this time around, I designed and 3D printed a very simple mount to hold a pair of cameras. The distance between the two cameras is around three inches, a little over the normal distance between human eyes.

{% include  image.html file="setup-cams.jpg" %}

The two slots at either end of the case are for straps, which were not required in this experiment. Each camera captures images at 800 by 600 pixels at 60fps.

The resulting stereoscopic effect is fairly good, provided the phone is properly positioned in the Cardboard unit. Having more 3D vision makes the experience more immersive, and also helps greatly with depth perception. I also feel it reduces, for lack of a better term, the VHS home video quality of the stream. Things just feel more natural compared to using a single stream duplicated across both eyes.

The dual camera mount is about the width of a small phone, so it was easy to snap it into a selfie stick.

{% include  image.html file="setup-cams-on-stick.jpg" description="Pancam Mast Assembly" %}

Any selfie stick works (and, come to think of it, a non-selfie stick would probably work just fine too). The model I'm using extends from about a foot to around four feet, providing a good range of possibilities. The camera head can also be tilted easily. 

That's all there is to it. As you can see, the device is nothing fancy, but it works.

{% include image.html file="setup-overview.jpg" %}

{% include image.html file="setup-front.jpg" %}

{% include image.html file="setup-back.jpg" description="Since this post is all about selfie sticks, it seems only appropriate that there are far too many pictures of me..." %}

One last note: I added screen recording functionality to the [simple iOS app](https://github.com/mattbierner/tenome-app) used to view the camera streams, freeing me from the clunky ethernet hookup previously required for recording demo videos.


# Head On
{% include image.html file="head-side.jpg" %}

I began with an exploration of traditional, head-on selfie stick perspectives, the sort everyone knows and loves.

Starting with the stick at its shortest length,  my first look back at myself was a little bizarre, but quiet similar to my hands for eyes experiment. Again, although the selfie stick perspective is now familiar in videos and photos, it's very odd to watch yourself in realtime this way, especially when you're decked out like a proper cyborg.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/ICG3kakE6R8" %}

The fisheye lenses provided a pretty immersive view, even when I held the camera relatively close to myself. I could see the stick and my arm holding it at the bottom of the frame, but these never got in the way. As for image quality, stereoscopic vision improves immersion considerably. It makes things feel more real. As I moved the camera about, the motion was smooth and lag was never a major problem.

{% include image.html file="stick.jpg" description="Let's just get the phallic nature of the selfie stick out of the way now so that we can move on to more interesting matters." %}

Extending the stick to a more traditional selfie stick length, I found that I could see my upper body and surroundings fairly well. It takes time to get comfortable moving the stick or your body to look about the world, and I still often instinctively tried tilting my head to adjust the view.

{% include image.html file="head-long.jpg" description="Smile for the camera" %}

It's quite fun to orbit the camera about and explore different angles. The overall effect is like moving a camera about your character in a video game. I know that I keep making parallels between these modded reality experiments and video games, but video games really are the best common reference point that I know for what many of these experiences are like. It also seems fitting to me that while games are striving to be more realistic, with ever better graphics and immersive VR experiences, we can also make real life more like a video game.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/X2GKONcjtg8" %}

Head-on selfie stick views are great fun while standing still, but rather dangerous once you start moving about, as you can't see what's in front of you. That's a minor problem. Walking backwards helps with this, although that brings its own complications.

I also tried flipping the camera around, so that it pointed away from my body. This is somewhat neat, but still not at all practical for moving about the world as I could never get a good sense of where my body was. 

There are advantages to having your eyes on the end of a stick however. Say something catches your eye and you want a closer look. No need to move your head closer like some 20th century chump, simply start extending the selfie stick to get closer and closer. The length and nature of the stick also allows you to look at many otherwise inaccessible locations. And, if you're really feeling lost, you can always position the cameras in front of your goggles to replicate standard vision.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/kA18R7uuCJQ" %}

While the [Pale Man, hands for eyes setup I previously explored][hands] was a rather acquired taste, using the selfie stick is comparably approachable and accessible. The stick is comfortable to hold for one, and makes it easy to tilt and angle the view. It's also hard to forget that you are holding the stick, which somewhat helps cut down on unexpected camera movements.

And no post on modded reality would be complete without a discussion of nausea. In this regard, I'd say that selfie reality ranks somewhere between the exorcist inducing [partner mounted camera system briefly explored previously][partner], and the [quite usable body-cam system][body]. While the motion of the camera is generally smooth, with the selfie stick, the camera moves in much broader sweeps that were a little disorienting at time. It's not terrible, but even after some experience with this and other similar devices, I started feeling a little unwell after around twenty minutes or so of continuous use.


# Over the Shoulder
{% include image.html file="behind-1.jpg" description="Hobo of the future" %}

Next, I tried resting the selfie stick on my shoulder to position the camera behind me. Using your non-dominant hand to hold the stick, the setup can be used for extended periods without major annoyance or discomfort. Depending on the angle and position of the camera, I could go from a *Gears of War* style over the shoulder type perspective, to a third person perspective more reminiscent of *Watch Dogs* or what have you.

For an over the shoulder perspective, I kept the stick at its shortest length and angled it slightly away from my head.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/zIo3lx8hhgE" %}

The wide angle view allowed me to see and interact with the world pretty well, although it was sometimes difficult to understand where my dominant hand was. For one, my head was annoyingly blocking much of my vision on that side of the frame. The overall perspective and the distortion from the fisheye lens also make judging depth and absolute position challenging. So while was easy enough to reach out to open a door or grab something from a table, I did jam my hand into a wall a few times. Tilting the camera upwards or further away from my head often helped me to get a better take on things.

Another benefit of the over the shoulder perspective is that the stick only extends at most a foot behind you, meaning that it's far less likely to accidentally smash into something while you turn about. 

Moving on.

With the stick extended two feet and centered behind me, my head, shoulders, and upper torso were all in the frame.

This view also has pretty major visibility limitations however. My body blocked everything directly in front of me, leaving me to blindly grope around.

Extending the stick to it's maximum length of four feet, and resting it at my side instead of over my shoulder, produces a more standard action/adventure game perspective. My entire upper body was now in the frame, although visibility was much worse, as an even larger area in front of me was occluded by my body. 

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/F7FDzQcpW-A" %}

Other angles and positions for the camera are also fun to play around with, although most are not practical. I tried everything from low angles almost on the ground, to highly rotated views that had me looking at myself from the side.

I did notice some camera shake and view swaying as I moved about, especially with the stick fully extended. Again, the fisheye lenses do a great job at minimizing the impact of this and the effect is not as bad as the videos make it seem. It also takes time to actually trust what you are seeing, and I never became completely comfortable with this. Walking about, I was always a little bit tentative and couldn't shake a feeling that at any moment I would run headfirst into a wall.

It's also worth noting that, with the selfie stick extended to longer lengths,  caution is required when moving around. Besides the aforementioned perils of smashing the cameras into someone or something, in one memorable instance, while turning around, a hulking mass suddenly filled my view and I literally fell down trying to avoid whatever shadowy monstrosity was surely about to devour me. This shadowy monstrosity turned out to be my lamp. In a classic example of trick photography, as I was turning around, the camera came within a few inches of the lamp shade, filling my view with an indistinct something, and sending my poor mammalian brain into full fight-or-flight. I shudder to imagine what a less than trustworthy friend could do to you in this vulnerable situation (and god help you if an ant or other bug somehow makes its way onto the camera).

In general, I'd say that the over-the-shoulder views were less nauseating than the head on views, and they were also the most practical views of the entire experiment for walking about and interacting with the world.


# Top-Down
{% include image.html file="top-1.jpg" %}

More fun is to be found by angling the camera downward and hoisting the selfie stick aloft like a regular Conan, a pose that may induce not altogether subtle sniggers in onlookers, but rewards one with a lovely top-down perspective on life.

I previously explored such a top-down a little in the hands-for-eyes experiment, but the selfie stick takes things to a whole new level. Holding the stick over my head, it was difficult to actually center myself in the scene. Most of the time, I was towards the back or side edges of the frame. Even at shorter lengths, I was still able to see my surroundings fairly well and extending the stick or lifting my arm higher allowed me to see further.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/7Lwsws6faww" %}

Since the top-down perspective is primarily 2D, it is very difficult to safely navigate environments or interact with the world. I could never tell the height of anything around me. Curbs look almost flat, and I often had to reach out blindly to see if my hand was above or below something.  

It is also difficult to hold the stick steadily aloft while walking about, especially at longer lengths. Holding the stick against my body or supporting it with both hands helped better stabilize things. (I also imagine that it would be very simple to whip up a proper body mount to hold the stick.) Because you can loft the camera up to twelve feet off the ground, the top-down view is best used outdoors or in buildings with plenty of ceiling space.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/lEVqlqbUmn8" %}

All these factors make the top down view very different from normal experience, but that's also why it was my favorite. Both the head-on and over-the-shoulder views have at least some grounding in normality – be it looking in a mirror or in photographs—while I truly can't ever recall viewing myself from this sort of top-down perspective. It's the type of thing that's only possible because of technology, an experience truly befitting the concept of *modded reality*.

One final observation: I found that the introduction of a small dose of THC (five milligrams delivered by delicious brownie) improved immersiveness considerably, almost to a point that was slightly unnerving. While walking about, everything felt very unreal, like I was in a simulator or virtual reality environment. Moving the camera became more second nature, and it really felt like I was orbiting the camera about some avatar. This is where things become a bit concerning. There was a definite temptation to try things, such as jumping over obstacles or running into walls to see what happens, that would be unwise. I wasn't hallucinating—and I certainly wasn't anywhere near trying to jump off a building because I thought I could fly or anything like that—but my slightly altered state expanded the realm of possibility and made immersion much stronger. There's a lot of potential in combining pharmacology and modded reality.


# Thoughts
{% include image.html file="eyes-3.jpg" %}
 
This experiment was in part inspired by good ol' [Marky Zee and crew's demonstration of a VR selfie stick](https://www.engadget.com/2016/04/13/facebook-social-vr/) earlier this year. But come on! [Facebook's vision of social VR][socialvr] strikes me as little more than an uninspired extension of everything that's wrong with physical selfie sticks (not that hooking up a selfie stick to VR goggles is all that innovative).

I find it more interesting to explore how technology can enhance and alter experiences, or provide new and novel experiences. That's what this device does. It takes something that's normally used for recording, the selfie stick, and instead uses it to change how you experience. And it's awesome! Seriously, selfie reality is just fun to play around with. It's novel and flexible enough to be interesting, but not so completely bizarre as to be entirely disorienting. Yeah you'd look like a damn fool wearing this device around Yosemite or London or anywhere really, but it's a hell of a lot better than taking photos of yourself.




[modded_reality]: /series/modded_reality
[hands]: /tenome

[partner]: /tenome/#body-swapping--with-great-power-comes-great-responsibility--the-horrors-of-true-self-love
 
[body]: /tenome/#body-cam--a-pi-backpack-mount--first-person-arm-simulator


[socialvr]: https://www.facebook.com/mike.booth/posts/10209079557850643

