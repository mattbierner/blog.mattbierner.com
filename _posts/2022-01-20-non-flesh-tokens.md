---
layout: post
title: "Non-Flesh Tokens"
description: "Collection of 308 NFTs, each representing a unique block of two ultra-high resolution, full-body portraits"
titleImage:
    file: 'title.png'
    replaceListingTitle: true
---

[Non-Flesh Tokens][site] is a collection of 308 image NFTs. Each image is a 512x512 pixel block from two full-body, ultra-high resolution portraits—one of a man and one of a woman. There is one NFT for every segment of these two portraits. The entire collection can be seamlessly reassembled into the original portraits.

**Links**
- [View the collection on Open Sea][opensea]
- [Browse the collection visually][site]

The individual NFTs have been listed in a seven day auction with the same starting bid. In my view, this auction and the longer term evolution of the collection are the real artwork. The act of buying, selling, and exchange, all that jazz.

The NFTs are named using a coordinate system, with the origin at `(0, 0)` corresponding to the square that includes the navel. [Male (-1, -7)](https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/15445115341978895749400258717831267901175031190841581355540861854118479659009) for example is a square from the male portrait that is one block to the left and seven blocks up from the origin. If you also happened to own [Male (0, -7)](https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/15445115341978895749400258717831267901175031190841581355540861960771107553281), you could place the two images side-by-side to create a 1024x512 block of the portrait.

View the collection and place a bid [over on Open Sea][opensea].

# Creation

I worked closely with [Patrick Bennett](https://www.patrickbennett.com/index) and [Greg Probst](https://www.gregprobstphotography.com) to pull off this project. Greg has a deep knowledge and experience capturing multiple exposure imagery of land-, sea-, and cityscapes with [VAST](https://vastphotos.com), while Patrick brought an eye for people photography, technical abilities, and production experience.

Here's Patrick talking about some of the technical aspects of Non-Flesh Tokens:

> The magic of this project rests in the creation of multiple camera exposures resulting in ultra high-resolution files of a single scene. Greg and I researched for weeks and created a system using eight separate cameras to photograph a moving subject and still create an ultra high resolution image as a result. We used multi-camera triggering software—[Smart Shooter](https://tethertools.com/product/smart-shooter-4/)—to fire eight cameras in sync. Limitations of the software required opening all eight shutters and triggering the flash to coincide. We used rear curtain sync with one camera having a shorter shutter speed set to trigger the flash while the other seven were open.
>
> After shooting some 200-300 shots (x 8 cameras) of each model to get the perfect shot, the next step was stitching the images together with [PTGui Pro](https://www.ptgui.com). Although the eight identical [Canon](https://www.usa.canon.com) 5D Mark IV cameras and 135mm f/2.0L lenses were placed as close together as possible, parallax issues remained that required fully utilizing PTGui advanced masking between images to overcome.

{% include image.html file="capture-1.jpg" %}

**Equipment used:**
- 8x Canon 5D Mark IV Cameras
- 8x Canon 135mm f/2.0L Lenses
- Custom made camera rack
- Profoto studio strobes
- SharpShooter 4 software
- ptGui Pro software
- Lightroom for organization
- Photoshop for final retouching

{% include image.html file="capture-2.jpg" %}

The models are [Jessa Ray](https://linktr.ee/JessaRayMuse) and [Eddie Arriola](https://delightfulmachinations.photo). Both did an exceptional job exploring different poses while also keeping within the odd parameters of the shoot. [Katya Gudaeva](https://www.katyagudaeva.com) provided subtle make up artistry to enhance their already great physiques.

{% include video.html file="creation.mp4" poster="creation-poster.jpg" attrs="controls" description="Timelapse showing the many portraits captured to get the two final images" %}

After reassembling the portraits into two ultra-high resolution images, I then broke up the images using a simple Python script and [Pillow](https://python-pillow.org). I selected a grid size with squares that are large enough that you can still recognize various body parts in them, while not being so large as to feel like simple crops of a normal portrait. I did my best to keep key areas like the face intact, while also trying to reduce the number of squares that are mostly empty save for a sliver of flesh.

The final stage was listing the resulting 308 blocks as NFTs [on Open Sea][opensea]. While I like how straightforward Open Sea's presentation of the collection is, I also put together [a simple website][site] to browse the NFTs in a more intuitive manner.

{% include image.html file="capture-3.jpg" %}


# Creator Commentary

Non-Flesh Tokens is a project that I've been thinking about for a long time. The idea of auctioning off abstract blocks of flesh (albeit in image form) just struck me as an interesting and rather humorous way to look at objectification and image culture. Which parts of the bodies would be most valued for example? Would an eye fetch a higher price than say a nipple? Would a dastardly cabal of foot fetishizing oligarchs drive the price of toes through the roof? However I wasn't sure how to bring this idea to life.

Initially I considered printing physical copies of each block and then auctioning these prints off. However this would both be expensive and would depend on drumming up enough interest to make the initial auction a success. Furthermore, an auction would be a one time event. I really wanted to track the long-term prices of these blocks. And here, NFTs turned to be just the solution I was looking for.

Choosing to engage with NFTs at all will doubtless prove controversial in certain circles. And I get it! To put my thoughts on the subject in the politest terms possible: I do not feel most of what is happening in the NFT space deserves the level of attention it has received. What is art's place in a hyper image saturated world where almost anything can be cheaply reproduced? I don't know, but encoding crusty old ideas of scarcity, authenticity, and ownership is not the answer. If you care about art, support artists. You don't need blockchains to do that.

But I'm starting to rant.

Anyways, NFTs as medium actually do have a few interesting properties (all the more so when your goal is to not so subtly comment on the very ideas the medium encodes). Most relevant for Non-Flesh Tokens, NFTs publicly capture the entire transaction history of a given item. This makes it possible to look up the current prices for each individual piece, as well as tracking how those prices have evolved over time.

While I am quite proud of the two portraits and the resulting 308 individual images we created, for me the heart of this project is the collection as a whole. If Non-Flesh Tokens is successful, the collection will come to reflect those who consume it. Engaging with Non-Flesh Tokens by buying or selling or exchange is what builds the artwork. <!-- And just when you finally wrapped your head around selling jpegs, here I come trying to sell you the buying and selling of jpegs. (and then there's the performance of me selling you the buying of selling of jpegs :) -->

I am eternally grateful to Patrick and Greg for helping to realize this project technically and creatively; to Jessa and Eddie for their exceptional work and willingness to take on this admittedly strange project; and to all the other people who made this project possible. I've also tried to make sure any profits and royalties from this project are fairly distributed to all of those involved.

But now Non-Flesh Tokens is live. What will the interest be like? Will people understand the underlying ideas? Will any of the pieces even sell? Maybe. All I know is that my role here is done. What happens next is out of my hands.

By the bye, if you'd like a hand, check out [Male (2, -7)](https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/15445115341978895749400258717831267901175031190841581355540862008050107547649) or [Female (1, -12)](https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/15445115341978895749400258717831267901175031190841581355540861795844363386881). Bidding start at 0.02Eth.

[site]: https://nonfleshtokens.com
[opensea]: https://opensea.io/collection/non-flesh-tokens