---
layout: post
title: "The war we forget in our embrace of streaming"
description: Thoughts on how DRM was perfected in plain sight, and the risks streaming poses to culture.
---

I listened to Spotify for somewhere around 650 hours in 2019. That works out to a little over 27 solid days. That's a lot of music!

I'm from the iPod generation, so the novelty of millions of songs in my pocket for $10 a month hasn't entirely worn off. Spotify has changed my life. That's only a minor exaggeration. In the old world of record stores and $0.99 iTunes singles, I never would have discovered artists like [Jeremiah Kane](https://jeremiahkane.bandcamp.com) or subgenres like [Italian Horror Disco](https://giallodiscorecords.bandcamp.com/album/apocalypse-domani) which have had big impacts on both my day-to-day life and my creative work. The other great thing about streaming services like Spotify is that they let me focus on what I actually care about: the music! No more hours spent ripping CDs or scouring Limewire, no more nights wasted managing a media library and transferring songs between devices. It's been so freeing.

Those 650 hours were on just one streaming service too. For a few bucks more a month, I can also stream tens of thousands of movies and shows through services such as Amazon or Netflix. And that's all without even touching on services such as YouTube! If anything, the biggest problem facing consumers today is that there's far too much content to choose from.

I've been happy gorging myself at this media buffet for years, until a recent project got me thinking about what shifting to a streaming only world means. Because while services such as Spotify or Netflix are in many ways better than what came before, it's still worth trying to understand what we risk losing in this transition.

I have rarely seen this topic discussed in terms that I connect with. In this post, I want to go beyond typical concerns such as losing access to your library when your subscription lapses, to instead focus on how streaming can effect culture, and specifically remix culture. For, despite the flashy apps and all the billions and billions of dollars spent on new content, I've come to believe that streaming services take user control away and are actually quite regressive in many respects.

Ultimately, I feel that the biggest threat of streaming is its view that media is meant only for consumption. This view would be dangerous enough if it were restricted to the domain of streaming, but with streaming currently busy eating the world, I fear it will also come to dominate how we think about our media more broadly. This won't happen overnight. In fact, we may not even realize that it is happening. The convenience and selection that streaming media promises has blinded us and made us forget a war that we (or at least the most nerdy ones among us) used to care deeply about: the war on DRM. By abandoning this war, we risk losing not only practical control over our media, but also our ability to imagine what our media can be and how we can relate to it differently.

# The Beginning

Before we continue though, a word about me: I'm not a musician, I'm not a video producer, and I'm certainly not a copyright lawyer. I'm just a nerd who likes music.

So what inspired this post? Well, to be perfectly honest, it was born from self interest. Streaming and DRM weren't subjects I had ever given much thought to, let alone wanted to spend a weekend writing about. I was pretty happy with the status quo. That starting changing when I ran into a problem a few months back while building a new app.

You see, for the longest time I've wanted to use technology to somehow make the world dance along to my music. This year I finally figured out how to pull this off well. So for the past few months, I've been working off and on to create an augmented reality music visualizer iOS app. The app uses music to distort your walls/floors, creating wave patterns and other fun visualizations that look like they are distorting the real world's geometry. It's pretty neat!

During prototyping, I used a hardcoded audio file which let me focus on building the basic AR effects. To actually ship the app though, I wanted to let users select their own music. It sounded simple. However, I quickly hit a number of roadblocks.

Here's an abridged version of my quest to add a music selector to my iOS app. Again my goal was simple: let users play their music with my app's visualizer. On the technical side, the only important note is that the visualizer is driven by raw audio data.

1. Try adding a media selector to the app using Apple's built-in media picker UI: [`MPMediaPickerController`](https://developer.apple.com/documentation/mediaplayer/mpmediapickercontroller).

    Discover that `MPMediaPickerController` shows nothing because I don't actually have any songs in my phone's music library.

1. Remember that all of "my music" is actually in Spotify. Remember that Spotify has [an API](https://developer.spotify.com/documentation/)!

    Discover that Spotify's API is really more for remote control style apps. There is no way to access the raw audio data I needed for the visualizer.

1. Check if Apple Music has an API I can use.

    [Same issue](https://developer.apple.com/musickit/).

1. Try downloading a song that I purchased on iTunes 10+ years ago.

    Discover that while the song now shows up in `MPMediaPickerController`, my app can't access the raw audio data because the old song still has DRM.

1. Go to Bandcamp, download a DRM free song, copy it over to my phone.

    Finally `MPMediaPickerController` works! Except I don't own many of the songs I'd like to try in the app. Plus, now I have to manually copy music around like it's 2003?

1. Suspect that many users will be in the same boat, so see if my app can use a low level audio API to access the currently playing audio on the device. 

    Discover that this also does not seem possible, likely for content protection reasons. (Although I won't go so far as to say it is completely impossible. It may be possible if the music app your app tries to listen to consents or if you are some sort of iOS audio wizard.)

The only way I've found to let users easily visualize their music is by recording from the microphone while music plays over the speaker. Existing music visualizer apps that I've found on the App Store seem to have similar limitations. This just seems crazy to me!

So that's where this post came from: I wanted to build a silly app about making walls dance, and streaming/DRM got in my way. The motivation is not exactly noble sounding when I put it in those terms.

But the app development problems I ran into aren't nearly as interesting as the thinking they inspired. These problems got me thinking about big concepts like ownership and remixing. And this helped me realize that streaming takes away user control. Understanding all this got me wondering not only about the consequences of this loss of control, but why we mostly all have been just fine with this.

# The Problem with Streaming

To watch Netflix, you have to use the Netflix app. To watch HBO, you have to use the HBO Max app. To watch Disney, you have to use the Disney Plus app.

Seems obvious enough. But why?

Why do I need apps from these providers at all? It's not like using the Netflix app is some magical experience. 95% of the time, it's just a fullscreen video. Any html `<video>` tag can do that!

So as long as my Netflix subscription is valid, shouldn't I be able to load up Netflix content in any number of third party apps? Who knows, some of these third party apps might work on older or more niche devices that the official app doesn't support. They may even have some neat UI ideas or unique features. After all, if anyone could develop a Netflix viewing app, then developers would have to work to make their app stand out from the pack. Having a vibrant app ecosystem seems like it would be a plus for these streaming providers, right?

But this gets to one of the fundamental misunderstandings that I had about streaming services. This misunderstanding explains why I just kind of assumed that it would be simple to hook my AR music visualizer up to a service like Spotify or Apple music.

Let's take Netflix for example. When I first subscribed, I imagine that my $12 a month was buying me unlimited access to a huge library of Netflix content. However that's not strictly accurate. Instead, my subscription lets me use sanctioned Netflix apps to view Netflix content. And while this distinction may seem like splitting hairs—especially when Netflix sanctioned apps exist for just about every modern device—I believe understanding it is a key first step in seeing the limitations of our current crop of streaming services.

Stepping back, I can sort of understand why streaming providers do this. If I were feeling particularly generous—or, if I were in marketing—I could probably even BS together justifications about how this setup actually benefits consumers too. Something about how the Disney app is specially designed and optimized for Disney content, and how all this vertical integration provides customers with the best end-to-end user experience. After all, we're not just talking about apps here, but entertainment experiences! On the technical side, I also know that if you control both the frontend and backend, development and maintenance are simpler.

But seeing as my generosity reserves are now thoroughly depleted, I must also bring up three little letters: DRM. For controlling the entire pipeline also lets streaming providers control how their content can be shared and interacted with. That sounds a whole lot like DRM to me, even if it's not explicitly called such. The fact that the streamed media itself is also encrypted is more of an implementation detail.

<hr class="bullets">

So what's the impact of linking content to an app? Well, simply put, it limits user control. Any control users have must be granted by streaming providers, who currently have little incentive to grant users anything meaningful.

The best analogy I can think of for this setup is that of a jukebox. A jukebox lets you play a large library of songs on demand, however browsing and selecting a song is basically all the control a jukebox grants to you. You certainly aren't allowed to take some of the records out of the machine and play them on your own record player. Nor is there any way to change how the music is played. Want to play a song at half speed, or play two songs at the same time, or play a song in reverse? Not possible.

The more I've thought about it, the more it seems entirely appropriate that the analogy I landed on here is so old school. For aren't we in the internet age after all? Aren't we all about hypermedia and embedding and whatnot? Yet do you find those capabilities in any of our big streaming apps? No! Although these apps use the internet and are quite technically flashy, they still operate using a very old school view of media and user agency.

I think the core issue is that our current streaming services are built around a fundamental conviction that media is an end product. This worldview only has space for consumption. There's no remixing, no cross referencing, no embedding into my own work that can then itself be remixed and cross-referenced and embedded. HBO Max even goes as far as to completely block screenshots on iOS. If I only have an iPhone, I can't even share stills from HBO shows to comment on them or to create memes.

Yet simply dismissing streaming provider's understanding of media as regressive also feels inaccurate, for artists have always been remixing and combining works in creative ways. Sampling for instance helped create new genres of music, such as hip hop and a whole fractal ecosystem of electronic subgenres. Sampling is definitely pre-internet. The best remixes use material in ways that the original artist could never have imagined, building up something new that potentially eclipses the original work. The art collages of the early twentieth century are a perfect example of remix culture in action: they took advertisements and other low value commercial detritus, and turned it into art. 

A key trait that makes this remix culture possible is that once an artist releases their work into the world, they lose some of their control over it. They can not control how people understand their work or react to it for example. And, for personal media at least, in the past an artist couldn't even control how their work was consumed. A record for example suggests that it should be played in a standard way, but there's nothing stopping a consumer from plopping that same record down in a turntable and going to town.

The way that streaming services marry content to its delivery is something different, perhaps not entirely novel but certainly executed better than ever before. It's like the movie studios also controlling the only theaters where their work is shown. It's control, almost perfect control over how content can be used. And streaming providers use their control to limit their content to one thing: consumption. No matter how heated the so-called streaming wars get, I don't see this changing because all of the big providers operate with a consumption-only worldview. 

This would all be odious enough if the artists themselves were in control. Instead though, it's massive, multibillion dollar corporations who have hoovered up decades of old content while also funding a wave of new stuff. 

<hr class="bullets">

Before discussing the impacts of streaming's consumption-only worldview, it's worth acknowledging a few points.

For one, many of the problems I've covered so far are not unique to streaming. Nor did they start with streaming. Copyright and various forms of DRM have limited remix culture for decades. If anything, DRM and copyright have only gotten more aggressive as technology has made remixing more accessible.

I'm focusing on streaming in this post because I feel it epitomizes the push for limiting user control. I'd even go as far as to argue that streaming is a possible end game for DRM. Remember what all those free culture graybeards were yelling about over on Slashdot back in 2000? Well now it's here. All that's left is for our content providers to also own our internet plans and the devices we use for consumption. But hey! That dystopian future isn't very distant at all either, what with Apple and Amazon both producing content, apps, and devices, while Comcast and AT&T are only missing their own brand of locked down consumption devices.

Secondly, there are still alternatives to streaming. You can still purchase physical or digital copies of most shows and movies. Sure they will probably have DRM, but you can still "own" them. This isn't universally true though. Some content is currently only available for streaming, and I suspect this will only increase as physical media becomes even more irrelevant and as the streaming wars further heat up.

Of course there are also many non-sanctioned ways to workaround the limitations of streaming services. Heck, you can even use a second phone to take a picture of a video in HBO Max if you really want to share a still from one of its shows. Piracy will always exist. However I'm mostly ignoring it in this post because I consider it to be, at best, a workaround. I also feel that easy availability of pirated content risks making the very real problems that we are facing with respect to DRM feel less critical.

And on that note, it's also worth remembering that culture will always find a way. Cut off one avenue of expression, and people will find new ways to interact with media and make it their own. They will find workarounds. They will find new ways to express themselves. Nothing can block that.

This last point has left me wondering if I'm perhaps clinging to the past while culture has simply moved on. After all, we have image and video memes! We have the TikToks! We have live musical performance spectacles in our shooty games! Things are still being created. Media is still being remixed. What's there to get all worked up about?

And yet I can't escape the feeling that we risk losing something important when our media becomes locked into specific apps. Perhaps it's not even a tangible something so much as losing possibility.

<hr class="bullets">

As I said, I'm iPod generation so I still operate on a file based mental model of media. From a fairly young age, I was ripping CDs into audio files and transferring those files to my iPod using iTunes. When I think about Spotify, I still imagine it as just a really, really big shared file server. Same for Netflix. Even Youtube.

This file based mental model has shaped what I think of as being possible with media (and, as a meta point, has clearly influenced this post). I know I can drag and drop mp3s into iMovie or GarageBand for example. I know I can feed audio files into scripts. And I know I can really [whip the llama's ass](https://winamp.com) by playing my mp3s with a bunch of neat visualizers. When I was growing up, none of this was arcane knowledge either. Even the jocks in middle school were talking about Limewire and sharing CDs to rip. 

I find it interesting to consider how my understanding of media would be different if I were an average kid growing up in the late 2010s instead. For example, it's possible this hypothetical generation-alpha version of Matt <!-- who doubtless works much harder than I do, because he's so frightfully clever --> would have never used a traditional file explorer. It's possible he would only have seen video through apps such as YouTube. How would this shape his understanding of media? Would he considered media to be tied to the apps themselves? And let's say he understood media as being linked to specific apps, how would this understanding influence what he would think of as being possible with it?

The point of my little thought experiment is not to claim that kids like myself who grew up using iPods are somehow better than kids who grew up using Youtube. No. Culture evolves, and those kids who grew up with a more app based understanding of media may well come up with possibilities that ol' iMatt here never could have imagined. But I do think that the ways in which we consume media shape our understanding of what is possible with it. Specifically, I think it's worth trying to understand how it can limit us.

My file based mental model for example has many clear limitations. It doesn't naturally account for something like a turntable for example. To the extent that I think about turntables, they are more of a novelty than a core part of music. If turntables didn't exists, I never could have come up with scratching or anything remotely like that on my own. My file based mental model just doesn't have room for it.

This observation has left me wondering about all the possibilities that I am unable to see because of how I think about media. My guess is that some of my mental blinders can be attributed to copyright, or perhaps because I naturally think of media as being a fixed and finite thing created by a small set of producers for many consumers.

Yet these are just the blinders that I am aware of. The more concerning ones are those I don't even realize are there. In a turntable-less alternate universe for example, not only would I never have been able to invent scratching on my own, I would not have even realized that scratching was absent. The very nature of these unknown blinders makes it impossible for me to imagine what might lie beyond them. Whatever it is though, I'd like to imagine that it's probably pretty beautiful. 

Bringing things back down to earth, while it is a tragedy that current streaming services block potentially innovative third party apps and silly AR music visualizers, those are both limitations that I can clearly see because I grew up using media player apps to manage files on a PC. Yet I can also imagine that someone growing up in a streaming only world might not realize these same limitations even exist. Losing something without even knowing its value, or indeed that something has even been lost in the first place, strikes me as an even greater potential tragedy.

By tying content to specific apps, streaming amounts to an assault on the possibilities of our media. Not only does streaming not care about opening up more possibilities for the future, it is actively working to restrict some of the few freedoms we once had with our media. Perhaps one reason we've largely accepted this loss of control without complaint is that we've mistaken the control to choose what media we consume and put into our collections with true control.

Over time, I fear we will start to internalize streaming's read only view of culture more and more, until streaming effectively bounds our conception of what is possible with media. If we let this happen, we won't know what we've lost, let alone what might have been. No one will mourn. Culture will go on. And yet the world will be a little more empty.

# The War We Forgot

Try as I might though, I find it difficult to get too worked up over streaming. Yes losing control is bad, and yes it's sad to think about lost potentials and whatnot, but I also can't think of too many cases where streaming has negatively impacted my life in concrete ways. There's my visualizer app, maybe a few aborted project ideas.

On the flip side, I can list off positive effects of streaming on my life. For example, it's helped me discover some great artist and works that I never would have otherwise. I also listen to far more music, and of far greater variety, than I ever did before thanks to Spotify.

I feel that I should be angrier. I feel that by admitting that streaming has benefited me, I'm betraying the arguments I'm trying to makes in this post. After all, what am I doing writing all this if I'm not even strong enough to boycott Spotify out of principle? But over the course of writing this post, I've come too realize a few things about my lack of rage.

One, I believe that my lack of anger over streaming is hardly unique. I suspect it's probably the norm actually. This next statement may come across as terribly elitist, but the majority of consumers are just that: consumers. They just want to watch their movies and listen to their music. Heck, that's usually all I want too. If you were previously buying/renting DVDs to watch for example, then streaming brings many tangible benefits without many downsides. The main complaint I hear voiced about Netflix does not concern lack of control, but that its huge selection makes choosing what to watch difficult.

The other thing I've realized is that lack of anger is, if not a intentionally designed feature, than at least a side effect of streaming. It's also one of its most insidious aspects. Not insidious like product placement, or sponsored content, or even like Comcast tacking on a 10 buck a month "regional sports" fee to your bill, but more like the perennial field of poppies that lulls travelers to sleep: "Come," Netflix softly coos, "Sit down. Stay a while. Isn't the ground soft? Doesn't that warm breeze feel nice? Sky so blue. Reds so vibrant. Stay, relax, and forget all your troubles, for this is consumer heaven. This is as good as it gets. No need to ever leave."

<hr class="bullets">

It wasn't that long ago that using words such as "war" to describe the fight against DRM was only a mild bit of hyperbole. The war against DRM was one of the few pure good vs evil struggles of my youth. On one side was the RIAA, the MPAA, and Lars Ulrich. On the other: the rest of us! The underdogs! The rebels! And sure, at least at my level, much of this "war" consisted of forum posters griping to an audience that was already solidly on their side, but at least DRM was something people actively talked about. 

Today though, I rarely see DRM discussed except in the most egregious cases, such as always-on DRM or games whose DRM [decreases performance](https://www.extremetech.com/gaming/282924-denuvo-really-does-cripple-pc-gaming-performance). Past concerns about losing control of one's media collection have largely been forgotten in the face of Spotify's millions and millions of songs and Netflix's ever expanding library of splashy original content.

I've seen this happen in my personal life too. Even friends who used to manage massive media libraries on personal file servers, and who—if the MPAA was to be believed at least—once would have carjacked you without second thought just to get their hands on all those juicy cassettes rattling around your glovebox, have largely moved to subscription services without complaint.

I understand these are just a few personal anecdotes and observations. Doubtless there are many counterexamples, places where DRM is still being actively debated and fought. The best I can do in terms of hard data, is pointing out how Google Trends [also shows](https://trends.google.com/trends/explore?date=all&q=DRM) interest in DRM decreasing over the years. Interest in torrents also [peaked around 2009](https://trends.google.com/trends/explore?date=all&q=torrent,BitTorrent) (which, although this may only be correlation, was the same year iTunes went entirely DRM free and right around when streaming services started becoming more mainstream).

I can't rigorously explain what may be behind decreased interest in DRM (assuming there was even a decrease in the first place). I can only speculate. That's what this is.

My hypothesis is that DRM simply does not matter to most people anymore. It doesn't touch their lives in obvious ways, the way the DVD region codes and iTunes DRM singles might once have. I suspect most people would not even consider streaming a form of DRM. It rarely gets in the way and most streaming services are available on basically every device you own.

Streaming's limitations still feel natural too. Why of course you need to use the Disney app to watch Disney content. Why of course you can't process a Netflix show using a custom script. There's no mainstream streaming provider that shows us what a more open platform could look like.

And why would you even want to download something in the first place these days? I can find just about any song on Spotify. If I don't want to pay, I can listen to it on the Spotify free tier or on Youtube. Why would I download a song when it's presumably always going to be just a few taps away? If anything, downloading is an extra burden without many benefits. Streaming services make listening so convenient that users have few reasons to go outside them.

If the vast majority of users just want to consume media, doesn't streaming make that simpler and cheaper than ever before? It's a new golden age! What's so bad about that?

<hr class="bullets">

Streaming's first trick was that it successfully sold itself to us as our liberator. It seemed like a classic case of Silicon Valley disrupting a crusty old industry. Compared to cable companies and the MPAA, Netflix and Spotify were veritable Robin Hoods! They made huge collections of media easy to access for fairly low rates, and soon were funding a wave of original, high-quality content too. That's all good, right?

For its second trick, streaming won a place in our hearts. Its convenience and flood of original content won over all but the most steadfast holdouts. Streaming also lulled us into believing that we had finally arrived at some sort of media Xanadu: a world whose stately pleasure palaces are perfect, never to be improved upon, except perhaps by increasing the selection and scale of their myriad amusements.

As a result, we no longer seem to care about the DRM that streaming services themselves represent and are built on. We also seem increasingly apathetic about DRM more broadly. After all, why does it matter that our physical and digital media often still has DRM when we can stream the same content for "free"? We've forgotten the war on DRM. We forgot it and few seem to care.

The sad part is that we forgot this war right as it looked like the tide was starting to turn. It took a while, but us nerds and our [inexorably advancing wall of ice](https://xkcd.com/86/) were sort of crushing it for a time.

When industries tried to impose even more aggressive forms of DRM back in the late 1990s and 2000s, we successfully pushed back. DRM free platforms such as Bandcamp and gog and Itch.io stand as testaments to our victories. We even converted iTunes! And rather than destroying culture as the RIAA and MPAA claimed, these DRM free platforms are vibrant. If anything, these spaces are where the real cultural innovation is actually happening these days. It also turns out that many people will still buy stuff if you make it easy and let them connect to the artists they love. Not treating all of your customers like criminals probably helps too.

But looking back, maybe we only succeeded in saving a world that was already destined for irrelevancy. We were so focused on winning control over our mp3s and mp4s that we never saw streaming coming.

Already, many people have embraced streaming for all of their music and video needs. Soon it will be widely used for games too. It seems almost inevitable that eventually the majority of our mainstream media will only be available on locked down streaming services, services which may only be accessible from locked down devices. And, when this happens, it won't matter that your AAC files are DRM free any more than it matters here in 2020 that you can record live TV with a VCR.

And rather than protest all this, rather than take a stand, we let ourselves be won over by the promise of a lifetime of content at our fingertips. We sold our control out for $12 a month. We gave up on possibility. We stopped fighting. And, in a bitter twist, it was not some grand victory that caused us to finally lay down our arms but the arrival of streaming itself, in whom we fantasized we saw not our future tyrant, but our liberator.

# The End?

If anything, I now feel more resigned than angry. I can reassure myself that culture will always find a way. I can find comfort in the fact that small, innovative, DRM-free communities are thriving. And yet our collective embrace of streaming only seems to be accelerating. Not only does everyone seem just fine with that, I also don't see much discussion weighting the benefits and downsides of streaming.

To be fair though, I only started caring about streaming when it effected me directly. Over the course of writing this post however, I've started to realize just how much streaming has effected me over the years: from minor indignations—such as not being able to share screenshots from shows on HBO Max; to larger ones—such as not being able to hook up my AR music visualizer to services like Spotify or Apple music. While writing this post, I've also remembered projects that I've abandoned early on because I couldn't legally get a DRM free version of a movie and I didn't feel like pirating it.

Plus now when I see all the articles praising Netflix's newest shows, I can't help but think, "Is this really as good as it gets?" What sort of apps might have developed if Netflix wasn't so locked down? What kind of creations and experiences could have been? What sort of possibilities could have opened up?

I see all this but, to be honest, I don't know what to do about it. We've all seen how effective #DeleteFacebook is, and Netflix and Spotify are certainly no Facebooks. Besides, even I have to admit that I still like using Spotify, even though my understanding of it has evolved. <!-- For what it's worth, I gave up Netflix years ago in favor of Amazon Prime, mostly due to Netflix's inexcusable lack of "Ninja 3: The Domination" and other classics of cinema. I've never looked back. -->

Maybe the best course of action is to support free cultural spaces. This doesn't mean that you have to go full drop out right away, but maybe instead of committing to another Netflix show, seek out some smaller creators and interesting communities. Small, friendly communities that provide space for anyone to contribute are especially valuable. 

For example, while I know it's not much, I have started buying more music on [Bandcamp](https://bandcamp.com). I do this even though I can listen to it all on Spotify. I started doing this when I realized that my most listened to Spotify artist of 2019 (Robert Parker) had received—and this is the optimistic number—two dollars from my hundreds of streams. Two dollars for creating music that often formed the soundtrack of my year. Robert Parker is one of the more popular artists in my rotation, but he's no Drake. Supporting the artists you love matters, especially the smaller they are. I specifically use Bandcamp because it offers DRM free music and only takes 15% of digital purchases.

My hope is that this post may have raised some question about streaming services for you. Even if you enjoy your current subscriptions, it's worth understanding the downsides and potential negative impacts of these services. Just because they are in some ways an improvement over what came before, that doesn't mean that they can't be better or that we shouldn't fight to make them better. We should always fight for a more open future, even if we can't see what this future may be like.

<br>
<br>

*P.S. I'm looking for developers/artists to create fun AR visualizers for the app mentioned in this post. This is paid work and is pretty open ended. If you're interested, [let me know](https://twitter.com/mattbierner).*