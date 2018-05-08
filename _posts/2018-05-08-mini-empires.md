---
layout: post
title: Mini Empires
description: Time-lapses and other visualizations of the *Age of Empires II* minimap
titleImage:
    file: 'game1-initial.png'
---

What does a strategy game look like if you only look at the minimap? I decided to recently explore this idea by returning to the classic *Age of Empires II*.

# Initial exploration

I began by looking at a match with three AI players competing on a medium sized map. Here's the starting state:

{% include image.html file="game1-initial.png" description="If *Ready Player One* taught me anything, it's that it is perfectly fine to cling to your childhood forever." %}

By capturing a screenshot of the minimap every few seconds, we can create a time-lapse of the game. Each frame of the video below represents two seconds of real time. At 24 frames per second, the two hour game now takes a much more reasonable two and a half minutes:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/gXhEp-VWtDc" %}

Here's the same match with the background removed. Reminds of me bacteria fighting it out in a petri dish:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/L7Ogv2rxAlc" %}

Compositing the frames on top of each other revealed this thing:

{% include image.html file="game1-stacked.png" %}

While mean blending all the frames revealed common paths through the map:

{% include image.html file="game1-mean.png" %}

To better show movement and action, I also tried looking only at the visual differences between each frame:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/rhdahHBC5gE" %}

And here's a visual representation of the each color's coverage:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/OzytodYre5c" description="Color coverage of the map. Played at 2x the speed as the other examples" %}

Combining the frames of the above video into a single image going left to right, we get:

{% include image.html file="game1-percents.png" %}

Pretty.

# Other matches

Watching the time-lapse of the AI's behavior was fascinating, so I decided to capture a number of other matches to see what they would look like. Unless otherwise noted, all of them used the following setup:

* Age of Empires II HD edition
* Conquest on random map
* Randomly selected teams
* Starting in the post imperial age
* AI at standard difficulty

Here's the match from earlier, plus three replays of it. Each one evolves differently despite the same starting conditions:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/qjVJXJb-Ffk" %}

In these time-lapses, you can also start to make out patterns in the AI's behavior. Much of it is rather nonsensical—at least at the standard difficulty—with the AI attacking by sending a line of units towards the target or retreating right as it has amassed an army at the edge of the enemy's defenseless town.

Three player matches are particularly interesting because of their dynamics. Sometimes two players gang up on the third, sometimes there's a royal rumble in the center of the map, and sometimes the third player executes a sneak attack while players one and two bash it out (the AI is not smart enough to actually plan out any of these maneuvers, they just emerge naturally).

The lack of these dynamics makes two player matches shorter and generally less interesting. Here are a few of those:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/hZzVwgjl2_o" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/ioHHnZThS2M" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/x8Iqceg5B7s" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/LXwIwO1ZkDs" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/yH-Akm-v5f0" %}

Things improve again when we move to four player matches. In these, the fourth player is often eliminated early on, resulting in a three player match again.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/hCDbEihzvkE" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/5Dw4x6EBZac" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/ZOyTB0zbWug" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/qkeu3aIYWDo" %}

I captured most of these matches by letting them run overnight. Most lasted an hour or two, but a few stabilized into stalemates. In four player match below for example, things started out exciting before the AI seems to have gotten stuck. Having exploited all land resources, blue and yellow just gave up while red continued happily fishing away forever.

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/xOCoR7cEg68" %}

Eight player matches are more chaotic. These matches involved four, two player teams:

* Red + blue
* Cyan + purple
* Gray + orange
* Yellow + green

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/-5tdM-CB6bo" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/B_qoj2UDbpo" description="Gold rush" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/_sMsDl2u1HQ" description="Fortress" %}

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/ZCDZvvvB5e0" %}

One of the games had almost zero combat:

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/etrmdk2v8l8" %}

# Slicing

Of course there are plenty of other ways to look at the data besides a time-lapse, one of the more interesting approaches coming from projecting the 2D slices of the minimap into a three dimensional volume. I used [ImageJ](https://imagej.net/Welcome) for this analysis.

Here's the original match as a 3D volume:

{% include image.html file="game1-3d-1.png" %}

The z axis (shown vertically here) is time. In the volume, buildings form solid vertical lines since they never move between construction and being destroyed.

Zooming in, we can also see the movement of troops and villagers through space and time. These look like little passageways:

{% include image.html file="game1-3d-2.png" %}

Especially cool are the faint, spiraling trails of scouts moving through the map. These are much clearer in 2 player matches:

{% include image.html file="2player-3d.png" %}

Eight player matches on the other hand are pretty much a mess.

{% include image.html file="8player-3d.png" %}

Finally, by taking a 2D through the slices of the volume, we can look at individual planes of the map over time:

{% include image.html file="game1-5d.png" %}

# End

While the 3D projections are neat, I still find the simple time-lapses the most interesting. The minimap is very much a petri dish view of the game with each side reduced to a splotch of colored pixels, and somehow it's fascinating to watch to watch the colors surge, retreat, and conquer. Maybe that's what all combat looks like from high enough up.

You can find the scripts used for this project [here](https://github.com/mattbierner/mini-empire/tree/master/example). They are super rough so your milage with them may vary. It might be fun to apply these same techniques to other games, and are surely plenty of other neat ways to look at data like this too. Let me know if you create anything interesting. 