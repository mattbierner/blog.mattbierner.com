---
layout: post
title: "Forward Propagation"
date: '2016-05-16'
description: "A tool for exploring history in terms of generations instead of years"
titleImage:
    file: "logo.svg"
---

{% include image.html file="logo.svg" %}

**Links**

* [Forward Propagation][forward]
* [Source code][source]
* [all-of-human-history npm package][history]

Seventy five years separate the end of the American Civil War and the start of the Second World War. Seventy five years... One lifetime... To ride in with *Sherman's March to the Sea* and out again with the *Enola Gay* turning away from Hiroshima...

I've always placed these two events so distinctly in history that this realization blew my mind. The Civil War feels so distant, so quaint—a war of canons and calvary fought over slavery—while World War II still somehow feels modern, it still somehow feels relevant. And yet, World War II is already almost chronologically closer to the Civil War than to the present. Hell, it's even conceivable that someone born during the late Civil War could have witnessed the Apollo 11 moon landing, provided they lived to the ripe old age of 105 (for those of a less American persuasion, *From the Earth to the Moon* was also published in 1865.) Seriously history, WTF?

My conception of history is distorted. Events feel both closer and more distant then mere dates suggest, timespans compress with distance, and major events seem to cleave the timeline in twain. Simple math shows that 1939 minus 1865 is about 75, but years are too abstract for my liking. Instead, why not use a more intimate ruler? Why not measure time in human lives? (coincidentally, this is also my [favorite way to measure expenditure](/staying-alive/))

How many people lived and died in the shadow of the Cathedral at Köln, never to see its completion?

How old are the kids who never knew a pre Minecraft world?

How many hops back is the *Black Death* in a game of generational [telephone](https://en.wikipedia.org/wiki/Chinese_whispers)?

I recently created a simple tool called *[Forward Propagation][forward]* to explore this last point specifically. Generational telephone looks at the number of cross generational interactions, in terms of knowledge transfer or connections, between two points in time. Consider: events that happen during my lifetime are zero hops away; events that happen during the lifetime of people I can know directly—everyone from my grandparents, to my grandchildren for example—are one hop away; and so on. Alas, you can't call the dead, so the telephone as a metaphor for knowledge transfer only works when hopping forward in time. Hopping backwards, think in terms of connections or relationships instead.

For example, if we assume an average human lifespan of 80 years (a nice number to work with, and reasonable for us hardy modern folk, but not so reasonable historically), it's possible that a person alive today could actually have known someone born during the American Civil War!

{% include image.html file="civil-war.png" %}

Start with a person born in 1860 and who lived to the age of 80 (the year 1940.) Therefore, an 80 year old person alive in 2015 (born in 1935) could have known the Civil War era elder as a young child.

*Forward Propagation* displays each generation on a timeline, along with major human events that took place over the entire span of the generations. For me at least, considering time in generations instead of years makes a big conceptual difference. 

Instead of looking at knowledge transfer, increase the generational overlap to approximate familial generations. Here's the same timespan in terms of six familial generations (each generation living for 60 years and producing the next generation at age 20):

{% include image.html file="fam.png" %}


Or, step back 100 familial generations to reach BCE:

{% include image.html file="100-generations.png" %}


Sure, the numbers are all terribly approximated, and the tool compresses everything to a single generational path, but it's still an interesting way to think about history and your place in it. Checkout the [website][forward] to try it out.

PS: To feed *Forward Propagation*, I also created a [small npm package with data about major historical events][history]. Really, I just wanted to be able to type: `$ npm install all-of-human-history`. Mission accomplished.


[forward]: http://mattbierner.github.io/forward-propagation/
[history]: https://github.com/mattbierner/all-of-human-history
[source]: https://github.com/mattbierner/forward-propagation
