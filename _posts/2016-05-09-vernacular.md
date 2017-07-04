---
layout: post
title: "Vernacular"
date: '2016-05-09'
description: "Finding Urban Dictionary entries in text"
series: newspeak
titleImage:
    file: "graph.png"
---

> My life fades. All that remain are memories. I remember a time of language... of text... of words. Gone now...<br><br>
> The words turned against us. Slowly at first—a double entendre here, a bit of innuendo there—but when the Soviets launched *Urban Dictionary* in 1991, things went exponential. More and more words became saddled with alternative meanings and people started to forget the old definitions all together. Day-to-day communication became stilted and awkward. Misunderstandings. Fear. Chaos. Governments sought to maintain order by cordoning off a few thousand safe words. These too fell. And then, nothing remained.<br><br>
> The wasteland stretches before me. Even my internal monologue grows more corrupted by the day. This world's only got one shot left. The year is 1999. *This* is the future!

Faux-eighties movie intros aside, this so-called *phrasing singularity* is probably in my top eight most feared apocalypse scenarios. When I think of all the good, innocent words that have been corrupted and debased over the years, I can't help but feel that we are quickly approaching a tipping point, after which all normal communication will be impossible; a *Kessler syndrome* of vulgarity if you will. 

{% include image.html file="graph.png" %}

Personally, I blame Shakespeare for inventing English to begin with, and much preferred the good old days, when everyone [talk-screeched at each other in some sub-human, mock-sophisticated language of incessant insult](/dubious-wikipedia/).

So recently, I created a tool called *Vernacular* to monitor the spread of this disease. The project builds on my work [downloading an *Urban Dictionary* dataset][ud-data] and is similar in spirit to *[One Thesaurical Motherfucker][otm]*, which transformed text using synonyms. Let's take a look.

**Links**

* [Vernacular][site]
* [Interactive Version][interactive]
* [Source][src]

# Vernacular
*Vernacular* is a tool that takes text and finds all occurrences of *Urban Dictionary* entries in that text. Simple. This often alters the meaning of the original text in ways the author (probably) never could have imagined. 

{% include image.html file="for-christs-sake.png" %}

{% include image.html file="go-with-you.png" %}

Sure, it's rather juvenile taken at face value, but language is fluid, and I argue that the meanings *Vernacular* introduces are no less valid than the author's intent. The definitions come from a dictionary after all, and a dictionary written by *real* people at that, instead of highfalutin academics in their ivory towers.

## Excerpts
The [main page][site] showcases *Urban Dictionary* entries found in a few classical texts, everything from *The King James Bible* to *Memoirs of Fanny Hill*. Only matches of three or more words are shown, which limits the quantity and quality of matches considerably, but still produces some entertaining results.

Take some of Jane Austen's work for example. Books like *Pride and Prejudice* are ridiculous and rather inconsequential, but I love 'em. Seriously. Reading these books today in the age of *Tinder*, it's tempting to imagine ourselves much more evolved and unconstrained than those quaint Georgian era folk, with their petty concerns over elopements, but I can almost guarantee that 200 years from now, people will look back on the early 21st century with similar scoffs and sneers.

Let's see how modern society improves *Pride and Prejudice* without even changing a word. Here's one example match:

{% include image.html file="in-that-way.png" %}

(The [Wikipedia entry for "double entendre"](https://en.wikipedia.org/wiki/Double_entendre) is pretty great BTW, especially when it attempts to explain the examples in amazingly awkward detail.)

The definitions also took a turn for the meta in a few cases:


{% include image.html file="turn-about-the-room.png" %}

{% include image.html file="come-upon-the-town.png" %}

Interesting overall, but only looking at three plus word matches misses a lot of potential.


## Interactive
I also put together a [simple tool][interactive] that allows you to vernacularize any text. This tool finds all matches in the input text, including single word matches. Upwards of seventy five percent of most text ends up getting improved by this process.

{% include image.html file="huck-finn.png" %}


The definitions are a fun mix of snark, vulgarities, and self-awareness, with a number of fairly reasonable definitions thrown in for good measure. It's fun to paste in famous speeches or other well known bits of text, and see all the words that light up.

{% include image.html file="interactive.png" %}

{% include image.html file="jfk.png" %}


# The Future Has Already Been Written
Well there's *Vernacular* for you. Check out [the site][site] to explore some classic texts, or try your hand at recontextualizing and modernizing some text of your own. The [source][src] also provides some simple tools for working with larger texts.

Clearly a good next step would be to build a chat or voice bot that monitors conversations for these types of double entendres and posts something witty when one is detected. And I've got at least one more small experiment planned with the *Urban Dictionary* data too.

There is no meaning but what we make.


[site]: http://mattbierner.github.io/vernacular/
[interactive]: http://mattbierner.github.io/vernacular/interactive

[src]: https://github.com/mattbierner/vernacular
[otm]: /one-thesaurical-motherfucker
[ud-data]: /urban-dictionary-neural-network/
