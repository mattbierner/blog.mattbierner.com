---
layout: post
title: "What I've learned over 10 years on Stack Overflow"
---

I'm approaching my ten year anniversary on Stack Overflow. Over the past decade, how I use the site and my understanding of it has evolved quite a bit, so I thought I'd share some of what I've learned along the way.

I'm writing this as a moderate user who is not engaged in the broader Stack Overflow community or culture. These days I pretty much only answer questions related to VS Code since it's the product I work on. In the past however I was more active in a wider range of topics. All told, over ten years I've [asked about 50 questions and posted 575 answers](https://stackoverflow.com/users/306149/matt-bierner), while browsing through countless others.

Jon Skeet has [covered Stack Overflow culture](https://codeblog.jonskeet.uk/2018/03/17/stack-overflow-culture/) far better and more authoritatively than I ever could. Elements of this write-up were inspired by his writing, although ultimately this is my own candid reflection on my experience with Stack Overflow, what the site does and doesn't do well, and how I use it today. This discussion is going to be fairly high-level and does not assume deep familiarity with the site or its history.

So without further ado, here's some of what I've learned while using Stack Overflow for the past decade.

# Asking questions is a skill

It seems so easy at first blush: enter a few words in a text box, hit submit, and let the internet magically solve all your problems for you! But it's taken me almost a decade to figure out what words to put in that damn text box to actually get results. I'm still learning everyday in fact.

Asking good questions is a seriously under appreciated skill (as is filing a good issue report for that matter). Because, first off, how do we even define what a good question is? Stack Overflow provides [some guidance](https://stackoverflow.com/help/how-to-ask) on the matter, listing qualities such as:

- Is within the scope of the site.
- Has an objective answer.
- Has not already been asked.
- Has been researched. 
- Clearly states the problem, usually with a minimal, easily reproducible example.

Ok, but what does something like "clearly stating the problem" actually look like in practice? What information is relevant and what isn't? Sometimes it feels like to ask a good question you first need to know the answer.

Unfortunately the little text box isn't much help here. So is it much wonder that many new users end up posting low quality questions? Often the only feedback they get for this is having their question closed with a link to some confusing documentation. And that's if they're lucky; many low-quality questions are just silently downvoted before disappearing into the endless question backlog.

Asking good questions is a skill. The good news though is that it's one that you can work on and get better at. I learned primarily by looking through a whole lot of questions and answers, noting what works and what doesn't. What information is useful and what just gets in the way? Putting those new skills to work and asking a question will still be intimidating. Just make your best effort and treat whatever happens as a learning opportunity. Even I have to admit that I'm a bit embarrassed by some of my clueless early questions, although perhaps such twinges of embarrassment are evidence of how much better I've become at asking questions since starting out on the site.

# There's a difference between bad questions and not good questions

I'm not going to sugarcoat things: some questions are simply bad questions.
 
A question consisting of a screenshot and the text, "WHY DOESN'T THIS WORK!?!" is a bad question. Why? Because the asker clearly made very little effort before posting it. It's not even a question really, more of a demand: "do this work for me!" Why should I? It is not worth my time to help someone that isn't interested in learning and won't value my help to begin with. Learning is what Stack Overflow is all about.

Now consider a question titled, "How do I  remove the blue borders on my homepage?" that consists of a multi paragraph write-up that appears to be talking about the css `outline` property without ever actually using the words `css` or `outline`. Even though such a question may go against many of Stack Overflow's recommendations, I'd argue that it is, while not a good question, not a *bad* question either. At least the asker tried to provide something even if they don't know what to provide. Effort counts, as does openness to engage and learn.

Many Stack Overflow members however are all too likely to treat these two questions the same way: -5 and closed. This is unfortunate and likely scares away many inexperienced users before they have a chance to learn how to ask better questions or even how the site works.

Truly bad questions aren't worth wasting time on, but we have to assume that those users asking not good question are not intentionally asking not good questions. They want to ask good questions and just don't know how to. If we blindly penalize beginners without engaging or providing feedback, how are they ever supposed to learn?

# Asking a good question does not guarantee an answer

Simple questions that can be answered by a large number of people generally get the fastest responses on Stack Overflow. Have a question about binary search in JavaScript or about HTML? Great! Here's five answers in under an hour. The more arcane or specialized the question is however, the less likely it is to get an answer, no matter how well stated the question is.

The chance of a question being answered also rapidly falls off as time goes on. Once a question gets pushed out of the first few pages of user queries, it gets lost in the ether. After a week or so, you have to pray someone knowledgeable stumbles across it in a chance search (or slap a bounty on the question).

# Correct answers don't have to be answers you like

I get a handful of downvotes every month for what I'll term unpopular answers. These are answers that essentially say, "this is the way it's currently designed," or, "this is not possible because of reason X," or, "this is a bug that needs to be fixed upstream." The thing is, in all of these cases, it's not like someone has posted a solution or even a good workaround. Instead what I suspect is happening is that someone doesn't like what answer says, so they downvote it. And I understand that, but that also doesn't mean it's not correct.

The inverse is also true of course: good answers do not necessarily tell you what you want to hear. Some of the best answers address the original question but then go on cover alternative ways of thinking about the problem. Sometimes I'll even answer a user's original question and then post a big write-up on why what they are trying to do is a bad idea. 

Any time expression is simplified to up/down votes or like buttons, you're going to lose important distinctions. It's a common problem on the internet. How many many social apps can distinguish, "I support this," and, "I think this is well put even if I don't like or agree with it."? Overall though, despite those few downvotes every month, I feel the Stack Overflow community does a pretty good job in voting objectively. Let's try to keep it that way.

# I almost never ask questions on Stack Overflow

The longer I've used the site, the less likely I've become to post a question to it. Part of this is my growth as a developer. Many of the problems I face in my current work are too complex to state as simple questions or too specific to ever be of much help to anyone else. I've learned the site's limitations, so I avoid asking questions that I know will almost certainly not get a good answer.

But even when learning a new language or framework, I rarely post questions. Not because I'm some super genius or anything, quite the opposite in fact. No, after all these years of using Stack Overflow, whenever I have a question, I always begin thoroughly convinced that I could not possibly be the first person to ever have the question. So I do a search, and almost every time I'll find that someone already asked the exact same thing two years ago.


# Observing the questions people ask is a great way to learn about your product

I currently work on [VS Code](https://code.visualstudio.com), so I make it a habit to browse through questions tagged `vscode` on Stack Overflow. It's a great way to learn about how my code is being used in the real world. What types of problems are they running into? Where could our documentation or APIs be improved? Why is something I thought perfectly clear causing so much confusion? 

Questions are valuable signals about how your product is being used in the real world. The key though is not to just answer the question and move on, but also to try and understand why the user had the question in the first place. Maybe there's a discoverability problem or some assumptions built in to the product that you didn't even realize you'd made. Questions have also helped me uncover countless bugs and inspired a lot of feature work.

If you maintain a product for developers, don't just treat Stack Overflow as a dumping ground (or, worse, a question graveyard). Regularly check on questions being asked and the answers being posted. That does not mean you need to answer every question yourself, however the signals that Stack Overflow provides are too valuable to ignore.

# The boundary between question, bug report, and feature request is blurry

As a follow up on that last point: a fair number of the VS Code questions I run across on Stack Overflow are technically bug reports. Many others are technically feature requests.

For example, a Stack Overflow question titled, "Why does VS Code crash when I do X?" is actually a bug report; VS Code should not crash when you do pretty much anything. Posting answers to bug report questions can be counterproductive, as the asker may be happy with the workaround and never file a proper bug report against the product. In these cases, I usually leave a comment telling the user to file a bug report over on Github.

Other times, the distinction is more subtile. Consider a question titled, "Why doesn't JavaScript IntelliSense work in VS Code?". Depending on precisely how JavaScript IntelliSense is not working, this question technically could fall into any of the three buckets:

- If it's a user configuration issue, then this is a real question that belongs on Stack Overflow.
- If we expect IntelliSense to work in this case but it doesn't, then it's a bug report.
- If we don't expect IntelliSense to work in this case, then it's a feature request.

At the end of the day, the distinction doesn't matter to most users; they just want to get IntelliSense working.

And although I do care about the distinction as a project maintainer, it ultimately shouldn't matter much to me either. Because questions, bug reports, and feature requests are all ways of expressing the same idea: the user expected my code to do something and it didn't. If our product was perfect, users would never need to ask any questions about it since it would be so intuitive and it would do exactly what they want all the time (or at least clearly explain to them why it couldn't).

# Developers are human

Humans are emotional. Humans are irrational. Humans are jerks. Not always of course but sometimes! And believe it or not, developers are human too.

There's this fiction that us developers like to repeat to ourselves, consciously or not: We work with computers so we must be rational; we understand cryptic symbols so we must be smart; software has eaten the world so we must be great. Woo! Go us!!!

Simply not true, or at least if it were true then lord help the rest of the population. Even on Stack Overflow, a tool for professionals built as an objective knowledge-base, and even in my own super specific VS Code bubble of that site, I still come across all sorts of shenanigans: logical fallacies, insults, tribal thinking, and so on.

Don't fool yourself, you're probably not as Spock as you think. But that doesn't mean we shouldn't try leaving some of our more negative human traits at the door. 


# Look dude: I'm literally the person who created this

I am human too and every so often something will happen on Stack Overflow that really ticks me off. For example: seeing a user confidently post a very misleading or just plain wrong answer for a question involving part of VS Code that I created or am very familiar with. Strangely too, it often seems that the more wrong the answer is, the more likely someone is to state it as a definitive fact.

When I see this happen, I sometimes will go [all XKCD](https://www.xkcd.com/386/) and try to post a correction comment. And a few times, this has spawned heated, twenty comment long threads, for woe be upon me for daring to question their expertise about something I created! Stop always trying to be right you damn nerds! Because I'm right!!!


# It's easy to become cynical in an eternal September

Faced with an endless stream of low quality questions, it's easy to become cynical. Has this user never heard of Google? Do they even know how to put together a coherent sentence? Is this person literally a dog?

I sometimes browse through tens of new questions in a day, and seeing the endless stream of low quality questions coming in day after day in, it's easy to start becoming dismissive or even cynical. This cynicism can even leak into behavior on the site, as anyone who's dealt with an overenthusiastic Stack Overflow moderator or has ever spent an hour or two researching and composing a question only to have it downvoted into oblivion without explanation can attest.

And sure, there are users out there putting zero effort into their bad questions, but I have to believe that the majority of low quality questions are coming from well intended (albeit clueless) users. I always try to remember what it was like being a beginner. When you start off, you don't really know how the site actually works. In some cases, you don't even know the right words to use to express the problem you are facing. That's a tough placed to be in, trust me. And it sucks when you get eviscerate for just trying to ask a question.

While Stack Overflow has done a lot to help new users, there's clearly much more that needs to be done. I personally have been trying to find a good balance between efficiently maintaining the site's standards and being more compassionate to inexperienced users. This could involve me explaining why I voted to close a question or posting a comment prodding the user to share more information. I know I still have lots of room to grow here.

On the other hand, I have no qualms about downvoting users with 50000 reputation who are still posting questions about the "Best VS Code Theme for JavaScript Development?" or who upload blurry screenshots of code instead of text.

# Sometimes I just want to say thank you

Stack Overflow doesn't have much of a thank you culture. At some point, I seem to recall they were even automatically stripping "Hi" and "thank you" from questions. Maybe they still do that; I haven't tested it recently.

Now as anyone who has dealt with customer support well knows, too much politeness can get in the way and even feel artificial. But sometimes, someone will do something completely above and beyond for you on the site, and the only way you can reward them is clicking a little up vote arrow. That's shitty.

Being efficient should not require turning ourselves into soulless automatons. Side channel could allow for more authentic communication and connection between individuals, provided that's something users want to opt in to of course.

# Sometimes I wonder what happens after the answer

Stack Overflow is transactional: people post questions and other people answer those questions. What happens after the question is answered? Who knows? Sometimes I do wonder though. Was my answer even useful in the end? What sort of neat project did it unblock? What did the asker learn afterwards? 

This is an impossible wish of course. Mandating that users disclose how their questions will be used would obviously be hugely problematic, even if you could make it happen. But it is interesting to ponder.


# Gamification is effective...

... at making things into a game.

I still get a little flutter when I see that little +10 or +25 badge in the status bar. Bits of gamification like that are probably the reason I've been coming back for over a decade. But as those years have gone by, I've also started to question just what type of game Stack Overflow is and what winning at it really means.

I'm sure the points system started with the best of intentions: reward people for asking helpful questions and for posting helpful answers. But once you add high scores, [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart's_law) is going to kick in and some subset of users will start optimizing their activity not for maximizing real value but for maximizing points. And that last bit is important because...


# Reputation doesn't actually mean what you think

Reputation does not equal technical competence, communication ability, or even understanding of how Stack Overflow works or is supposed to work.

That's not to say that reputation doesn't mean anything, just that it doesn't mean what Stack Overflow implies it does or what the word "reputation" suggests. Instead, I've grown to understand reputation as a measure of impact. To understand this, consider two hypothetical answers posted on the site:

- One about a common git operation. I answer it in two minutes with a google search and post a 3 line answer.

- One about some obscure graph theory work. Maybe a hundred people in the entire world can answer it. I post a few paragraphs and some example code that explains what the issue is and how to solve it.

Over five years, the first answer gets viewed five million times and accumulates 2000 upvotes. The second meanwhiles gets 300 views and two measly upvotes.

This feels deeply unfair in some sense. Why reward what is essentially being in the right place at the right time? (Not that it's all luck mind you; understanding the game is a huge leg up too.) On the other hand, the first question actually helped a heck of a lot more people than the second ever did. Perhaps we should recognize that in some way, although is the correct recognition really a heaping of "reputation"? 

That's why I consider Stack Overflow's "reputation" to be more a measure of impact. Real reputation can't be measured in a simple points based system, reputation emerges from the community. Who's advice do I listen to, who do I see helping others, who do I trust? That's probably going to be different people too depending on whether I'm working on PHP vs iOS.

Having said that, I'm not sure what Stack Overflow should do about this. Would users be as motivated if they only earned "Tricky Dick Fun Points" instead of "reputation"? Would they still engage as much if there were no points system at all? Honestly, probably not. And the myth that Stack Overflow's "reputation" equals real reputation does not just benefit Stack Overflow but also its most active users. Who doesn't like boosting their reputation after all? Only Spock.

No, as with most things in life, to get the real picture you have to look past the numbers. If a resume comes boasting about having 10k Stack Overflow fun points, take a quick look to see how the person communicates and the kind of questions/answers they are posting. And in all but the most exceptional cases, keep in mind that raw Stack Overflow numbers are a very weak signal of anything beyond that person's Stack Overflow abilities. And sadly, at least in my experience, often not even that. 

# I would not be productive without Stack Overflow

Every time I need to do something remotely complex in git, I wind up on Stack Overflow. Every time I need to do something simple in bash, I wind up on Stack Overflow. Every time I get a weird compiler error, I wind up on Stack Overflow.

I am not productive without IntelliSense, a search engine, and Stack Overflow. In some people's books, this makes me a very bad programmer. I would probably fail a lot of tests and whiteboard problems. So be it. (Seriously, every time I use `.sort` in JavaScript, I have to look up when I'm supposed to return `-1` vs `0` vs `1`, and I write JS all day while developing the world's most popular editor for JavaScript.)

No, stack Overflow is an amazing tool. Only a fool would not use all the tools available to them. Instead, why not be eternally stupid like me? Save your brain capacity for important stuff, such as storing all the plots to Seinfeld or coming up with elaborate puns (which this post was certainly lacking in but which future ones, of a quite different nature, should more than make up for).


# Stack Overflow is a miracle

Stack Overflow lets anyone, regardless of background or technical ability, post programming questions. These questions are answered by complete strangers, most of whom presumably are taking time away from their lives and careers to help out and don't expect any reward.

The fact that Stack Overflow exists and actually works as well as it does is a miracle. And sure it doesn't always live up to that promise, but it's trying. Despite all its flaws, the site has helped countless people over the years, including myself.

Stack Overflow will not be around forever. Something better will come along one day. Hopefully that something learns from some of Stack Overflow's mistakes while also capturing its best qualities. Until then however, I hope that we never learn to take Stack Overflow for granted. It is both a reference and a living community that is constantly being built up bit-by-bit by individuals. If you care about these things, understand that they are not guaranteed and that even small actions—such as helping out well intended yet clueless newcomers—can have a positive impact. When I'm critical of the site, it's because I care and because I know that it could be better.

# P.S.

I was still in High School when I joined Stack Overflow a decade ago. I was just starting to write (ES5!) JavaScript in Eclipse, and back then it seemed like 90% of the answers posted began with: "Using jquery, just ..." Even though I had no clue what I was doing, strangers took time to help me. I don't think I fully appreciated it at the time, but I remember it now.

People will always want Stack Overflow to be different things—a question and answer site; a homework solver; a comprehensive, living reference on programming—and yet for me, as much as the site has grown over the past decade and despite all of its flaws, Stack Overflow is, at its core, still an open community where strangers help each other learn and grow. That's a beautiful thing. I'm glad that I've been part of it for the past ten years and I hope it continues. And for me personally, I hope to learn just as much over the next ten years as I have in the past decade.