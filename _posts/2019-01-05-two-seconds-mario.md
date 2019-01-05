---
layout: post
title: "Two Seconds of Super Mario Bros. 3"
description: "Printing out every operation executed during two seconds of *Super Mario Bros. 3* for NES gameplay"
titleImage:
    file: 'title.jpg'
---

{% include image.html file="binders.jpg" %}

This is two seconds of *Super Marios Bros. 3* for the Nintendo Entertainment System. Each three inch binder contains a complete list of operations executed by the system's CPU over forty frames of gameplay. The operations were collected in stage 1-1.

{% include image.html file="binders-2.jpg" %}
{% include image.html file="page.jpg" %}

<h3 style="text-align: center;">Quick stats</h3>

<ul class="quick-stats">
    <li><b>2</b> seconds</li>
    <li><b>120</b> frames</li>
    <li><b>2950</b> 8.5 x 11 inch pages, double sided printing</li>
    <li><b>4 columns</b> of operations per page</li>
    <li><b>6pt</b> font for the operations</li>
    <li><b>1475</b> sheets of paper</li>
    <li><b>3</b>, three inch binders</li>
    <li><b>561</b> cubic inches of paper (8.5 x 11 x 6)</li>
    <li><b>1,124,949</b> operations</li>
    <li>Around <b>9750</b> operations on average per frame</li>
    <li><b>50</b> different instructions</li>
    <li><b>LDA</b> was the most common instruction</li>
    <li><b>BVS</b> was the least common instruction</li>
</ul>

<style>
    .quick-stats {
        text-align: center;
        list-style: none;
        padding-left: 0;
    }

    .quick-stats li {
        margin-bottom: 0.6em;
    }
</style>

{% include image.html file="title.jpg" %}

{% include image.html file="height.jpg" description="" %}

The execution was collected using the FCEUX emulator. The [trace logger](http://www.fceux.com/web/help/TraceLogger.html) captured the executed instructions, while a very simple Lua script captured screenshots for each frame. This raw data was then converted into an html book using some simple python scripts. From there, the html was converted into [a pdf](https://github.com/mattbierner/two-seconds-super-mario-bros-3/blob/master/two-seconds-mario.pdf) and printed on good old fashioned paper.

You can find the scripts, data, and design files for the book [on GitHub][src].

{% include image.html file="page-2.jpg" %}

This project shows the volume of operations that even old CPUs could churn through. For modern games, even a single frame would undoubtably generate an order of magnitude more operations and be quite unprintable (especially if you get into GPUs). While leafing through the pages, it's also interesting to think that these simple operations are what bring Mario to life and underlie the familiar game world we all know.

{% include image.html file="page-frames.jpg" %}

I've listed the book (or rather binders) [on eBay](https://www.ebay.com/itm/Two-Seconds-of-Super-Mario-Bros-3-Book-of-all-operations-in-2sec-NES-gameplay/153329056354). It's one of kind; I have no plans to make another. A book of the operations used to run *Super Mario Bros. 3* is just one of those things I felt should exist. Now it does. If the thing does sell, any proceeds will be donated to the [Electronic Frontier Foundation](https://www.eff.org).

The scripts and tools used to create the book are documented [on GitHub][src] in case you want to print your very own Mega-Man-azine or Castlevan-ovella.

[src]: https://github.com/mattbierner/two-seconds-super-mario-bros-3