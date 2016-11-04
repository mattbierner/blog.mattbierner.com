---
layout: post
title: "{{dubious}}"
date: '2016-03-07'
description: "Scraping Wikipedia to find all sentences marked: 'dubious', 'lopsided', and the infamous 'citation-needed'"
---

Over the years, I've discovered that hidden beneath Wikipedia's encyclopedic veneer lies some of the best comedy on the internet: a quirky brew of detachment and deadpan that is unintentionally hilarious on so many levels.

{% include image.html file="eating.png" description="I love Wikipedia's ability to make even activities like 'eating' sound completely alien.<br>And those captions!" %}

Vandalism ain't got nothing compared to Wikipedia's official content.

I previously looked at the often entertaining ways links are used in articles with *[Just the links][just_the_links]*. But every so often, I'll come across a single sentence that captures everything that makes Wikipedia awesome. And I recently unearthed such a gem while browsing Wikipedia's entry on *[Low Comedy][low_comedy]* (don't judge):

> For example, due to the overdoing of sitcoms in the past, it is now considered shrill, vulgar, low society where everyone talk-screeches in some sub-human, mock-sophisticated language of incessant insult.<sup>\[4\]\[dubious\]</sup>

The entire article is full of amazing (for further entertainment, check out *[Low Culture][low_culture]* too and some of its links.)

Now, while that excerpt is great on its own, what really struck me was `[dubious]`. Just imagine: somebody wrote the above, and then an editor came along, read that, and [added `[dubious]`](https://en.wikipedia.org/w/index.php?title=Low_comedy&diff=prev&oldid=602505195). And the word *dubious* is just *so* Wikipedia too. 

But this got me wondering: where else is `[dubious]` used on Wikipedia? The query `hastemplate:"dubious"` answers the question, but that requires a lot manual browsing. So I decided to write a script to extract every sentence marked `[dubious]` on Wikipedia.

The resulting script is [on Github][src], along with a set of initial results. Even in this condensed form, it's far too much data to fully read through, but here's a taste of what's been found so far.

# \{\{dubious\}\}
I extracted every [`[dubious]`](https://github.com/mattbierner/dubious/blob/master/out/dubious/dubious.md) usage, more than 4300 examples!

> The main drawback of U-235 is its scarcity.<sup>\[dubious\]</sup> ([Flibe Energy](https://en.wikipedia.org/wiki/Flibe_Energy))


> Montana was home to creatures like dogs<sup>\[dubious\]</sup> and titanotheres. ([Paleontology in Montana](https://en.wikipedia.org/wiki/Paleontology_in_Montana))


> Within mainstream economics, economic bubbles, and in particular real estate bubbles, are not considered major concerns.<sup>\[dubious\]</sup> ([Real estate bubble](https://en.wikipedia.org/wiki/Real_estate_bubble))


> Five people can easily lift one person when those five people are tricking their minds into thinking that the person is light in weight.<sup>\[dubious\]</sup> ([Light as a feather, stiff as a board](https://en.wikipedia.org/wiki/Light_as_a_feather,_stiff_as_a_board))


> These homemade approaches allow greater control over flavoring and exposure to PFOA, but have a chance of leaving some corn kernels unpopped due to randomness of the microwave radiation distribution in a microwave.<sup>\[dubious\]</sup> ([Microwave popcorn](https://en.wikipedia.org/wiki/Microwave_popcorn))


> He had lost his left big toe to frostbite.<sup>\[dubious\]</sup> ([Dale Abenojar](https://en.wikipedia.org/wiki/Dale_Abenojar))


> Whatever the cause, the building would fill with radioactive smoke along with a real probability that molten uranium metal would come pouring out of the bottom of the furnace.<sup>\[dubious\]</sup> ([Fernald Feed Materials Production Center](https://en.wikipedia.org/wiki/Fernald_Feed_Materials_Production_Center))

The script probably misses a lot of edge cases, but it returns something reasonable for most articles.

While Wikipedia's markup is very human writable, it unfortunately does not produce easy to consume semantic information. For example, actually knowing what part of text is supposed to be marked `[dubious]` would be helpful.

# \{\{lopsided\}\}
After hacking together the initial script, I realized that the same technique could be easily applied to [similar inline tags][inline_cleanup]. Some new favorite, if sadly underused, tags are [lopsided][] and its [friends][opinion]:

> It comes from the neighboring mountains, and refreshes souls<sup>\[lopsided\]</sup> and bodies. ([Cali](https://en.wikipedia.org/wiki/Cali))


> Certainly,<sup>\[lopsided\]</sup> bargains will not be found in most of these malls. ([Cali](https://en.wikipedia.org/wiki/Cali))


> The people of Hunza are highly educated, hospitable and well-mannered.<sup>\[peacock-term\]</sup>


> The ideal sugar cream pie is supposed to be like Santa Claus in that it should shake "like a bowl full of jelly."<sup>\[opinion\]</sup> ([Sugar pie](https://en.wikipedia.org/wiki/Sugar_pie))


> Conversely, perhaps the Japanese themselves can take the opportunity to re-evaluate some of the xenophobic tendencies associated with the Japanese.<sup>\[lopsided\]</sup> ([Japan foreign marriage](https://en.wikipedia.org/wiki/Japan_foreign_marriage))


> In kot adu the most beautiful shop is "baba bashir ka kademi kulfa" as well as "bashery di karhi".<sup>\[opinion\]</sup> ([Kot Addu City](https://en.wikipedia.org/wiki/Kot_Addu_City))

The extracts from [Converted barn](https://en.wikipedia.org/wiki/Converted_barn) are also pretty great:


> Successful conversions can and have taken place.<sup>\[opinion\]</sup>


> The most successful residential barn conversions result from a combination of factors including a careful choice of barn.<sup>\[opinion\]</sup>


# \{\{citation-needed\}\}
`citation-needed` is probably the most well known of these Wikipedia tags, and this tag is used on over two hundred thousand pages. I've only [extracted around ten thousand usages so far][citation-needed], but here's a short selection:


> Most of the population buys the ice creams with standard cone or waffle cone.<sup>\[citation needed\]</sup> ([Ice cream van](https://en.wikipedia.org/wiki/Ice_cream_van))


> For comparison, the entire Milky Way galaxy output is estimated at 5 × 1036 joules per second (watts).<sup>\[citation needed\]</sup> ([Messier 87](https://en.wikipedia.org/wiki/Messier_87))


> Utopia is a mostly suburban-like neighborhood with tree-lined streets.<sup>\[citation needed\]</sup> ([Fresh Meadows, Queens](https://en.wikipedia.org/wiki/Fresh_Meadows,_Queens))


> At first, he was portrayed as a bit of a dupe who was always foiled by the Cookie Crook, but eventually it was decided that having a criminal constantly thwarting a police officer was sending the wrong message to kids.<sup>\[citation needed\]</sup> ([Cookie Crisp](https://en.wikipedia.org/wiki/Cookie_Crisp))


> There were three Johnsons ("Pear Loving Johnson", and "Long Toes Johnson"),<sup>\[citation needed\]</sup> nicknames were commonplace, and with Johnson's show of eating the liver, he received his name. ([Live Eating Johnson](https://en.wikipedia.org/wiki/Liver-Eating_Johnson))


> No ball playing" signs have been put up in the fields.<sup>\[citation needed\]</sup> ([Landmarks of Hoboken, NewJersey](https://en.wikipedia.org/wiki/Landmarks_of_Hoboken,_New_Jersey))


> A nanomorph is arguably the robotic ultimate in versatility, maybe even in power.<sup>\[citation needed\]</sup> ([Nanotechnology in fiction](https://en.wikipedia.org/wiki/Nanotechnology_in_fiction))



# Pure Wikipedia Extract
[Check out the script][src] if you want to try extracting [some of these tags][inline_cleanup] from Wikipedia.

Here's the full results from a few more tags too:

* [Dubious](https://github.com/mattbierner/dubious/blob/master/out/dubious/dubious.md)
* [Lopsided](https://github.com/mattbierner/dubious/blob/master/out/lopsided/lopsided.md)
* [Citation Needed](https://github.com/mattbierner/dubious/blob/master/out/citation needed/citation needed.md)
* [How?](https://github.com/mattbierner/dubious/blob/master/out/how/how.md)
* [buzz](https://github.com/mattbierner/dubious/blob/master/out/buzz/buzz.md)
* [loaded term](https://github.com/mattbierner/dubious/blob/master/out/loaded term/loaded term.md)
* [peacock-term](https://github.com/mattbierner/dubious/blob/master/out/peacock-term/peacock-term.md)
* [Undue](https://github.com/mattbierner/dubious/blob/master/out/undue inline/undue inline.md)
* [Opinion](https://github.com/mattbierner/dubious/blob/master/out/opinion/opinion.md)
* [disputed inline](https://github.com/mattbierner/dubious/blob/master/out/disputed inline/disputed inline.md)
* [according to whom](https://github.com/mattbierner/dubious/blob/master/out/according to whom/according to whom.md)
* [weasel-inline](https://github.com/mattbierner/dubious/blob/master/out/weasel-inline/weasel-inline.md)

It's interesting to see what articles have the most of each tag, and it's also a good way to find entertaining Wikipedia pages too.



[just_the_links]: /just-the-links

[low_comedy]: https://en.wikipedia.org/wiki/Low_comedy
[low_culture]: https://en.wikipedia.org/wiki/Low_culture#Mass_media

[citation-needed]: https://raw.githubusercontent.com/mattbierner/dubious/master/out/citation%20needed/citation%20needed.md
[opinion]: https://github.com/mattbierner/dubious/blob/master/out/opinion/opinion.md
[lopsided]: https://github.com/mattbierner/dubious/blob/master/out/lopsided/lopsided.md


[src]: https://github.com/mattbierner/dubious

[inline_cleanup]: https://en.wikipedia.org/wiki/Category:Inline_cleanup_templates