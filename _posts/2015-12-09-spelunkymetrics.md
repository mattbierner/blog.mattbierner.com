---
layout: post
title: Spelunkymetrics
date: '2015-12-09'
titleImage:
    file: "spelunky-avg-time-to-die.png"
---

After my recent experiment [visualizing Spelunky gameplay input Etch-a-Sketch style][etch], I decided to make one more pass over the data. No pretty pictures this time around, but lots of charts. Charts are good too.

The scripts used are all on [Github][src].

# Speed
Speed is addictive. After beating Spelunky that first time, next I pushed to complete the game in under fifteen minutes, and then ten, and then eight, and then five. For the 150 runs in this data set, my goal was always the same: complete the game as fast as possible. This distribution shows how long it took to reach a given level during those 150 runs.

{% include image.html file="spelunky-time-to-reach-level.png" %}

The relatively small time variation across all of these runs is somewhat striking. Even the later levels show only a 160 second difference between the fastest and the slowest times. If a more diverse set of runs had been recorded – aiming for points or saves or kills, or trying to reach the *City of Gold* – I believe the times would show a much greater distribution.

My rush to complete those first few mine levels has led to no end of [YASDs](http://spelunky.wikia.com/wiki/YASD). In the 150 recorded runs, the shortest one lasted a staggering 2.392 seconds, a duration that, however brief, happens to be just long enough to impale oneself on some spikes. 

At nearly 250 times the length, the longest recorded run lasted 588.439 seconds (one of the two winning runs). Considering that the gold time achievement in Spelunky is unlocked by beating the game in under ten minutes, even this run was pretty fast for normal play. This speed is nothing to boast about however, since the fastest speed runs are closer to the two minute mark. 

## Sprinting
Even though I know that I've gotten better at Spelunky, I can't help but feel that I also die a whole lot more than I used to. Sprinting may be partly to blame. Many a game have I begun with the utmost confidence, only to send the poor spelunker sprinting headlong into an arrow, which sends his limp body hurling through the air into a bat, before he bounces off a ledge into pit, falls several hundred feet, and comes to a comfortable repose atop a bed of spikes, all within the first five seconds of gameplay. 

{% include image.html file="spelunky-percent-sprinting.png" %}

I've played the mine levels so many damn times that I often try to rush through them at speeds that outpace my ability. The mines are certainly somewhat better suited to sprinting than other areas, especially when compared to the ice caves, but that alone does explain why twice the amount of time is spent sprinting in the mines compared to any of the other levels, boss battle excluded. I think a big part of this differences is that, in later sections of the game, I start to play more cautiously, having already invested some time and effort. 

## Time Per Level
The average time it took to complete a level was a little over twenty seconds:

{% include image.html file="spelunky-avg-time-to-complete.png" %}

The temple levels took the longest on average. While mine levels and jungle levels often have pits that bypass many layers of the level, and the ice cave levels are completely open, paths through the temple levels are usually more linear and wind across the entire board.

Unsurprisingly, the average time to death follows a similar pattern:

{% include image.html file="spelunky-avg-time-to-die.png" %}

And so does the minimum time it took to beat a level:

{% include image.html file="spelunky-min-time-to-complete.png" %}

## Life and Death Histograms
Breaking out individual runs into a histogram reveals a few points hidden in the charts above.

{% include image.html file="spelunky-level-time-histogram.png" %}

This histogram buckets level completion times using three second intervals. The data is normalized, so each bar represents the percent of runs in that area there were completed within that period of time.

One interesting point: a relatively large percentage of ice cave levels were beaten in under twelve seconds, with a long tail stretching out to the sixty second mark. There is a simple explanation for this. In about half of the runs where I reached the ice caves, I had acquired either a jetpack or a cape, two items which allow beating these levels very quickly.

For the sake of completeness, here's a similar histogram showing death time distribution for each level

{% include image.html file="spelunky-death-histogram.png" %}

This chart is based on only about one fifth of the data compared to the level completion histogram. There's not really enough data to make any conclusions about the Ice Cave or Temple levels (which only had five data points total), but the number of mine level deaths under six seconds is pretty Nick Cage. 


# Spelunky = Keys + Time
Now let's look at what keys were being pressed during all that time. A total of 37505 keypresses were recorded during the 150 runs. Here's the breakdown:

{% include image.html file="spelunky-keypress-breakdown.png" %}

Jump stands on its own as the most used key, followed by a tier with the horizontal movement and sprinting. The vertical movement and whipping come next, being used about one third as often as the horizontal movement keys. The numbers drop off sharply after that, with the remaining actions seeing only limited usage. All of these actions are either context specific (`buy`) or consume an item (`bomb`, `rope`, and `use`).

## Keypress Rate
During gameplay, between two and three commands were entered every second (counting a keypress as a single command, no separate keydown and keyup commands):

{% include image.html file="spelunky-keypress-rate.png" %}

The keypress rate is highest in the first half of the game, before dropping off slightly for the latter two levels. I suspect this drop off is again a symptom of more cautious, planned out gameplay later in the game. The ice cave levels particularly require careful planning to figure out where to go and how to get there safely. 

## Movement Duration
The duration of each movement keypress remains fairly consistent over the entire game:

{% include image.html file="spelunky-movement-duration.png" %}

The two outlier actions are sprinting and the down arrow. The sprint key is held down slightly longer in the mine levels, but significantly longer on the boss level. Meanwhile, the down arrow key is held down for less time on mines – closer in duration to just tapping the button to pick up an item – while longer on the jungle and especially the ice caves. Holding the down arrow key to peek at a lower area of the level takes around a second to engage, so it makes sense that levels the require more peeking have longer down arrow holds.

## Action Rate
Finally, here's how often the various actions were used.

{% include image.html file="spelunky-actions-per-second.png" %}

Jump and whip are obviously the most used actions, with a jump occurring on average less than every two seconds. The jumping rate is highest in the mines and jungle levels, which makes sense since surfaces in these areas are broken up by many small barriers and other obstacles. 

None of the other actions show up at all on the above chart. Here's the same chart, but with jumping and whipping removed.

{% include image.html file="spelunky-actions-per-second-no-jw-2.png" %}

No real surprises here. Each of these actions happens at most around once a minute, with many actions only occurring less than once every three to four minutes of gameplay.


# Conclusion
Well there you go. More charts on Spelunky keyboard input than you ever knew you wanted. My only regret is that I did not use [Splunk](http://www.splunk.com) for this analysis, as the pun opportunities would have been truly epic.


[etch]: /sketchy-keylogger/

[spelunky]: http://www.spelunkyworld.com
[src]: https://github.com/mattbierner/sketchy-keylogger
