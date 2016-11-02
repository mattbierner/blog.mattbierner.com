---
layout: post
title: The Jungle!!!!!
date: '2015-08-09'
---
History remembers Upton Sinclair's *The Jungle* as a vivid exposé on literal and figurative sausage making, a piece that shocked the nation and led to the passage of the Pure Food and Drug Act. But all that happens in the first half of the novel, no one remembers the second half. And that is probably for the best.

Rereading *The Jungle* recently, I again found the second half almost unbearable, especially the later chapters which devolve into clumsy, thinly-veiled socialist propaganda. In fact, some parts are so bad that they made me question if the first half of the novel had actually been any good.

Trying to power through the particularly absurd Master Frederick chapter, I also noticed a trend: as the quality of *The Jungle* decreases, the number of exclamation points increases. Could this be it? The missing link? Empirical proof that the exclamation point, that most vile of punctuators, is a corrupting agent of rhetorical debasement?

Yes!

> **Publisher** - I was just reading your final edit of *The Jungle*, and um, there seems to be an inordinate number of exclamation points.

> **Sinclair** - Well, I felt that the writing lacked certain emotion and intensity.

> **Publisher** - I see. "The hall was so warm, and his seat was so comfortable!" Exclamation point?

> **Sinclair** - Well, yeah, you know... it was a VERY comfortable bench.

So today, I humbly present my discovery of a inverse correlation between exclamation point density and novel quality in *The Jungle*. You can find the simple source code used in this project [on GitHub][source]. 

# Occurrences
*The Jungle* features an astounding 801 exclamation points in its 31 fun filled chapters. For comparison, the same text has 5401 periods and 519 question marks. Assuming that every sentence ends with a period, question mark, or exclamation point, this means that around 13.5% of all sentences in the *The Jungle* end with an exclamation point (some exclamation points do occur inside of quotes though). And unlike that late master of expressive writing, the prepubescent texter, Sinclair restrains himself to a single exclamation point at the end a sentence, making this statistic all the more impressive!

I was curious to see where these 801 exclamation points occurred in *The Jungle*. Would exclamation point density correlate with the quality of the book? 

## Tokenization
I grabbed the [source text off Project Gutenberg][text], stripped out the preface and postface, and used a very simple regular expression to tokenize the text into words and exclamation points.

```python
import re
import sys

def tokenize(file):
    return re.findall('(\w+|\!)', file.read())

print tokenize(sys.stdin)
```

Certainly not perfect, but it gets the job done.

## Plotting
My first analysis was to plot where exclamation points occur in the book, using word index as the time.

```python
def occurrences(tokens):
    return [i for i, x in enumerate(tokens) if x == '!']
```

{% include image.html file="occurrences.png" %}

Ahhh, much as expected. The first half of *The Jungle*, up to the 75,000 word mark, has a fairly constant exclamation point rate. And the first half is by far the best half, with Sinclair introducing the main characters, relating delicious nuggets on the inner operations of Packingtown, and preparing the reader for the great fall that we know is going to come.

Getting into the second half of the book there are three exclamation point speed ups, starting around eighty thousand, one hundred thousand, and one hundred and twenty thousand word marks. In the second half, AKA *The Passion of the Jurgis*, Sinclair uses the titular Jurgis to explore all levels of corruption and misery in Packingtown, with a detour or two into some ham-fisted socialist propaganda. Needless to say, many a shark is jumped and the quality of the book suffers accordingly. 

Thus, this chart is proof of an inverse correlation between exclamation point density and novel quality. As the rate of exclamation points goes up, the narrative quality similarly goes down. If Sinclair had continued adding many more chapters to *The Jungle*, we can extrapolate that the text would have devolved into nothing but the word "Jurgis" and exclamation points.

{% include image.html file="jurgis--jurgis--1.png" %}

# By Chapter Analysis
There are degrees of shittiness to the second half of *The Jungle* though. Hobo Jurgis or Tramp Jurgis is much more palatable than Socialist Jurgis or Boss Jurgis. And some chapters are just astoundingly bad, such as the insufferable chapter 24, wherein the soulless husk formally known as Jurgis encounters the young, wealthy, and very drunk Master Frederick. 

But chapter 27 trumps it all, with Tramp Jurgis learning that not only is Marija a callous whore (and BTW callousaur is a AMAZING dinosaur name) but also that Little Stanislovas was eaten by rats. An aside: the phrase, "eaten by rats" is similar to "jumping the shark", and can be used when something terrible happens to a character for stupid, unrealistic reasons invented by the author and entirely unrelated to plot or character development. Basically, having a character "eaten by rats" causes the reader to think that the author is an asshole.

And let's not even talk about chapters 28 onwards, which give up all novelistic pretense for glibbering socialist speeches. Could exclamation point density similarly be used to identify these highlights of awfulness? Let's find out.

## Counts
Given that much of *The Jungle* was publish serially, it makes sense that each chapter has a fairly constant number of words.

{% include image.html file="Words-per-chapter.png" %}

And looking at just the raw exclamation point count per chapter, there is a pretty clear trend.

{% include image.html file="points-per-chapter.png" description="The Jurgis Mountains were formed around seventy thousands words ago by the collision of the Journalism and Socialism tectonic plates." %}

## Rate
To compensate for the different chapter lengths, I also computed the exclamation point density of each chapter; that is, what percentage of words in a chapter are exclamation points. 

{% include image.html file="rate-per-chapter.png" %}

Things start off at a reasonable 0.3% exclamation point rate, with one out of every 330 words an exclamation point, before spiking at chapter 15 and again at chapters 18 and 24. With text like this its not hard to see why:

> Yes; it had been gray and now it was yellow! The trimmings around the windows had been red, and now they were green! It was all newly painted! How strange it made it seem! - The Jungle, Chapter 18

Chapter 18 and 24 in particular reach exclamation point rates of around 1.7%, with one out of every 60 words an exclamation point. Impressive!

## Removing Quotes
But not all exclamation points are created equal. Exclamation points in quotes are somewhat more acceptable, whereas exclamation points in normal text are almost always excessive. That was a pretty clear problem with my initial approach, but accounting for quotes turns out not to effect the results all that much.

For the second pass, I removed all quoted text. After doing this, there were  457 exclamation points left. After taking the density of each chapter, we end up with a familiar story:

{% include image.html file="noquote-rate.png" %}

Sadly, by far the biggest change is in chapter 24, which drops to almost zero exclamation points from its previous high of like 100. The rate of Chapter 17 also increases once all the quotes are removed, but chapter 18 and 28 still are clear outliers.

# Conclusion
This work conclusively demonstrates an inverse correlation between exclamation points density and quality of *The Jungle*. The exact nature of this relationship is still unclear. Did an overabundance of exclamation points cause the drop in quality of *The Jungle*'s second half, or did the weakened second half allow in more exclamation points? An interesting subject for future investigation.


[source]: https://github.com/mattbierner/The-Jungle-Exclamation-Point

[text]: http://www.gutenberg.org/ebooks/140