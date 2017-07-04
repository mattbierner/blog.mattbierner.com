---
layout: post
title: "Post Mortem"
date: '2017-05-29'
description: "Visualizing how a person's Wikipedia changes after they die"
titleImage:
    file: "lead.png"
---

{% include image.html file="lead.png" href="https://mattbierner.github.io/post-mortem/" %}

At 6:37 a.m. on the 11th of January 2016, David Bowie was alive. One minute later at 6:38 a.m., David Bowie was dead. Well sort of.

Never being one for binaries, David Bowie spent the next twenty minutes or so trying to make up his mind, sometimes growing progressively more dead by the minute, sometimes just as alive and kicking as ever, and sometimes content to inhabit a spooky state somewhere between the two. Alas, by 7:20 the great David Bowie was well and truly dead, although some signs of life persisted for a few hours more. That's all if Wikipedia's record of the event is to be believed at least.

With all the notable deaths recently, I got to wondering how a person's Wikipedia page is revised after they die: what content is added or removed, and how does the language of the article change? What does the process of going from present tense to past tense look?

*Post Mortem* is a small experiment that explores this. It presents revisions of various people's wikipedia pages in the week following their deaths. The revisions are shown as inline diffs against the pre-death contents of the page, and you can scrub through the revisions to see how the page evolved over time.

**Links**

- [Site][site]
- [Source][source]

For example, Wikipedia first recorded Bowie's death at 6:38 a.m., but at that point his article was still entirely in the present tense. It took another few minutes before some parts of the article were moved into the past tense, and these changes were quickly reverted because his death hadn't been officially confirmed yet. The first day after Bowie died saw nearly 500 revisions in total, and its interesting to look at how the article after 7 days differs from the original. It's actually more similar than I expected.

The site currently has data for 12 subjects, everyone from George Harrison—who died less than a year after Wikipedia started—to Luc Coene, a Belgian economist who died in January 2017 and who I picked at random. The data also captures wikipedia's evolution. How deaths were handled between 2001 to 2004 is very different from those in the next five years or from today. Michael Jackson and Osama bin Laden both had the largest number of edits in the day after their deaths (over 700) although Jackson had the largest number of total edits (1500+) in the week following his death.

{% include image.html file="jackson-vs-bin-laden.png" %}

In other cases, it seems that dying is what made a person notable, or at least brought them to Wikipedia's attention. A great example is Dale Earnhardt, who died only a month after the Wikipedia project began. A page for him was [created by JimboWales](https://en.wikipedia.org/w/index.php?title=Dale_Earnhardt&oldid=246401) (founder of Wikipedia) four days after his death.

{% include image.html file="rick-husband.png" description="No disagreement, but that this comment was the entirety of [Rick Husband's](https://en.wikipedia.org/wiki/Rick_Husband) initial page is a mighty fine bit of Wikipedia" %}

Stepping through individual edits is also interesting. Although we can assume that David Bowie died sometime well before 6:38 a.m. 11th of January 2016, before that point he was still alive in our collective knowledge. As news of his death spread, people had to update their understanding of the world, moving David Bowie from the present tense to the past tense. This took time and many iterations. Unlike a book or news article, Wikipedia is a living document that captures some elements of the diffusion of knowledge among humans.

{% include image.html file="bowie.gif" %}

And although rather morbid, exploring the data is a good time. [Give *Post Mortem* a try][site] and let me know if you stumble across anything good. The source for the website, along with the scripts used to collect and process the data, are all [on Github][source] in case you want to check out how other people's Wikipedia pages evolved after their deaths.


[site]: https://mattbierner.github.io/post-mortem/
[source]: https://github.com/mattbierner/post-mortem