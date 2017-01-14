---
layout: post
title: "Urban Dictionary Neural Network"
date: '2016-03-13'
description: "Building an Urban Dictionary dataset and using it to train our future AI overlords"
series: "machine-learn-me"
---

Urban Dictionary. Do you know how many potential startup and project names this site has ruined for me?

I'll spend hours trawling Wiktionary for that perfect name—navigating Latin and Greek to derive a crafty play on words that oozes tech cachet—only to discover that my selection has already been appropriated by some Urban Dictionary chucklehead. And usually, the definition is less than flattering.

So, to avoid such pitfalls, I recently downloaded the [Urban Dictionary](http://urbandictionary.com/) dataset for easy offline access. I've also got a few projects in mind that will make good use of this data.

But I quickly realized that this dataset alone would not be enough. A word may not be in Urban Dictionary today, but what's to stop someone from defining it in the future? So, in the second half of this post, I try to train a computer to generate new Urban Dictionary definitions using a character level recurrent neural network.

**Links**

* [Urban Dictionary word list dataset][word_list]
* [Urban Dictionary complete entry dataset][entry-collector]

# Word List
Urban dictionary has about 1.4 million entries, each with multiple user provided definition. So, as a first step, I collected the entry names themselves. [You can find the resulting 16mb dataset on GitHub][word_list].

Entry names are stored alphabetically in twenty six text files, bucketed by first letter. There's one entry name per line, which makes further processing easy:

```bash
$ head -1000 data/a.data | tail -20
Abanoub
abansion
aba nuckie
ABAP
a bape and a year
Abaphany
Abaqoos
abar
Abarackan
Abarai
Abarai Renji
Abarat
a barbara
Abareh
abarenbou
Abarket
abarkheid
A Barkley
a barlow
a barney
```

The repo also includes a Python script that scrapes Urban Dictionary to collect entry names.

# Entires
I then looked up the top ten Urban Dictionary definitions for each entry. This dataset is too large for Github, so I've posted the result as four Google Fusion Tables:

* [Part One][part1]
* [Part Two][part2]
* [Part Three][part3]
* [Part Four][part4]

I've also [posted the script used to gather this data on Github][entry-collector].


# Recurrent Neural Network
After reading enough Urban Dictionary, it all starts blending together into a jumble of various orifices, male teenage angst, misspellings, bodily fluids, and slang. Offensive to some perhaps, but boring and predictable to me. Don't get me wrong, there are some truly great definitions to be found on Urban Dictionary, but I usually find the meta aspects of site to be far more entertaining.

The site definitely has its own culture concerning: what types of things are defined, formatting, fascinations and taboos, gender roles, and commonly used slang. There are also some interesting memes, such as the not insignificant number of entries for first names (almost always female first names) of the form:

> [stephanie](http://www.urbandictionary.com/define.php?term=stephanie)
>
> Stephanie is very nice and caring towards everyone and she always has a smile on her face no matter what and even though she doesnt know it she is very beautiful and smart.

Given such patterns, I thought it would be interesting to see if a computer could be trained to generate new urban dictionary entries. With around two million total definitions in the dataset, there's plenty of data to work with.

## Training
A [character level recurrent neural (RNN) network](http://karpathy.github.io/2015/05/21/rnn-effectiveness/) was a great fit for this experiment. While perhaps not the most effective text generation technique, it has two key advantages:

1. RNNs do not depend on the formatting or syntax of the input, and can learn on unstructured text easily.
2. Setting up and using an RNN requires basically zero effort. Just pipe a text file into [Torch-rnn][torch-rnn], let it work its magic, and sample the results.

I converted the entire data set into a single 500MB markdown file to train on. Here's an example of the markdown entry for the word ['splog'](http://www.urbandictionary.com/define.php?term=splog):

```
# splog
\#blog, \#spam, \#slog, \#splogger, \#vlog, \#ad, \#blam, \#bloglodyte, \#blog spam, \#comment spam

## splog
A unwanted post placed on a \[blog\] that is used for soliciting purposes. Like \[spam\], \[spim\], \[spat\], and \[spobile\], these messages contain links to websites featuring the usual array of forcibly advertised online services, such as pornography, credit repair, and prescription drug sales. [...]

## splog
A "fake" \[blog\] that offers only fake content and links. Often, splogs are promoting some other internet site. They are considered \[spam\].

[...]
```

Every entry includes a title, set of tags, and collection of one or more definitions. The definition title may use different casing than the entry title. Author, date, and thumbs up/down information was not included.

## Samples
I fed this markdown file into [torch-rnn][] running on an EC2 GPU instance (3 level neural network with 512 nodes). Although training is only 20% complete, the results are still entertaining. [Here's a list of 500 generated entry names](https://gist.github.com/mattbierner/63f17770e7d8cd56caf5).

It's pretty much what you'd expect. There's some nonsense words and actual english words on the list of course, along with a few that already have urban dictionary entries, but there's also a fair number of new words or phrases that are just begging for a definition ('suicide chicken' being one of the more reprintable).

The generated entries are a little rougher at this point, but should improve with further training. After only ten thousand iterations, the network was already generating english words more or less correctly, while it took a little longer to get the structure down. [Here's a 500000 character sample](https://gist.github.com/mattbierner/67d919db125f69ccdf1f).

The generated dictionary is full of non-sequiturs, poor grammar, and general crudity, which actually captures some of the Urban Dictionary spirit. The output is kind of like a direct window into the site's id.


# Next Time
Training up the neural network was neat, but it'd be a little too expensive to train to completion on EC2, so I'll leave this as an exercise for the reader. Anyways, I've got some other ideas for the dataset (**Update May 9, 2016**: check out [Vernacular][vernacular], which uses the data to find *Urban Dictionary* entries in classic texts.)

Hope that other people find some good uses for the dataset as well.



[word_list]: https://github.com/mattbierner/urban-dictionary-word-list
[entry-collector]: https://github.com/mattbierner/urban-dictionary-entry-collector


[part1]: https://www.google.com/fusiontables/DataSource?docid=1icBg7W83c7skjaUnGkQy26nre032_dLlIkekNTsy
[part2]: https://www.google.com/fusiontables/DataSource?docid=1SFfRIi8yWNt0Ah_QtcAa15rJxyoDcKjFKy5u2aBe 
[part3]: https://www.google.com/fusiontables/DataSource?docid=1xrq6sYCbhhEa0xSber_4yo-H8OxWegFXTeGxNvag
[part4]: https://www.google.com/fusiontables/DataSource?docid=1fuGPggoae6_j9wxA7rVJHU30nqtENJyXZLv3XHxp

[torch-rnn]: https://github.com/jcjohnson/torch-rnn

