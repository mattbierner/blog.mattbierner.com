---
layout: post
title: "Things I clicked so that they would die"
description: 'Capturing everything you click on during a complete play through of the original Halo'
titleImage:
    file: 'easy-small.png'
---

Here are some pixels I clicked on so that they would die:

{% include image.html file="click-1.png" %}

Here are some more:

{% include image.html file="click-3.png" %}

And some more!

{% include image.html file="click-2.png" %}

See, I've long wondered what the gameplay of a first person shooter would look like if you only saw the exact frame when the player pressed the fire button. Would this capture any humorous scenes? Would there be any patterns? Would it provide any insights? And given that most everything in Seattle has been canceled in recent days, I decided now was as good a time as any to finally answer this most pressing question.

So over the weekend, I played through the *Halo: Combat Evolved* remaster on PC using simple script that captures a 600 pixel square in the middle of the screen for each mouse click. I played through the game twice: first on easy and then on legendary.

On easy, the campaign required some 5,750 clicks. I found it to be a mostly run forward and click things affair, with only handful of deaths (mostly self inflicted). Combining all these images into a montage presents a more or less complete view of all things you click on during a linear campaign play through.

{% include image.html file="easy-small.png"  description="Playthough on easy" %}

Legendary on the other hand required some 13,700 clicks (almost 250% more clicks than easy!). On that difficulty, the game is still just as punishing as I remember and I died a lot. Probably a quarter of this play through was spent on the second half of *Truth and Reconciliation* (represented by the purple tinged areas near the top) because God damn that level! This means that composite image captures me playing through the same difficult sections over and over again.

{% include image.html file="legendary-small.png" description="Play through on Legendary" %}

I also had to significantly modify my playing style in the Legendary run. This shows up in the images in a number of ways, one obvious one being that I ended up using the Plasma Pistol far more often. In the Legendary run, it also looks like I spent a good deal of the game fruitlessly clicking away on walls. This is because my script captured the frame I first pressed the mouse down to start charging the Plasma Pistol's shot. My script also did not account for weapons that continuously fire while the mouse is held down.

The Legendary play through also made me realize a quirk of Halo's death animation. When you die, the game switches to a third person perspective and this third person camera seems to quickly zoom out from the center of the player model. Now, given that I was often still clicking away right after dying, this resulted in my script capturing many screenshots of the first few frames of this death animation, and because of the zoom's central starting location, that meant a whole lot of crotch/booty shots of the ol' Master Chief! 

{% include image.html file="mc-crotch-shot.png" description="Combat Evolved indeed..." %}

I mention this not just to be humorous but because this was a real problem; I probably had to filter out a few hundred images like the above.

Back on topic, I like how the composite images capture the shifting color palette as you move through the game. This is most clear when the image are reduced down to a single pixel per frame.

{% include image.html file="legendary-single.png" description="Legendary play through with 1px per shot" %}

When you zoom in to the composite image you also start seeing details about gameplay, such as sequences that required rapid clicking.

{% include image.html file="legendary-close.png" description="Legendary play through details" %}

Looking at just individual frames is also an interesting way to distill a game down. Here are videos that show just the clicks of the *Halo* campaign:

{% include youtube.html width="600" height="600" description="Easy" src="https://www.youtube.com/embed/oxHiqK12fFQ" %}

{% include youtube.html width="600" height="600" description="Legendary" src="https://www.youtube.com/embed/H0T3bOlWmsM" %}

Kind of neat! Honestly though, this project was mostly an excuse to play through the original *Halo* again. 

<!-- After playing though Reach for the first time recently, I was worried that the original game wouldn't hold up. At the higher difficulties, it definitely does (although it can also be super frustrating ) -->

