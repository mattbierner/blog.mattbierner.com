---
layout: post
title: Scrubspace
description: Exploring audio as a 2D space you move through to play it back
titleImage:
    file: 'title.png'
links:
  - title: "Try the Scrubspace web app"
    url: "https://scrubspace.mattbierner.com/"
---

[Scrubspace][app] is an experiment in sound as physical space. Audio is mapped into a 2D space and played back by moving a playhead through this space. The rate and direction that the playhead moves through the audio space influences not just which parts of the audio are sampled, but also how fast or slow the audio is played at.

This project was inspired by thinking about what truly spatial audio would be like. When people use the term today they are talking about audio that's played back more or less like normal, but making it sound like the different tracks/parts of the audio are positioned in 3D space around you. Sometimes this is done with physical speakers and sometimes it's simulated.

Scrubspace works very differently. Instead, each part of the sound is mapped to a spot in a 2D space. When you move through this space it plays backs the part of the audio at the points you move through. Move slowly and audio is also played back slowly. Move quickly, and the audio is played back rapidly. You can also replay the same part of the audio by moving forward, then moving back, then moving forward again.

{% include video.html attrs="controls loop" file="scrubspace-forward-and-back.mp4" poster="scrubspace-forward-and-back-poster.jpg" description="Manually moving the playhead (blue dot) forward and back to resample parts of the song. Most demos on this page use 'Maple Leaf Rag' by Scott Joplin. " %}

Some old audio players (such as tape decks or turntables) used to work more like this, albeit in 1D. Scrubbing rapidly though a song would play it back rapidly (typically at a high pitch too). Sometimes scrubbing in reverse would even play the audio in reverse too. Unfortunately this little bit of creative possibility has been smoothed down in modern audio app UIs where the timeline is only for jumping to different points in the song, not for manipulating the playback itself. 

Expanding the idea of scrubbing to 2D opens up new possibilities. For example, if you move diagonally through a song space it will play back at 0.7x speed (you are still moving 1x diagonally but the forward component for the sampling is 0.7x). If you make a smooth 180deg turn in a half circle shape, the song will gradually slow to a crawl at the top of the song where you are moving completely parallel to the sound waves, before slowly ramping back up in reverse as you start moving more and more perpendicular to them.

{% include video.html attrs="controls loop" file="scrubspace-variable.mp4" poster="scrubspace-variable-poster.jpg" description="Creating a path so that the playhead moves at variable speed through the audio. The number in the top right corner shows the effective playback speed." %}

{% include video.html attrs="controls loop" file="scrubspace-crazypath.mp4" poster="scrubspace-crazypath-poster.jpg" description="A more complex curving path with variable speeds and reversals. This also disables pitch preservation" %}

The web app includes a few other features for exploring audio as physical space:

- You can also place multiple audio files on the same canvas so that the playhead samples from all of them at the same time

- Move the playhead with arrow keys or draw a path to follow through the audio file.

- Toggle pitch preserving on/off. This is on by default and tries to maintain the pitch at variable speeds. Sometimes turning it off can be fun too though

- Switch between rectangular and circular audio spaces. With circular projection, the start of song is near the center and the end is at the outer edge. Moving across the circle in a straight line shifts the playback speed as the rate you move across the waves changes    

{% include video.html attrs="controls loop" file="scrubspace-mix.mp4" poster="scrubspace-mix-poster.jpg" description="Sampling from multiple audio sources in the same canvas. Each one can be moved through and sampled at a different speed." %} 

It's fun tracing out different paths through the audio and seeing what you can create. Definitely a fun and novel way to sample and think about audio too. 

Give [Scrubspace][app] a try and let me know what you think! I've included a few basic songs but you can also load up and explore your own audio files. Maybe next I'll try extending this concept to real world physical space too.

[app]: https://scrubspace.mattbierner.com/