---
layout: post
title: "Dreams of the 21st Century"
date: '2016-04-07'
description: "Machine learning my dreams"
series: "machine-learn-me"
---

A wonderful fact to reflect upon, that inexpressible mystery of dreams. Even the most epic, life changing dreams always end up sounding rather *cool-story-bro*, or artificial, or suspiciously Freudian when put into words. Many an awkward conversation has begun, "Last night, I dreamt..."

One problem is that dreams are not neat, little, easy to consume narratives; they are not like short stories or episodes of a show, but rather a product of your entire existence. Good luck expressing that (You'd have to win a MacArthur Fellowship and rent out a giant warehouse in New York...) Plus, to quote the eternal Charles Dickens, "Why should anyone give a shit?"

So are our dreams doomed to forever slosh about in gooey darkness, understood only by ourselves? Doomed to decay into dust with our bodies? Hardly! This is 2016 after all. We got us computers, we got us The Cloud, we got us machine learning, and we got us BIG Data. While our fellow creatures may never be able to know our dreams, surely technology can! So I set out to machine learn me some dreams.

Besides, all this dreaming has been *super* taxing on my tiny little mammalian brain. Far better to let a mighty computer generate my dreams going forward. 

# Dreamscraper
But before machine learning my dreams, I decided to play the *Freddy Krueger* and try my hand at generating other people's dreams first.

[DreamBank][] is an awesome public collection of around 30,000 dream reports from a variety of sources. To harvest those 30,000 dreams, I wrote a [simple Python scraper][DreamScrape] to collect the dreams and store them as json. [The data is all available here][DreamScrape].

And don't you just love it when a project allows you to write code that reads like this:

```python
for dreamer in DREAMERS:
    dreams = collect_dreams(dreamer)
    if dreams is not None:
        save_dreams(dreamer, dreams)
```

Both the script and the complete dream json dataset are [on Github][Dreamscrape] in case anyone else wants to use them. There's something profoundly depressing about 30,000 dreams—one for every day of your life—fitting into a little under 30MB (only 9.1MB gzipped!) 

Now, which dreamer to target first?

# Barb Sanders
[Introducing one Barb Sanders](http://dreambank.net/grid.cgi#b), occupation: dreamer. Barb Sanders, who from 1960 to 2001 put a pen to paper to record more than 4000 of her dreams. The year is now 2016, and thanks to modern technology, Barb Sanders is about to start dreaming once again. But what Ms. Sanders is about to realize, is that she's always been dreaming, in <strike>the Twilight Zone</strike> the Cloud.

The Barb Sanders dream corpus tips the scales at some 820,000 words. Damn Barb! That's two *War and Peace*s worth of words right there (while also being approximately 87 quadrillion times more entertaining than anything Tolstoy ever produced as well.)

And Barb Sanders dreams are high quality stuff too, not just your run-of-the-mill flying escapism, or regressive school testing nightmares, or dreams of the Great Homecoming Fuck Fantasy:

> \# Al Pacino in drag (12/15/99)<br>
> Al Pacino works for the police department. He also runs a theft ring. Mostly they steal lipstick and women's clothing. I see him putting on bright red lipstick. He has luscious full lips.

I LOVE YOU BARB SANDERS!!!

Both the quantity and the quality of Barb Sanders' dreams made them a great starting point for my little experiment. Here's the complete dream set if you too want to "Feel the Barb": [Part 1](https://raw.githubusercontent.com/mattbierner/DreamScrape/master/dreams/b.json), [Part 2 (this is where things really start getting good)](https://raw.githubusercontent.com/mattbierner/DreamScrape/master/dreams/b2.json).

## I Dream of Markov
There's a sort of honesty in the writing style of a good dream journal, with its simple sentences and almost *Up Goer Five* grammar. An honest dream journal also captures a unique style of narrative, one where the plot itself is (rather appropriately) a stream of consciousness. Dreams often have a matter-of-fact illogicality that only seems illogical in hindsight. Stuff just happens. NBD.

Most fiction reduces dreams to lame flashbacks or uses the dream as a "show don't tell" device to tell the reader what a character's deepest emotions are (accomplished by bashing the reader over the head repeatedly with the largest, bluntest symbol available). But, for my money, stories such as [*The Dream-Quest of Unknown Kadath*](https://en.wikisource.org/wiki/The_Dream-Quest_of_Unknown_Kadath) are some of the only works of fiction that actually come close to capturing a true dream narrative.

Both the simple writing style and fluent nonsensicality of dreams make them well suited to the rather simplistic computer learning techniques I enjoy. After all, I use up so much of my brain's computational power everyday just dreaming, that I can't be bothered to do anything more than just lob text files at a computer and let it figure out what to do. First up, the humble Markov chain.

Markov chains are well regarded for the deep, meaningful text they can generate. Much like a human brain ([or a toaster](http://blog.blot.re/introducting-blotre/)) the Markov chain is a black box: a string of symbols goes in, something happens, and a new string comes out.

Here's what came out when I fed all of Barb Sanders' dreams to [Marky Markov](https://github.com/zolrath/marky_markov).

> 02/27/97 <br>
> \# Walking from California <br>
> I am wearing the exact same blouse, a grey pair of pajamas for a walk. Summer of Tears. O'Donald and is safe to use the computer. hops and makes a real banana and apple and an old woman. Very clever, they used to be their class president. John yells, Low, really low! cantaloupes, strawberries and grapes. City; just home. he read about the fourth one is too intimate, so I go to Neal's office. Irish knit bedspread. We won't need one for her. Ah, she's affected too. I am wearing. I sense someone else, it will. I go through. More and more fun and we make wild love. Mexican relatives come by and see old beautiful curio cabinets, with dark hair, moustaches. He's ill and reads a line is dead, sung to Poor Judd is Dead from Oklahoma musical. Now, maybe next year, more people arrive, that aisle is crowded. Then over a one dollar bill tucked into my skin. B means. A full room. The personnel office is a bunch because there's an hour before the shock wave area. With tricky driving, I am fascinated with the man stops there and I walk up and back out my need to fix some for him. He smiles and says MaMa. The royal family. Ellie playing in an office for the little girl, a teen boy makes sign language but I know this is a feeling he and I start backing up and read it. Abner smiles and continues to take a Kleenex and I am impatient with her and hold out my hand. Blake follows me everywhere. Well, only the girlfriend. I then go up higher than the knowledge. This is the bathroom. He affectionately searches my scalp or brain. 

Or, perhaps a dash of post-modern poetry:

> \# 02/25/81<br>
> I'm an open ulcerated sore on my back. she's doing the dishes. He shrugs and accepts. The girlfriend is in another room.

Wow, that's deep.

## Neural Network
Now Markov Chains make a mean [word salad](https://en.wikipedia.org/wiki/Word_salad), but are not so good at producing logical thought (unless the output is read in the most breathy of poet voices). So perhaps we should draw inspiration from the original Barb Sanders' dream generator, namely the brain of Barb Sanders. Yes! we need a neural network, [a neural network to hallucinate the hallucinations of a biological neural network](http://inception.davepedu.com/noflash.php)

So continuing in the vein of throw-stuff-at-a-computer-and-see-what-happens, I next fed Barb Sanders' dreams into a neural network.

[Torch-rrn][torch-rnn] is a character level, recurrent neural network utility. I used it previously to [generate new entries for urban dictionary][urban], with some success.

Here's a sample Barb Sanders' dream generated by a fully trained 4 layer neural network with a rnn_size of 1024, trained on an large EC2 GPU instance:

> 03/07/81 <br>
> I am riding a bicycless. The second wife is out to say a cello. "Where's the man? He wants to marry is for us to fix her." Melinda kills the words, is the one that works I'd all in the ocean. I say, "We're going to talk to Herton't." My apartment is, I'll get some totally stuff in. She turns and complains that I recognighted at the faucet. It's late at night. I am ready to take them off. I get in the river which has an earthquake, 3 or 6 stove somelorian and so on. They want to go find something I can sterement. I drink for her to go home. I choose the river and successfully answer it in. I say, yes, but it was the words, but no serving me.

Notice that the sentences generally make much more sense than the Markov generated text, and the computer has even learned to dream quotes. There's still some major problems with continuity and logic, but who needs those! [Here's a 100,000 character sample of Barb Sanders' new dreams][barb_sample].

You done dreamed good Barb. You done dreamed good.

# Me
I've been keeping a dream journal for fun over the past few years, and the exercise has made me realize what a product of the time I am. It's more than just the cast of characters that inhabit my dreams, or the copious pop-culture references that fill them, it's how I dream. I've dreamt in the third person, in debuggers, in Google Maps, in film, in Wikipedia, in Banjo-Kazooie, and in Ken Burn's style documentaries (I told you they would sound lame). Yes *in*, not just *about*. Fifty years ago, no one would understand my dreams. And, fifty years from now, no one will either. Their loss.

I read on Wikipedia [that people who grow up watching black and white TV, sometimes dream in monochrome](http://www.telegraph.co.uk/news/science/science-news/3353504/Black-and-white-TV-generation-have-monochrome-dreams.html). I wonder how VR and AR will effect our dreams. 

But back to the topic at hand.

After Barb Sanders, machine learning my dreams turned out to be a bit disappointing. The data is just too damn small. In the past two years or so, I've only dreamt some 260,000 words in 310 recorded dreams, a mere *Ulysses* worth of text.

## Markov Chain
[All my dreams are property of Blot're][the_policy], so I can't provide the raw dream text at this time, but it's still interesting to see what words and phrases the computer spits out.

Here's a Marky Markov generated Matt Bierner dream (the tool strips out new lines):

> A Russian novelist wrote a book of CDs. It was build in a dream I realized. The author was going to slow down time too, and was probably one of the hill. Outside the second floor.Why did you let go, you would find another way down. It felt like the Arctic ocean, the parking lots. They probably would not break. And I knew this from one side was an old "Jackson Five" style song, something about watching these little dots of light moved along a hallway with  right in the first floor. There were dark shadows of couches and other things. The first take was from the top. This freezes him in some way. He eyes were like enchiladas. I would just sit there, or go down a river. The water was too fire fighters too. I thought that it light was coming out on the top of a larger ledge in front went straight for me. They are not going to target players as they after to move anywhere quickly. It was a fresh electromagnetic storm. It would be so careless as to clash with the Tut was made of red algae the day and used the building. We waited expectantly for me to back and sure of who these people would actually drain your health bar is less than half now. But it seemed impossible. What kind of like a reactor cooling pond. I visualized the coming years. This was a real photo. But I concentrated on a street next to the west, in the kitchen door, connected to the terminal. It was mid afternoon, with bright, slightly orange light. The trees are off near the back. What was their plan all along. But there were giant rabbits. They must be some sort of made sense.

Already going full meta by the second sentence! I like it.

##  Neural Network
Things start to break down a little more with the neural network. Remember, the character level neural network had to not only learn how to generate the dreams, but also how to generate sentences and even how to generate valid english words. The less text it has to learn on, the lower quality of the output.

Here's a sample Matt Bierner dream generated by a fully trained 4 layer neural network with a rnn_size of 1024:

> \# (28/03/2013) To be in fact <br>
> I had never thover and went onto this eyes. The plastic building into such a moment there would be fairly pissed yet.
> I start down here.
> I headed. On the lens. My body was mostly gunnerally packed and started for the south. They continued walking along with the car. And what! I have to get rid of the same rather things this time. We had to go under my back from the face. There were large buildings were inside of my heart, too and we mentioned. They voice formed information of a path?
> It was kind of going down at the right thing. It was the actual table member. I wasn't sure how to did only awaying at each pipes. Waiting wonder how it does not have anymore in the garbage poles. The before and the cars were not that orange and the drivens and introduces it seemed under the opposing decision. Every so that there were better going formath. The room was asistending the darkness. It seemed they are quite enough in the first place.
> Now the road was saying I was plugged about it back at the end of the sky, something directly into a large reverse game.
> So I intentionally being just about to sleep like machine notes. That's cheater, and part of sensation. The bottle was breaking on.
> Part of each one I was being just beautiful motions. I suggested that even had probably not cramped thought the hallway. I knew that the archway was silly going too close to the top of this courtyard and get a zombie.
> I run amer told it, well they start black, and the team was. The entire tank is a giant spiral over at the planet and could explore the map. The whole time zone was my hand.

Interesting.

And [here's a 12 dream, 40000 character sample][me_sample]. I've made a few minor edits for context. To keep things G-rated, I also removed a rather gratuitous scene wherein I was french kissing this lovely, bewhiskered, Austrian professor named 'Sigmund', or something similar. Still trying to figure out the interpretation of that...

# Dreams Wholesale
I hate to admit it, but the original dreams are much more entertaining than anything the computer produced. Computers may have us humans beat at Go, but we've still got the upper hand at dreaming. Sure, you could probably apply some fancy machine learning techniques or add more logic, but it'll be a while before computers are able to dream up a better Al Pacino than old Barb Sanders did.

I once watched [a documentary](https://en.wikipedia.org/wiki/The_Matrix) about eco-minded machines using millions of human bodies as a renewable energy source. That'd never scale; potatoes would be a much better choice. But storing humans in tanks and using them to generate dreams? Much more logical. I can almost see AWS rolling out that service sometime next year.


[urban]: /urban-dictionary-neural-network/

[torch-rnn]: https://github.com/jcjohnson/torch-rnn

[me_sample]: https://gist.github.com/mattbierner/c37e786bc38652812f3f5600dcd2460d

[barb_sample]: https://gist.github.com/mattbierner/3ab708f06700e149fae7ff7c4d3043dd

[DreamScrape]: https://github.com/mattbierner/DreamScrape

[DreamBank]: http://dreambank.net

[the_policy]: https://blot.re/ThePolicy

