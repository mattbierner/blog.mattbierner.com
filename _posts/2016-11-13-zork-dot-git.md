---
layout: post
title: "Zork.git"
date: '2016-11-13'
description: 'git commit -am "go west"'
titleImage:
    file: "blame.png"
---

{% include image.html file="blame.png" %}

[GitHub Game Off 2016](http://gameoff.github.com/) is upon us, and this year's theme of "hacking, modding and/or augmenting" seemed right up my alley. But not content with using Github to *merely* store the source code *for* a game, I decided to meta it up with something far, far more literal: using git to play a game itself. So allow me to introduce the most git of games: *Zork.git*.

**Links**

- [Game repo][game] - Where the game is played
- [Code and Instructions][src] – How to play and code used for running the game
- [Game off entry][gameoff] – Entry for game off


# About
*Zork.git* uses a git repo and Github to play the classic interactive fiction game [Zork][zork].

The `README` file in the repo serves as game input and output:

```
=== West of House | Score: 0 | Moves: 0 ===
West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

> 
``` 

To play the game, simply:

* Fork the [game repo][game]. 
* Edit the `README` to add your desired command after the `>` on the last line. To enter the command `go north`, edit the last line to read `> go north`.
* Submit a pull request with the edit against the game repo.
* Wait for the bot to automatically merge in the PR and update the target branch with the new output.

```
=== West of House | Score: 0 | Moves: 0 ===
West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

> go north


=== North of House | Score: 0 | Moves: 1 ===
North of House
You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees. 

> 
```

What could be more hacking than this? What more GitHub? Truly, a glorious age of git gaming is before us. (Although this is all coming from a man who [uses C++ templates and his compiler to play Tetris][Tetris], so...)

[Here's more information about playing the game][src].

{% include image.html file="submit-process.gif" description="No need to fumble around with a clunky terminal, you can play Zork.git entirely online using Github!" %}


# Inspiration
I've explored using git in non-standard ways before, including last year's *[80x40][80x40]*: an 80 by 40 character block of text stored in a github repo. Anyone can edit this block of text by submitting pull requests (I wanted beauty, but all I got was a bunch of dicks).

This time around, I thought it would be interesting to explore the branching nature of games using git, and interactive fiction is a perfect fit. Each command and its result are stored in the commit graph, and you can branch off the graph at any point to explore choices and consequences of these choices. Similar to 80x40, the current state of the game / README is not the real product, rather the repo itself is the product.

Git doesn't lend itself well to all game types, but there is a lot of potential beyond interactive fiction, and turn based game specifically are a natural fit for the git model. It's easy to imagine setting up a game of chess or Go or checkers that has two players submitting automatically merged PRs against a repo, and I firmly believe that it's only a matter of time before we see *DwarfFortress.git* and, of course, *Pokemon.git*. Make it happen.


# Try It Out
{% include image.html file="pr.png" %}

So if you want to game like a true hacker, head on over to github and [give *Zork.git* a try][game]. It's something.

Please [report any issues you run into][issues] (the bot is almost certainly going to start crashing horribly at some point). And checkout the [source code for the bot][src] if you are interested in contributing.



[zork]: https://en.wikipedia.org/wiki/Zork

[zork]: https://en.wikipedia.org/wiki/Zork
[game]: https://github.com/art-dot-git/zork-dot-git
[issues]: https://github.com/art-dot-git/zork-client/issues
[src]: https://github.com/art-dot-git/zork-client/

[gameoff]:        https://github.com/mattbierner/game-off-2016/


[tetris]: /stupid-template-tricks-super-template-tetris
[80x40]: /80x40