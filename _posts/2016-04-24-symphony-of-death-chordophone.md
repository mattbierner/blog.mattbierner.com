---
layout: post
title: "Symphony of Death: Chordophone"
date: '2016-04-24'
description: "Creating an interactive musical instrument from the kills of Halo 5 multiplayer matches"
titleImage:
    file: "logo.png"
---

{% include image.html file="logo.png" description="Through golden visors,<br>their eyes met. Two warriors,<br>bound solely by death." %}

When 343 Industries announced a [public data API for *Halo 5*](https://www.halowaypoint.com/en-us/community/blog-posts/halo-api-hackathon), I got pretty excited. Now mind you, while I cracked my share of skulls at *Blood Gulch* back in the day (and let me tell you kids, back then, we were happy just to get 50 pixels apiece in splitscreen mode), I've never actually played *Halo 5*. Or *Halo 4*. Or 3 for that matter! But data be data, and after [my experiment using *Spelunky* keyboard input to draw Etch-a-Sketch style][spelunky], I've been itching to explore other interesting ways to visualize videogameplay. Thus was born *Symphony of Death*. The title is corny as hell, but what else would you expect from someone who busts terrible haikus about good ol' Master Chief.

*Symphony of Death* is an experiment translating Halo 5 match events into interactive musical instruments using WebGL and Web Audio. I'm planning to explore a few different ways of doing this, but thought I would share the first one of these experiments: *Chordophone*.

**Links**

* [Website][site]
* [Chordophone][Chordophone]
* [Source][source]

(One quick note: I do work at Microsoft, but this was an entirely personal project. I generally follow Costanza's Worlds Theory regarding work and personal projects. All expression and work on this blog is purely my own, and you'll just have to take my word that I undertook this project because I thought it would be cool. And so it was.)

# Pull the String! Pull the String!
*Chordophone* is the first part of *Symphony of Death*. Inspired by a harp, this instrument allows you to "play" the kills of a *Halo 5* match.

Strings are drawn from the killer's locations to the victim's location in 3D space, shown as an interactive 3D model using WebGL.

{% include image.html file="example-one.png" %}

Strum the strings to play the instrument. Shorter strings (shorter kill distance) are higher pitched, while longer strings are lower pitched. Melee and grenade kills are not included in this particular experiment. The speed of strumming determines volume. Many kills overlap in 3D space, and you can rotate the view to play rather interesting chords. A few different types of matches are included to play around with.

{% include image.html file="example-two.png" %}

*Chordophone* uses a simple sine wave oscillator by default, which produces a rather eerie soundscape. But you can try out other oscillator wave types too, such as square waves or triangle waves, and there's a veritable orchestra of Midi instruments to play with too, everything from accordion to xylophone (some sounding better than others.)

{% include image.html file="example-midi.png" description="Lots or instruments..." %}

All kills currently use the same instrument, but one obvious next step to explore is mapping each *Halo 5* weapon to a different instrument, to create a true ensemble.


# Next
I know precisely nothing about music production or music visualization, but, even though the end result is kind of plain compared to some of the more splashy audio visualizations out there, I still think it is interesting. The world needs more data defined instruments if you ask me. Plus, strumming away at these strings of life and death makes one feel like a regular Moirai. What lovely music, our lives make. A symphony, known only to gods.

Feel free to submit a PR or drop a suggestion [over on Github][source] if you have any ideas for the project, and please report any issues you run into with the current implementation.

Look for more  *Symphony of Death* experiments in the future.


[spelunky]: /sketchy-keylogger/

[site]:http://mattbierner.github.io/Symphony-of-Death
[source]: https://github.com/mattbierner/Symphony-of-Death
[chordophone]: http://mattbierner.github.io/Symphony-of-Death/chordophone
