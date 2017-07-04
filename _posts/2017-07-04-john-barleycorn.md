---
layout: post
title: 'The John Barleycorn Challenge'
date: '2017-07-04'
description: 'Visualizing the text of John Barleycorn by Jack London as a drinking game'
image:
    file: 'top.png'
---

{% include image.html file="top.png" href="https://mattbierner.github.io/john-barleycorn-challenge/" %}

**Links**

- [Try it out][site]
- [Source](https://github.com/mattbierner/john-barleycorn-challenge)

*The John Barleycorn Challenge* is a playful look at Jack London's writing about alcoholism in his novel [*John Barleycorn*](https://www.gutenberg.org/ebooks/318). The project examines what would happen if one were to treat the text of *John Barleycorn* as a drinking game, taking a dose of alcohol every time the words "John Barleycorn" appear in the text. Spoiler alert: it usually does not end well.

Now while I love *Jack London*—and while I certainly don't with to make light of alcoholism—I do enjoy looking at text from different perspectives, be it [translating *Moby-Dick* to into color][moby-dick] or plotting the [number of exclaimation points in Upton Sinclair's *The Jungle*](). And reading *John Barleycorn*, after a few chapters I began to notice just how often the words "John Barleycorn" appear. "Hmm," thought I, "woundn't it be delciously ironic if I were to take a shot of whiskey every time our good friend here drops in for a visit?"

It turns out that "John Barleycorn" appears some 212 times in the novel's 65,000 or so words, with a fairly even distribution throughout—although there certainly are a few clusters and dry spells. Using [the The John Barleycorn Challenge website][site], you can explore how just such a drinking game would play out. The site allows to configure the scenario in a few of different ways, including:

- Reading rate
- Reader weight and sex
- Type of alcohol

I based the blood alcohol content calculations on [this paper from the National Highway Traffic Safety Administration](https://web.archive.org/web/20040202204141/www.nhtsa.dot.gov/people/injury/alcohol/bacreport.html). The current model has a few key limitations:

- Uptake is instantaneous. No time is allowed for drinking or for the body to begin absorbing the alcohol.
- Each drink is processed independently by the body.
- Metabolic rate is constant. In the model, alcohol is metabolized at a linear rate.
- Reading rate is fixed. This may not be a realistic assumption, especially at higher BAC levels.

Still, even though the model is greatly simplified, it's probably best not to try the whiskey version of the challenge at home, or really anywhere for that matter unless you are moridly obease or content plodding along at a leasurely 10 words per minute. Normal readers should stick with sips of wine or swigs of beer.

[site]: https://mattbierner.github.io/john-barleycorn-challenge/
[moby-dick]: //moby-dick-or-whale-not-now-man-then-ship-sea-more-ahab
[moby-dick]: //the-jungle