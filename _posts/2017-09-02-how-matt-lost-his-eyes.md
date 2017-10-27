---
layout: post
title: 'How Matt Lost His Eyes'
titleImage:
    file: 'title.jpg'
date: '2017-09-02'
series: modded_reality
---

{% include image.html file="title.jpg" %}

If [*Anschauung*][anschauung] were a Hallmark Presentation, the film would open with the words "based on a true story", the orchestra would swell, and we would fade in on a snowy Connecticut town where recent divorcee Matt (played by Mathieu Amalric) is just waking up to find that not only have his eyeballs gone missing, but that Christmas is only a week away...

Yes while *Anschauung* is fiction, it was inspired by a real project and much of the story was inspired by my experience using it. For the project in question, I mounted cameras inside two large, white orbs that resemble eyeballs, and wirelessly streamed video from these cameras to a VR headset. This in effect allows you to carry around your eyes or even pass them off to a friend. And I really did try showering, making breakfast, coding, and so on while looking at the world through these oversized, detachable eyeballs.
 
Rather than detail the project in one of my traditional write-ups, I thought it would be fun to try something a little different. Thus, *Anschauung*. In this post, I wanted to provide more information about the project itself and how it was realized. 

Also, heads up: if you're interested in experiencing what it's like to have your eyeballs fall out of your head, my eyes and I will be at this year's [Seattle Mini Maker Faire][faire] on September 16th and 17th.

# Origin
{% include image.html file="hold.jpg" %}

The eyeball project grew out of my work on [*I Am A Camera*][camera]. In that project, I was fascinated by the idea of being able to hand the camera to someone and let them control what you see. I'd explored crude forms of such sensory sharing a few times before, but generally found them less than compelling. A handheld, wireless streaming device like the camera however gave the experience new appeal. I imagined what it would be like to let friends—or perhaps even strangers—control what you see.

But such a project needed the right presentation. While *I Am A Camera* could have been realized more easily by streaming video from a cellphone, using an old camera is what defined the experience. It's what made it fun and unique. I needed a similar conceit here.

So with the one year mark of my exploration of [modded reality][mr] approaching, I decided to bring things full circle, returning to an idea that I joked about in the opening paragraph of [*Tenome*][tenome]: relocating my eyeballs. Wouldn't it be interesting if you could pop your eyes out of your head and carry them about, bowl them along the floor, toss them into the air, or hand them off to someone? 

After completing the eyeballs though, my personal experience using them inspired *Anschauung*. I'm not sure how successful the story was, and it turned about to be less about the device than anticipated. The eyeballs are actually quite fun to use. But first a word on how they were created.

{% include image.html file="hold2.jpg" %}

# Creation
The project called for two large eyeball-like objects that could wirelessly stream video to a VR headset. I first considered a more abstract take on the eyes: perhaps some piece of funky techno junk for example, or maybe a colorful, geometric shape? However to make the idea of the project clearer to onlookers, I ultimately decided to aim for an oversized glass eyeball look.

It turned out that glass eyeballs of sufficient diameter for this project just did not exist. I searched high and low with no success. All the large eyeballs for sale were either for halloween or for anatomy lessons, and this is not what I was after. 

{% include image.html file="amazon.png" description="You lie Amazon!" %}

Next I reached out to several prop makers to see if they could fabricate some large eyes. No response. I even tried contacting some glassblowers to see if they could blow a pair of giant glass eyeballs for me. Again, nothing. 

{% include image.html file="email.png" description="Sadly far from the strangest email I've sent recently" %}

As luck would have it though, I stumbled across a pair of white, metal, globular lampshades in a used furniture store. One of these is about eight inches in diameter with a six inch aperture, and the other is around six inches in diameter. And while they were pretty dinged up, it was nothing a little white spray paint couldn't hide. I had found my eyes.

{% include image.html file="parts.jpg" %}

Each eye is brought to life by a Raspberry Pi Zero W, an ELP fisheye usb webcam, and a lipstick battery. The electronic components are significantly smaller than the eyeballs themselves, and are housed in a small tube within each. I filled the remaining inner volume with a dense expanding foam, which makes the eyeballs feel very solid and gives them a satisfying heft.

The iris and pupil are laser cut acrylic. The iris is slightly larger in diameter than the lampshade's aperture, and is hinged so that it can be inserted properly. The pupil is about the size of the usb webcam. A simple, 3d printed housing connects the camera to the pupil. This whole unit velcros to the front of the iris.

{% include image.html file="iris.jpg" %}

{% include image.html file="hinge.jpg" %}

Each eye streams video from the usb webcam using [mjpeg streamer][streamer]. The eyes are setup to connect to my phone's personal hotspot, which allows the phone to access the mjpeg stream over the local network. 

I had tried wireless streaming a few times before, including with *I Am A Camera*. That project used a regular Raspberry Pi Zero with a usb wifi dongle. However, even at low resolution, the stream was somewhat choppy. At first I thought this was just par for the course, as my full sized Pis had the same problem. However when I finally tried streaming on a Raspberry Pi 3 using its builtin wifi chip, most of the choppiness and reliability problems disappeared. This suggested that perhaps wireless streaming was not the problem, rather the wifi dongle I was using was the problem. When I finally picked up a Raspberry Pi Zero W, I again found that wireless streaming was now feasible using its builtin wifi chip.

{% include image.html file="overview.jpg" %}

The most basic streaming configuration has each eyeball stream to a different eye in your head. However, as I first detailed in [*Tenome*][tenome], such a setup is almost unusable. The human brain is just not configured to see a different image with each eye. More practical configurations duplicate the same image across both eyes, either by only using one eyeball to begin with or using a picture-in-picture type view. 

As with all most of my modded reality projects, the hardware and the software are simple. The same basic electronics could be stuffed into just about any housing. It would be interesting to scale up the eyeballs to zorb size. One day perhaps.

# Experience

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/2lUm2E9szfM" description="" %}

The experience and challenges of using the eyes are similar to what I describe in the first part of [*Tenome*][tenome]. Unless the eyes are almost perfectly aligned, your brain combines the image from each eye into a weird new scene that blends elements of each image. When you do line up the eyes properly, a stereoscopic image suddenly snaps into place.

The biggest difference with this experiment compared to *Tenome* is that the eyes are wireless. You can hold them however you want, set one down and walk away, or even toss them up in the air. This is all great fun. I did find it difficult to hold onto both eyes at the same time, but awkward aspects like this are what make the experience. And of managing two eyes is too difficult, you can always set one down or cover it up with your hand. You'll see me doing this a few times in the demo videos.

When holding the eyes out at arm's length, the view reminded me of my [selfie stick experiment][selfie]. I also had fun spinning my eyes around and bowling them along the floor, although they don't roll too well.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/klYtak88IRM" description="" %}

Friends and I tried out the eyeballs in a number of different places. The videos here were filmed at [Georgetown Steam Plant][steam] in Seattle. We usually just stuck with a single eye while playing around though. The two eye view is neat but very disorienting, and it quickly becomes nauseating.

Overall using the eyes is very entertaining, both on your own and with other people. I have a few more project ideas for them, although I'm not sure any of these projects will ever be realized or be worth posting about.


# Maker Faire
{% include image.html file="two-eyes.jpg" %}

My eyes and I will be at [this year's Seattle Mini Maker Faire][faire], September 16th and 17th. I'm planning to let people try out the eyeballs for themselves, and it will be interesting to see how the project goes over. 

If you're in Seattle these dates, stop by the fair to say hi, or put on a VR headset and see what it's like to have your eyeballs fall out of your head. It's really much more fun than it sounds.





[anschauung]: /anschauung
[camera]: /i-am-a-camera
[tenome]: /tenome
[selfie]: /selfie-reality
[mr]: /series/modded_reality

[faire]: http://seattle.makerfaire.com
[steam]: http://georgetownsteamplant.org
[streamer]: https://github.com/jacksonliam/mjpg-streamer
