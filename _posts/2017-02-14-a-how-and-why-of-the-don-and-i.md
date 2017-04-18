---
layout: post
title: "A How and Why of The Don and I"
date: '2017-02-14 00:00:01'
description: "Self-indulgent musings on *The Don and I*'s creation and context"
---

I've spent a lot of time considering how to respond to the Donald Trump Presidency, and the first fruit of this is [*The Don and I*][don]. In case it wasn't clear from the piece's somewhat flowery presentation, the experiment involved hooking sex toys up to Donald Trump's twitter account in order to translate his tweets into love / sexual stimulation. A splendid opening act if you ask me.

While working on *The Don and I* though, I realized that it was not something that could just be tossed out there in today's climate without additional comment. Sex and Donald Trump are hardly the least contentious of subject matters, and not everyone will like this piece's presentation or message. This is fine. I don't ask that you like my work.

The reason for this follow-up document is only to add some context and perhaps check some degree of oversimplification. I feel that *The Don and I* explores some very important ideas and concepts, and by documenting why I believe this to be so, maybe—just maybe—a few people will see what I was trying to get at. The windmills beckon, so away we go!

# Casting and Hardware
But before racing off full tilt in pursuit of any conceptual giants—and even before discussing the implementation of the experiment itself—a short digression on casting. For a performance such as this, who should play Donald Trump's cyber lover?

One line of thinking calls for a female lead, playing off Donald Trump's misogyny and alpha male persona. It's a good argument, and one that I briefly entertained. However, the prospect of actually asking a friend, or anyone else really, to participate in *The Don and I* was not appealing. In my mind, the conversation always went something like:

> Oh hey, how's your day?
> 
> Um uh. Um uh. Oh wow! Um uh. 
>
> Me? Well, you know, the usual. Nothing too exciting. Oh and, by the bye, would you be interested in trying out this vibrator controlled by Donald Trump's Twitter? It's for this fun new project...

Needless to say, this hypothetical conversation never ended well.

No, I realized that I had to throw myself into the work. Only this way would it be authentic. I had to love the Don, and I had to put my body upon the gears and upon the wheels, upon the levers, and in all the apparatuses and I had to make it stop! And while perhaps not ideal, the idea of some scrawny-ass male motherfucker like yours truly, loving Donald Trump is not entirely without merit. But let's not get caught up in such matters prematurely. Back to the stimulation at hand.

*The Don and I*'s means and manner of sexual stimulation had to be carefully selected in order to clarify the role of sex in the piece, and, just as importantly, clarify what the piece was not about. Involving another person in something of this nature without their knowledge or consent could easily descend into major creeper territory. I had artistic purposes for doing this of course, and feel the application here is entirely valid—at least when applied to a public figure like Trump. But I also needed to ensure that, even if the final presentation of the piece were irreverent, somewhat self-consciously salacious, and entirely ridiculous, that it never truly descended into sexual harassment or anything of that nature.

To make this distinction clear, I drew inspiration from my [color vibration experiment][color]. This experiment used the colors you look at to control a wearable anal vibrator from *Lovense* called the *Hush*, as well as a female wearable vibrator called the *Lush*. Those two toys were specifically selected because of their ability to deliver automatic stimulation, meaning no mechanical user action is required. This is a small but very important distinction. In the context of this experiment, automating the stimulation keeps the focus on the cultural and symbolic aspects of sex, rather than on the act itself.

However, in the color vibration experiment, neither a friend or I found the *Lush* or *Hush* terribly arousing on their own. Donald Trump deserves more than that, so it was back to the drawing board.

During my survey of sex toys for the color vibrator work, I had dismissed more traditional male masturbators due to their size. This time though, a wearable getup was not needed, so I took another look at the field. These devices usually take the form of lifelike rubber vaginas that companies will sell you for when you feel lonesome (the references grow ever more [obscure](https://en.wikipedia.org/wiki/Martini_(cocktail)).) The issue though: most of these are wholly manual in operation, and therefore not suited to this work. I needed automation. 

Enter the *Lovense* *Max*, which is essentially a *Fleshlight* with built in vibration functionality and inflatable pockets to emulate pelvic muscle contractions or something (but honestly who the hell do they think they're fooling here?)

{% include image.html file="toys1.jpg" description="\* Guthrie sticker not included" %}

The vibration and inflation of the *Max* are controlled over Bluetooth, which met the automation requirement nicely. With the *Max* decided upon, I also kept the *Hush* in the equation, operating under the theory that the sum of two positive numbers is often greater than either number alone.

I wouldn't read too much into the specific choices of sex toy however. The *Max* and *Hush* pairing was chosen almost entirely for practical reasons: I knew that I could use them and write software to deliver automated stimulation using them. There are just tools. The specifics—the rubber vagina tube and vibrating butt plug—were almost entirely incidental. And while on the subject of things this experiment was not about, one other small clarification: while both Donald Trump and I are paragons of the male sex, homosexuality in and of itself was never a consideration here, although homoeroticism is a somewhat different story.

As to how well the new equipment works in practice: while the *Max* did increase the stimulation over the color vibration experiment, I remain unimpressed. The *Max* sounds like a miniature leaf blower for starters, and any vibration or inflation is almost entirely futile without the customary thrusting, an action which remains hopelessly analog and was therefore of little interest in the context of this piece. Oh well. There's always next time.

# Tweet to Sex Translation
At one time or another, I'm sure we've all found ourselves wondering how to translate Donald Trump's tweets into sex. It's a good question; a timely question; a *real* american question. And there's no one correct approach to the problem, it is really more of an art than a science.

My simple algorithm operates on two levels, with phonetics driving the *Max*, while tone and word choice drive the vibrations of the *Hush*. To understand how this works, consider this fine specimen from the Don's aviary: 

> protesters and the tears of Senator Schumer. Secretary Kelly said that all is going well with very few problems. MAKE AMERICA SAFE AGAIN! 
>
> [@realDonaldTrump - January 30, 2017](https://twitter.com/realDonaldTrump/status/826042483155013632)

The first pass ignores meaning and only looks at phonetics. Each word is converted to its pronunciation using the [CMU Pronouncing Dictionary]():

```
[ { token: 'protesters', pronunciation: 'P R OW1 T EH2 S T ER0 Z' },
  { token: 'and', pronunciation: 'AH0 N D' },
  { token: 'the', pronunciation: 'DH AH0' },
  { token: 'tears', pronunciation: 'T EH1 R Z' },
  { token: 'of', pronunciation: 'AH1 V' },
  { token: 'Senator', pronunciation: 'S EH1 N AH0 T ER0' },
  ...
]
```

The dictionary uses the [ARPAbet phoneme set](https://en.wikipedia.org/wiki/Arpabet), which has 39 unique phonemes. The trailing digit on vowels indicates which part of the sound to stress. I optimized my algorithm by simply ignoring the stressful bits.

From here, each phoneme is mapped to a unique inflation pattern between one and ten seconds in length. The patterns are all fairly simple. The *Max* only has five inflation levels and switching between them takes time. Where possible, I tried to capture the shape of each phoneme. A very round phoneme like `OW` as in `oat` has a hillock shaped curve, while a sharp short phoneme like `B` as in `be` is far more angular and abrupt. This mapping is really only of artistic interest however as, for the most part, I was unable to distinguish any of this subtlety in practice.

The tweet's tone and word choice control the *Hush's* vibrations. This mapping is far more limited. First, the sentiment of each word is judged individually using a sentiment dictionary. Most words don't have any sentiment score:

```
[
  ...,
  { token: 'problems', sentiment: -2 },
  { token: '.', sentiment: 0 },
  { token: 'MAKE', sentiment: 0 },
  { token: 'AMERICA', sentiment: 0 },
  { token: 'SAFE', sentiment: 1 },
  { token: 'AGAIN', sentiment: 0 },
  ...
]
```

The sentiment scores become the baseline intensity for the vibration. A score of zero means no vibration, while higher or lower scores increase vibration strength. Negative scores are mapped to square shaped wave patterns, which turn the vibrator on and off rapidly. Positive scores map to smoother, sine wave patterns. TRUMPCASE and exclamation points also serve as score multipliers.

Furthermore—in a *Pee-Wee's Playhouse* befitting twist—some secret words produce extra special vibration patterns. This includes words and phrases like `america` and `great` and `fake news` and `wrong` and all matter of graphemic assemblages now forever associated with Donald Trump.

I freely admit that my approach to the translation problem is limited. My algorithm only considers words in isolation—not the tweet as a whole—and the mapping logic is crude at best. It all works, but honestly it would probably have been easier to just feed the tweets into *Mechanical Turk* and leave such matters to the wisdom of the crowd. Either that or machine learning. Machine learn good.

So there you have *The Don and I*. Nothing fancy. If you want in on the Donald Trump Twitter action, it's easy to play along at home.


# Resist

{% include image.html file="toys2.jpg" %}

The idea of *The Don and I* can be traced back to well before the election, yet, for a long time, I was hesitant to actually create such a piece. Even the election itself did not immediately convince me that this work was needed or even a good idea.

One concern I had trouble shaking: anything I created to speak out against Donald Trump would be dismissed as partisan. Don't get me wrong, I detest Trump, and all that he represents—I think we should protest and politically oppose him as much as possible, and I think we should relentlessly mock the symbols and values behind him—but I'm no partisan. Really, I've never identified with any broader groups or movements or leaders. Sure I align with some more so than others, but my identity is not tied up in these groups themselves. Snowflakism and all that, you know how it is with us millennials.

What I eventually realized though, is that partisan perceptions could never be avoided without diluting the message. Even if the piece is well presented, and even if I documented the rational and thinking behind it, I can't know how it will be received once it's out there. I can't tell people how to understand it, nor do I want to do this. The best I can do is provide information and context concerning why I created it.

I'm under no illusion that *The Don and I* will change anyone's mind or even be noticed. 'Tis nothing more than digital armchair activism after all (although perhaps a more apt comparison is to a bed-in). Yet consider: what we have here is armchair activism taken to a comedic extreme, wherein the activist not only activises from the comfort of his or her Lazy Boy, but literally derives pleasure from their perceived activism and imagines this in and of itself to be protest. It's masturbatory activism. 

I find myself slipping into postmodernist circle-jerks like the above perhaps rather too often. Part of it is surely defensive, yet it's also a style that I find interesting, for better or worse. I'm not always successful in exploring this—even I sometimes get lost trying to understand what the hell I'm trying to say and, more often than not, in reflection I find myself entirely insufferable—but when this style works, oddly I find it far more compelling than any straightforward presentation. (Of course, this very document may also be part of this style. Surely I would have realized this trap though, and pointed it out to the reader to show my infinite cleverness and wit.)

If forced to categorize *The Don and I*, I would have to file it as art. I hate doing this. I'm not an artist. I don't create art. But if you need a label for some of what I do, that's the only one that seems to fit. What else do you call stuff like [trying to experience the world using a camera mounted inside your mouth][oral]? It's either art or crazy.

Calling something art also makes it safer. It fences it off from the real world, makes it easier to disregard. But it's the gray areas that I find most interesting—the places between fact and fiction, between high culture and low, between substance and trolling, between art and spam, between seriousness and mockery—with the more layerings and mixings and complexities the better. I find that these gray areas can catch me off guard, make me question things, see ideas and associations differently.

These gray areas are where *The Don and I* springs from. This is what led me to go around partisan perceptions by going hyper-partisan. *The Don and I* uses a declaration of devotion and love for Donald Trump to mock him and those who define themselves by him, while simultaneously standing in opposition to Donald Trump, only to turn around to mock its own opposition and the broader styles of opposition employed against him. Hence the "Make America Great Again" garb, and hence the self-aware, masturbatory activism.

But while taking a few potshots at the opposition, I do fully admit that Donald Trump was always the primary target. A small dose of comedic inspiration came from good old Milo—both with the aviators and his professed love of Donald Trump–but this was little more than another cultural reference, a friendly shout—out if you will.

You could argue that by going after Donald Trump this way, I've merely sunk to his level. Why punch down? Why not engage in civil discourse or at least civil disobedience? Why not stay positive? That's not the point. Here's why I feel the piece is needed.

# Love Trump's Hate
All saddled up, we begin our charge at a trot, our steed being a rather sarcastic beast.

Donald Trump does not strike me as a happy person. No matter what he claims or how much he smiles, I just don't see it—at least in his public persona. This is a man who, after fairly winning the Presidency, somehow continues to obsess with the fact that he lost the popular vote and continues to lash out against everyone and anyone who provokes him even the slightest. Sad. Donald Trump is kind of a loser. Yet even unhappy losers like him need love, and seeing how no one else was stepping up to the plate, I most graciously took this patriotic duty upon myself. You're welcome.

But another consideration: never underestimate the ability of unhappy people to drag the rest of us into their world of shit. During the campaign, Donald Trump demonstrated remarkable skill in using his words to attack, insult, and degrade both individuals and groups, a pattern of behavior seemingly unchanged by the presidency.

Speaking somewhat more seriously for a moment, here's what I want to know: Who are all these angry old men? What horrible value system do they believe in that makes them so scared? And, even more so, who are all these people following them? Why do they want that?

And this got me wondering, what if I could take all the anger and hatred that Donald Trump spews out and convert it into love? What if we could literally love Trump's hate? The more hate, the more love. And who knows, in time, maybe even dear old Don would join us singing Kumbaya around the bonfire.

Love is hard though, so I settled on sex instead. Good enough.


# Fuck Donald Trump
That's not to diminish the very real threat that I believe Donald Trump poses. He is the very definition of a demagogue and populism is bullshit well-nigh 100% of the time. Even more so, the values that Donald Trump embodies and built his movement around are shallow and dangerous caricatures. These were always the focus of *The Don and I*, and if the presentation comes across as crude or ugly, well that's the whole point. What Donald Trump embodies is crude and ugly, and we must strip away all the pomp and pageantry to show this. 

Plenty of comedians have mocked Donald Trump, but they often seem to get stuck on the superficial stuff: the hair, the tackiness, whatever ridiculous thing he just tweeted. Much of this misses the mark.

For one, Trump is of *The Fifth Element* breed of adversaries: any anger directed against him or any attack upon him (or even mention of him) only seems to make him stronger. *The Don and I* tries to account for that. If an image of this little experiment comes to mind when real Donald Trump's tweets or speaks at a rally or appears on TV, I consider the subversion a success.

As for opposition, even more "risqué" forms of protest against Donald Trump make similar basic mistakes. A Donald Trump butt plug is not the answer, nor is waving around sex toys at a protest march to get attention. Some people may see shock value in such things, but shock is not a story. It is fleeting and ultimately self-defeating.

"But ah ha!" you gleefully object, "There I finally have you my dear sir, for isn't that a rather bald-faced bit of hypocrisy?"

Hardly, my well educated and highly attractive friend, although nonetheless a point worthy of further clarification.

I realized early on that by involving sexuality and sex toys and such things, it would be difficult to escape the perception that *The Don and I* was going for shock value. This is not the case, or at least, this was never my intention. My focus was always on the symbolic aspects of sex and its relationship with power and adoration and devotion, with the sex toys themselves just tools used to explore these topics, just props used to express these ideas. They are not the point. (In that vein, for now at least, I opted only to publish the more mild photos taken for the piece.) Exploring these broader ideas is more insidious, yet far more venomous in my thinking. To successfully counter Donald Trump, we need to discredit the symbols and values behind him and his movement. We need to reveal their ridiculousness.

This is not without danger. Some people derive value and worth and meaning from these symbols, so attacking these could easily lead to further polarization. But I also feel that this is the correct approach for Trumpian leaders and movements. And that is why, rather than "Fuck Donald Trump" as YG and Nipsey Hussle proudly declare, I say: *fuck* Donald Trump. 

One core characteristic I see in Donald Trump is pride. But for all his bluster, he also strikes me as being rather insecure. Without trying to psychoanalyze,  in him I do see a need to boast, to prove himself to us, to show us how great we should think he is, and for us to approve, or at least acknowledge him.

Pride and this self-absorbed need for adoration are very ugly things once you drag them out into the light, and *The Don and I* uses unflinching satire to reveal this. The basic thought: what if instead of merely stroking his ego online or at  rallies of adoring supporters, Donald Trump literally derived sexual pleasure from their adoration? (And now there's an image that can't be unseen.) Of course, Trump would never allow me to wire him up for an experiment like that, so I flipped the problem around. Instead, what if Donald Trump was so great, that his mere presence—perhaps even just his voice or his tweets—could sexually stimulate the masses? 

And why stop here. To truly reveal Donald Trump as the ridiculous *Yahoo* that he is, let's give him what he wants: Donald Trump everywhere, all the time. Welcome to Trumpland!

Let's all wear *Make America Great Again* hats all the time; let's replace CNN with Donald Trump's twitter feed; let's rewrite Shakespeare so that every character is Donald Trump; let's name every newborn *Donald*, boy or girl; let's rename *Taco Bell* to *Trump's*; let's create pornography where everyone wears Trump masks the whole time, so that we can all enjoy watching Donald Trump forever making love to himself; let's make the *Art of the Deal* our *Little Red Book*; let's celebrate *Donald Trumpmas* ever year; let's nuke Don's visage into the lunary regolith so that the whole world can look up at night and know his glory; and let's all march on Washington—ladies with their *Trump Sticks* and gents with their *Trump Tubes*—and all make love to Donald Trump on the White House lawn. It's gonna be beautiful.

And why? It's for you Don. It's all for you.

Your winner.

# Reality Repression
Although the Trump aspects of this experiment are timely, I find the broader ideas and concepts of the work to be even more interesting.

Much post election analysis seems to center around the meme that United States citizens are living in different realities: republican vs democrat, coastal vs interior, urban vs rural, and so on. Beyond all the hand wringing over the role of the media, and filter bubbles, and fake news, this idea—that people living beside one another could exist in different realities—is fascinating to me. It ties into the ideas behind many of my [modded reality experiments][mr]—which  explore using technology to remix and rework one's sensory experience of the world.

What if instead of merely existing in separate social and political and factual spheres, people actually experienced reality differently? What if the words of Donald Trump literally brought pleasure to some and literally brought pain to others? That's what this experiment examines in some small way. You could take it much farther though. In a similar vein, how about translating Trump's voice into electric shocks for his opponents and into small injections of oxytocin or morphine for his supporters? Silly, I know, but still a fascinating idea at its core, though it is rather *Black Mirror* to imagine how the concept could be used by repressive regimes.

On that thought, the device that I created for *The Don and I* is almost a satirical totalitarian instrument, a tool that Big Brother can use control citizens by fucking them. It is a tool of repression, yet one so absurd at present that it really mocks those seeking to repress. This is a machine of fascists suppression; it's a machine for making love to fascists. But, by knowing this, the machine mocks fascism; it becomes a machine for killing fascists. Hence the Woody Guthrie sticker. And another circle is complete.

# Conclusion
The intent of this document was not to dictate how *The Don and I* should be viewed or understood, rather my goal was provide more context and information on why I created it. I feel that I've said what needs to be said. My only parting advice: Think for yourself; follow no one; love everyone.




[don]: /the-don-and-i/

[mr]: /series/modded_reality
[color]: /blue-sky-orgasm/
[oral]: /mouth-cam/

