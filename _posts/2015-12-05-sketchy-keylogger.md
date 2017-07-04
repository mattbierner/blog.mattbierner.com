---
layout: post
title: Sketchy Keylogger
date: '2015-12-05'
description: "Spelunky + Keylogger + Python + Turtles"
titleImage:
    file: "spelunky-opening.png"
---

{% include image.html file="spelunky-opening.jpg" %}

What the hell is that? A map of the New York City subway system? A particle collision at the LHC? No, something far more beautiful: a visualization of [Spelunky][] gameplay keyboard input. 

Somewhere around the hundredth hour of my most recent Spelunky binge, through a hallucinatory fog of sleep deprivation and physical exhaustion, a vision came to me, sent by Kali herself: turn the game input into a giant Etch-a-Sketch (just how an ancient Indian goddess knew about Etch-a-Sketchs is one of those cosmic mysteries.)

As I lay recovering in the hospital a few days later, I couldn't stop thinking about this idea. What would a visualization of game input look like on its own, without seeing the game itself being played? Would it capture the gameplay in any way? Would there be any interesting trends? Surely such inanity would be worth a few pretty pictures at least. 

# Setup
The idea is simple:

1. Record the keyboard input for a bunch of Spelunky runs.
2. Use the arrow key input to move a pen about a digital canvas, while also marking actions such as jumps.
3. Visualize all of the gameplay runs in fun ways.

All the source code and data used for this project is [on Github][src].

## Keyloggering Myself
I hear that these days people just give keyloggers away on the internet, but most sites I found focused on detecting and removing keyloggers, not installing them. SourceForge and free (as in martian) software sites, many bedecked in more ads than actual content, provided no end of keyloggers. But, while the keyloggers in question were often "open source", many encouraged downloading wonderfully opaque little EXEs. "Trust us", said they. "Um, yeeaaahhhh...", thought I.

Furthermore, most of these keyloggers provided way too much functionality, capturing screenshots on every click or posting keyboard events to [Blot're](https://blot.re) and whatnot, while also failing to format the key log itself in a useful way. Sure, they could record keypresses just fine, capturing passwords like nobody's business, but no keylogger I found actually recorded how long each key was pressed, a vital piece of information for logging gameplay input.

Yet never fear, Py is here! With a few lines of Python, I was able to Frankenstein something together that fit the bill nicely:

```python
import datetime, time
import pythoncom, pyHook

buffer = []
current = []

def try_write():
    global buffer
    if len(buffer) > 100:
        with open("log.txt", "a") as f:
            f.write('\n'.join(buffer) + '\n')
            f.close()
        buffer = []

def on_action(action, key):
    x = "%s %s %s" % (datetime.datetime.now(), action, key)
    print(x)
    buffer.append(x) 
    try_write()

def keydown(event):
    key = str(event.KeyID)
    if not key in current:
        current.append(key)
        on_action('DOWN', key)
 
def keyup(event):
    key = str(event.KeyID)
    if key in current:
        current.remove(key)
        on_action('UP', key)

captain = pyHook.HookManager()
captain.KeyDown = keydown
captain.KeyUp = keyup
captain.HookKeyboard()

pythoncom.PumpMessages()
```

Simple, but it works. This script targets Python2.7 and requires both [pywin32](http://sourceforge.net/projects/pywin32/) and [pyhook](http://sourceforge.net/projects/pyhook/). Getting Python, along with those two dependencies, correctly installed on Windows was by far the most challenging part of this whole project.  

## Delimiting Levels
The next step was to play a bunch of Spelunky with the keylogger running. Painful, I know, but someone had to do it. After all, only through great suffering can one know true happiness – happiness in the form of a giant golden idol.   

I recorded about 150 runs with Spelunky Classic, V1.1. Each run starts at the first level and ends either with death, by far the most common case, or when I beat the game, which only happened twice. This produced a few MB of data like this:

```
2015-12-01 20:00:48.512000 DOWN 37  # left
2015-12-01 20:00:48.616000 DOWN 160 # shift
2015-12-01 20:00:48.688000 DOWN 38  # up 
2015-12-01 20:00:48.712000 DOWN 90  # z
2015-12-01 20:00:48.824000 UP 90    # z
2015-12-01 20:00:48.912000 DOWN 90  # z
2015-12-01 20:00:49.016000 UP 90    # z
...
2015-12-01 20:00:50.256000 UP 38    # up
2015-12-01 20:00:50.560000 DOWN 90  # z
2015-12-01 20:00:50.672000 UP 90    # z
2015-12-01 20:00:50.696000 UP 160   # shift
2015-12-01 20:00:50.832000 UP 37    # left
```

One obvious problem though: how do you derive game context information from such a log? While I wasn't interested in matching every keystroke to specific, in-game actions, I did want to at least know what level of the game I was on at a given time. I also needed a way to exclude keystrokes entered while not playing the game.

Such a problem is ripe for over engineering, but I went with an almost stupidly simple approach: use non-game input keys to delineate gameplay and levels. Here's the mapping:   

* T = Start new game (press at least twice in a row)
* I = End current game (press at least twice in a row)
* K = Advance one level

After a few rounds of gameplay, hitting `K` between each level became almost as second nature as `F1`, `ESC`ing when hit by an arrow three seconds into a run (for these runs, I did refrain from using that suicide shortcut though).

## Movement to Events
I divided keypresses into two types of events: actions – instantaneous events such as jumping or using a bomb – and movement, long key holds involving the arrow keys or the sprint key. In this simplified model, more than one movement key can be pressed at a time, but only one action can take place at a given time.

I also needed to convert the raw key up and key down data into a meaningful timeline of movements and actions:

``` 
20:00:48.512000 - 20:00:48.616000 : left
20:00:48.616000 - 20:00:48.688000 : left, shift
20:00:48.688000 - 20:00:48.712000 : left, shift, up
20:00:48.712000 : z
20:00:48.712000 - 20:00:48.912000 : left, shift, up
20:00:48.912000 : z
20:00:48.912000 - 20:00:50.256000 : left, shift, up
20:00:50.256000 - 20:00:50.560000 : left, shift
20:00:50.560000 : z
20:00:50.560000 - 20:00:50.696000: left, shift
20:00:50.696000 - 20:00:50.832000: left
```
 
Splitting the events so that there is no overlap allows drawing the gameplay in-order using simple iteration, instead of potentially needing separate drawing passes for actions and movements, or requiring complex calculations in the draw loop. Actions always take place where the last movement ended. 

## Visualization With Turtles
I wanted to treat gameplay keypresses as input to what amounts to a digital Etch-a-Sketch. Naturally Python, being Python, had a standard library for this: [`turtle`][turtle]. 

Player movement would move the the turtle about the screen. Moving left with the left arrow would draw a line to the left, while holding both the up and right arrows would draw a diagonal line towards the upper right. The length of the line would be determined by how long the keys were pressed.

`turtle` makes it super easy to get something up on the screen quickly. Here's the basic drawing logic to draw the entirety of a run:

```python
import turtle

bert = turtle.Turtle()

for run in game_runs:
    bert.up()
    bert.home()
    bert.down()

    levels = run['levels']
    for i, level in enumerate(levels):
        bert.color(level_color(i))
        for move in level['events']:
            if move.get('action', False):
                bert.dot(4, action_color(move['key']))
            else:
                keys = move['keys']
                bert.width(2 if SHIFT in keys else 1)
                mul = move['duration']
                x = get_x(keys) * mul # left=-1, right=1, (+-0.707 for diag)
                y = get_y(keys) * mul # down=-1, up=1, (+-0.707 for diag)
                bert.setpos(x + t.xcor(), y + t.ycor())
        bert.stamp()

bert.done()
```

Movement lines are colored based on game level:
 
* Mines - tan
* Jungle - green
* Ice - blue
* Temple - orange
* Boss - red

Sprinting draws a line that is twice as thick as normal movement.

Actions are plotted individually as little dots:

* Z = Jump - gray
* X = Whip - light brown
* A = Bomb - red
* S = Rope - dark brown
* C = Use - black
* P = Buy - gold

Somewhat surprisingly for a library targeted at beginners, the `turtle` canvas itself is not interactive, so no zooming or panning. If your drawing is too small, too large, or too off-center, you have to adjust the drawing code itself to scale and shift things so that they show on screen correctly. `turtle` also [doesn't support colors with alpha](https://bugs.python.org/issue20920), a minor annoyance, but come on! 

I also wrote a script to draw gameplay using [MatPlotLib][]. The plots look pretty much the same, but the drawing is interactive and use partially transparent colors. Any of the better looking visualization, or zoomed-in visualizations, were created with MatPlotLib.


# Areas
Spelunky levels are randomly generated, so, while it does not make sense to try to compare input for individual levels, we can look at how the different areas of the game effect gameplay. 

Now, I'm fairly good at Spelunky (normal good, not speedrun good), but I still die a lot.  

{% include image.html file="spelunky-survival-curve.png" description="On a long enough timeline, the survival rate for everyone drops to zero... except for those two times where it didn't." %}

Here's what the average death rate looks like for each area:

* Mines - 23% chance of death per level.
* Jungle - 24% chance of death per level.
* Ice Cave - 15% chance of death per level.
* Temple - 14% chance of death per level.
* Boss - 60% chance of death.

This falloff means that there is far less data on later sections of the game than earlier sections. For example, while I have around 420 plays of mine levels recorded, I only reached the temple at all on ten runs, leaving just 22 temple level play throughs. 

With that limitation in mind, let's take a look what movement in each area looks like.

## Mine
(Until the day I die, the mine level music will be forever looping in some deep recess of my mind.)

As would be expected for the opening area, the mines are fairly standard, with a nice mix of vertical and horizontal movement. Here's what all 420 mine level plays look like drawn on top of each other. 

{% include image.html file="mines.png" %}

A bit Flying Spaghetti Monster. The average position of all these lines is a little above the x-axis. Considering that Spelunky is all about descent, the upward trend of the keypresses may at first be surprising, but this makes sense when you consider the details of the controls. The down arrow key is used mainly to pick up items, drop from ledges, or peek at the level below, and the latter pair of actions are not needed all that much on these mine levels.

For a somewhat cleaner picture, here's just twenty mine level runs:

{% include image.html file="20-mine.png" %}

And here's a single complete run through the entire mine area. Unlike the two plots above, this drawing does not reset the pen to the origin after each level.

{% include image.html file="single-mines.png" %}

## Jungle
The jungle levels are perhaps the most balanced levels in terms of movement. The deep pits of this area require more arrow down holding to check if the descent is safe, and the average y-position is closer to the x-axis, although still slightly above it.

{% include image.html file="jungle.png" %}

Again, with around 160 runs, the picture is a bit messy. Here's just twenty jungle level play throughs:

{% include image.html file="20-jungle.png" %}

Along with a single complete run through the entire jungle section:

{% include image.html file="single-jungle.png" %}

## Ice Caves
The biggest outlier in terms of movement are the ice cave levels. These levels consist of sparsely spaced platforms over a void, which makes descending to the exit difficult.

{% include image.html file="ice.png" %}

Ice cave level movement trends heavily downward, primarily because you need to hold the down arrow key to peek at lower areas of the level. This single run through the entire ice cave area highlights this peeking, visible as long holds of the down key: 

{% include image.html file="single-ice.png" %}

## The Temple
The linear temple levels are a nice change of pace after the ice caves.

{% include image.html file="temple.png" %}

The long, enemy filled halls result in lots of back and forth movement, with a few vertical shifts here and there. This is especially clear when viewing a single run through the three temple levels:

{% include image.html file="single-temple.png" %}

## Final Boss
The boss battle is similar to the final Bowser battle in Super Mario 3, but with a giant [Olmec stone head](http://spelunky.wikia.com/wiki/Olmec) instead of a zoophilic, ginger-haired turtle. The player must get the boss to smash through several layers of floor into a pool of lava below.

{% include image.html file="boss.png" %}

Unlike previous levels, this battle takes place in a single large room, so vertical movement is more limited and much of the stage consists of running back and forth to dodge Olmec. The player always starts on the far left of the room, and must run right when the level starts, a pattern that clearly shows up in this chart. I also typically opened by throwing a bomb or two right away, something that also shows up in this image.


# The Whole Picture
Here's what all 150 runs look like overlaid on top of each other.

{% include image.html file="matplot-run.png" %}

It's pretty cool how all the runs start clustered together, before spreading out over a larger area midgame. Late game runs also kind of split off into individual threads. 

## Winning
This is what a winning game run looks like:

{% include image.html file="win-nojetpack.png" %}

The two winning runs I recorded actually look very different in terms of movement. Here's the second one, which has almost no downward movement:

{% include image.html file="win-jetpack.png" %}

For this second run, I stole a jetpack sometime around level two (the real crime are those prices, amirite?). Besides being awesome, the jetpack removes the need to press the down arrow key to check if descending will be safe, which explains why, besides a few blips, almost all vertical movement on this run is upwards.

I've also recorded animated versions of the two winning runs. The playback is between 5x and 10x speed, but the turtle drawing pace does not map perfectly to gameplay. It's actually kind of fascinating to watch the little turtle trace out the path. The details are pretty small, so be sure to watch fullscreen at the highest resolution. 

<div class="video-container">
<iframe src="https://www.youtube.com/embed/JldYvVYGLK0" frameborder="0" allowfullscreen></iframe>
</div>

<div class="video-container">
<iframe src="https://www.youtube.com/embed/m9_kD3wKL5g" frameborder="0" allowfullscreen></iframe>
</div>

# You Made It!
With this project, I wanted to examine the input used to play a computer game, without really considering the game itself in any real detail. The result is kind of a mess, but also kind of beautiful. 

{% include image.html file="spelunky-closing.png" %}

Some elements of gameplay are captured in these visualization, but they are also very abstract. And, appropriately enough, keypresses of individual runs do end up creating something that resembles a cave system.

I'd be interested to see a similar approach applied to different games as well, such as an 2D RPG like Pokemon Yellow or even a more mouse based game. And who knows, maybe there is even a market for visualizations of player input for particularly epic speed runs. Overlay a few more gameplay details and the result could be pretty Etsy-tacular.

But profit was never my goal. Really, this whole project was all just a big excuse to play more Spelunky.


[spelunky]: http://www.spelunkyworld.com
[turtle]: https://docs.python.org/2/library/turtle.html

[matplotlib]: http://matplotlib.org

[src]: https://github.com/mattbierner/sketchy-keylogger

<style>
.video-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
}
.video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>