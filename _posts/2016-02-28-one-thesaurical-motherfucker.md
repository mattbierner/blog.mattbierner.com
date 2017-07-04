---
layout: post
title: "One Thesaurical Motherfucker"
date: '2016-02-28'
description: "Thesaurus all things!"
series: newspeak
titleImage:
    file: "logo.png"
---

{% include image.html file="logo.png" %}
<!--I like all my memes well aged. BTW, the conglomeration is a misrepresentation-->

Why can't I write like Herman Melville? This is a *very* pressing question.

You see, recently I decided to write a modern adaptation of *Moby-Dick*, and the results have been somewhat disappointing. See what you think:

> CHAPTER 135
> The Chase - Third Day
> 
> "Avast!", cried Ahab, as the Pequod plummeted towards the icy surface of Titan. Only the deafening "CHUG, CHUG, CHUG" of Queequeg's keytar could be heard over the roar of the failing anti-matter engines, and the music had worked the Oompa Loompas into an uncontrollable bloodlust. They covered the rigging, bedecked in full metaprogramming regalia, and eager to martyr themselves in the name of Wonkathulhu.
> 
> Meanwhile, Mr. Starbuck (played by a young Samuel L. Jackson), fresh off a third rail, lifted back his zebra head mask to reveal an expression of no little apprehension. If Mecha-Hitler (voiced by Orson Welles as Unicron) got Moby Dick up to 88,000 mph, it would be *Perl-Harbor* all over again, although this time, there could hardly be enough hyper-plutonium left in all of Narnia to outfit even a single battalion of Bracket-o-sauruses against the dreaded Sytnaxstaffel...

Clearly something is a little bit off. But I think I know the problem. 

Now, while I love me some Melville, god damn is he one thesaurical motherfucker, with word choices that border on Melville parody at times. If only I could could use big, highfalutin words like him, surely my writing would be much better! So I built a tool to help me do just that.

{% include image.html file="example.png" %}

[One Thesaurical Motherfucker][site] takes text and uses a thesaurus to lookup the longest synonym for each word, ignoring details such as part of speech or context. Here's an example:

**Input** - 224 characters

> Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.

**Output** - 516 characters

> Compulsory military service me Unacceptable person. Some years ago—never collective unconscious how de longue haleine precisely—having small indefinite quantity or no unregistered bank account in my unregistered bank account , and matter of indifference classificational to mental acquisitiveness me on geological formation, I higher cognitive process I would present no difficulties about a small indefinite quantity and have information about the infirm of purpose supporting character of the steady-state universe.

You'll note some rather interesting substitutions. Appropriately enough, I'm using [Moby as the thesaurus][moby] and the results can be surprising (and also surprisingly awesome):

* "wet" -> "predominance of Aquarius"
* "low" -> "Sir David Alexander Cecil Low"
* "old" -> "of marriageable age"
* "go" -> "methylenedioxymethamphetamine"
* "table" -> "horizontal projection"
 
Not a bug if you ask me.

# Other Options
The above example uses the longest possible synonym from Moby, many of which are actually phrases. If we instead choose the longest possible word, we get the following:

> Cock-a-doodle-doo me Undesirable. Some years ago—never shilly-shallying how long-continuing precisely—having inconsequentially or no prosperousness in my porte-monnaie, and good-for-nothing classificational to self-interestedness me on multilaterality, I accommodatingness I would circumnavigate about a inconsequentially and archbishopric the milk-and-water characterization of the superabundance.

For infinitely more fun, you can also use random synonyms:

> Dial me Declasse. Some years ago—never sthula sharira how covet precisely—having minute or no independence in my treasure, and nihility persnickety to absolute interest me on upkeep, I thought I would glide about a casual and pick out the sloppy at the least of the Far East.

> Quack me Undesirable. Some years ago—never descry how aim precisely—having one-horse or no gain in my command of money, and pushover proportionate to concern me on verge, I contemplative I would hydroplane about a lesser and make no mistake the juicy walk-on of the the blue planet.

> Animal noise me Expellee. Some years ago—never ba how languishing precisely—having smally or no handsome fortune in my life savings, and valueless classificational to leaning me on cheek, I tactfulness I would skid about a shoestring and accompany the swashy musical phrase of the Old World.

Or you can choose to use the shortest word:

> Ask me Ishmael. Some yrs ago—never ba how age precisely—having no or no fat in my bag, and dud hap to no me on hem, I bit I would fly about a no and do the wet by of the all

# Beyond Melville
The site includes a small set of excerpts from a variety of books to play around with – from *Moby-Dick* to *The Cat in the Hat* (which henceforth shall be known as *The computerized axial tomography in the balaclava helmet*) – or you can enter your own text.

As you may guess from this site's title, Kurt Vonnegut is another one of my favorite authors, even though his writing style is pretty much the opposite of Melville's. But the tool produces great output for his work too.

Here's the first sentence of *Breakfast of Champions*:

**Input** - 107 Characters

> THIS IS A TALE of a meeting of two lonesome, skinny, fairly old white men on a planet which was dying fast.

**Output** - 253 Characters

> THIS IS A COCK-and-bull story of a eyeball-to-eyeball encounter of double harness out-of-the-way, undernourished, fairly of marriageable age Patrick Victor Martindale White gentleman's gentleman on a terrestrial planet which was in articulo mortis fast.

Or, for a more Vonnegut feel, we can use the shortest synonyms:

> THIS IS A ALL of a go of ii lone, bony, fairly big boy hes on a Mars which was bad fast.

The *Breakfast of Champions* excerpt also includes part of *The Star-Spangled Banner*, which is similarly improved:

**Input** - 104 Characters

> O, say can you see by the dawn’s early light
>
> What so proudly we hailed at the twilight’s last gleaming,

**Output** - 214 Characters

> O, proportional representation can you have information about by the first brightening’s early electromagnetic radiation
> 
> What so proudly we hailed at the visible radiation’s not accept compromise bright and sunny,


# Source and Api
[Check out the website][site] if you just want to try improving some text. 

The source code for both the backend and the website is [on Github][src].

The site also exposes a Json api that you are free to use, with the Api documentation on Github.  


[site]: http://mattbierner.github.io/one-thesaurical-motherfucker/
[src]: https://github.com/mattbierner/one-thesaurical-motherfucker

[moby]: http://moby-thesaurus.org/