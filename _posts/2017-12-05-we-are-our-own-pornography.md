---
layout: post
title: 'We Are Our Own Pornography'
description: Modded reality pornography
titleImage:
    file: 'title.png'
date: '2017-12-05'
series: modded_reality
---

*We Are Our Own Pornography* is a short film project that explores technology, sexuality, and pornography. In the film, two actresses wear VR headsets that stream video from a camera mounted over a bed. The overhead camera is the same one that you look through in the video. Using this setup, they then act out a fairly standard "lesbian" pornographic scene. The video below is a stylized presentation of that scene.

<figure class="video">
    <video id="video1" controls poster="/content/2017-12-05-we-are-our-own-pornography/firework-poster.png" preload="none"></video>
</figure>

The film features [Juliette March](https://twitter.com/JulietteMarch) and [Riley Reyes](https://twitter.com/RileyReyXXX) and was produced with [Anatomik media](http://anatomikmedia.com). They really did most of the work here, I just provided the frame idea and handled technical support.

The music is *You are a Firework* by [GLOOMCVLT](http://gloomcvlt.bandcamp.com/).

<hr class="bullets">

This continues an exploration of what I'm calling *modded reality*, which looks at using technology to change or remix one's sensory experience of the world. This project looks at technology's role in sexual experiences and in pornography itself, as well as concepts such as the hyperreal quality of sex in media.

[A follow-up post](/reflections-from-hyperreality/) covers the reasons why I created the piece, as well as my uncertainty about the creation and presentation of it. That post also contains a more traditional cut of the film, which captures many of the same ideas as the stylized edit but which I also felt requires a bit more context.

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
function loadHlsVideo(elementId, source) {
    var video = document.getElementById(elementId);
    if (Hls.isSupported()) {
        var hls = new Hls({autoStartLoad: false});
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            var loaded = false;
            video.addEventListener('play', function(){
                if (!loaded) {
                    loaded = true;
                    hls.startLoad(-1);
                }
            }, false);
        });
    } else {
        // Try using native
        video.setAttribute('src', source);
    }
}

loadHlsVideo('video1', 'https://d284bya5kxduqr.cloudfront.net/firework/index.m3u8');
</script>