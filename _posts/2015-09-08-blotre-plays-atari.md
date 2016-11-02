---
layout: post
title: Blot're Plays Atari
series: blotre
date: '2015-09-08'
---
Remember playing games on a gizmo like this?

{% include image.html file="playing-the-atari-2600_thumb.jpg" %}

Maybe you remember Grandma blasting the Qotile with her trusty Zorlon Cannon in good ol' Yars' Revenge, dodging that Swirl like a pro, those sweet Atari sounds wafting through the house. But kids these days are too busy Squirtle-ing each other to give a damn about classics like *Asteroids* and *Ms. Pac-Man*. That's a shame. It's time introduce Atari to a new generation, to bring the 2600 into the IoT era. It's time to [Blot're][blotre] Atari.

*Twitch Plays Pokémon* was a neat social experiment in its day, but it's far too text based for 2015; may as well be Pokémon by Telegraph for all The Modern Millennial cares. Text is the past, too restrictive and archival. Besides, text input makes for boring and predictable gameplay. Color is where it's at. And all the cool people have moved on from Gameboy to the Atari 2600, with its handcrafted microelectronics, small batch artisanal ROMs, and sustainable wood veneer. 

This post overviews how I setup Blot're to control a two player game of *Combat* on an Atari 2600. You can find the live stream of the game [on youtube][stream] although I don't know how long I'll be able to keep the stream up for. The source code is [on Github][src].

# Combat
The Atari 2600 game library is heavy on arcade games and puzzle games, no sprawling RPGs like Pokémon to be found here. Now I enjoy a good game of *Atlantis* as much as anyone else, but these games require quick reactions and precise input, neither of which will work well for crowdsourced input. This narrowed the selection of games considerably.

It might be interesting to try a competitive game – groups of players competing against the other groups – instead of everyone working happily together at *Smurf: Rescue in Gargamel's Castle*. Of course, there would be nothing to stop a given player from switching sides or even playing the saboteur, but that just adds to the fun.

Considering these guidelines, I decided to keep things simple and go with a true Atari 2600 classic: *[Combat][combat]*.

{% include image.html file="Combatatarigamepack.jpg" %}

*Combat* is a simple game, even by Atari 2600 standards. Each round pits two players against each other, with the goal of shooting the other player while avoiding getting shot yourself. The gameplay and controls are easy and consistent. No power-ups, special abilities, or upgrade paths. It's also a game that doesn't require too much precision, making it perfect for high latency crowdsourced input. At the same time though, *Combat* also has a lot of variety thanks to its 27 game modes, everything from billiard tanks to jet combat with guided missiles.

## Infinite Combat
A round of *Combat* lasts a little more than two minutes, a bit too short when dealing with crowdscoured input where no one knows what the hell they are doing. It may very well take ten minutes just to get the tanks within range of one another, let alone actually score any points. Therefore, I decided to mod the *Combat* rom to disable this timer all together.

This was actually surprisingly easy. Atari 2600 roms are usually less than 4k, so the disassembly of *Combat* is short, and the instruction set of the 6502/6507 used in the 2600 is pretty standard, so the code is easy enough to understand, albeit with some interesting anachronisms around timing and system constraints. And some kind people even [annotated the complete Combat disassembly][combat-dis], detailing what each ram address is used for and what each line of the code does.

## The Timer
There are two important ram address involve in timing a round of *Combat*:

* `$DD` - The game round timer itself. Just a simple counter. The round timer starts at `0x80` and increments about once a second until it overflows to zero.
* `$88` - The game is running flag. This is zeroed once `$DD` reaches zero, causing the game to enter attract mode between rounds.

Here's the actual code from the *Combat* disassembly that increments the game counter and sets the game is running flag to false:

```
F18C    INC ram_dd  # Increments the game timer
F18E    BNE lf192   # Branch taken when the game timer is not zero
F190    STA ram_88  # Otherwise, timer == 0, set game running to zero.
```

## Disabling the Timer
The obvious approach to disable the game round timer is to make line `F190` noop: simply replace it with machine code `0x80`. This works, but it isn't perfect. You see, like almost every other part of an Atari 2600 program, the game round timer is used for a few other things besides just timing the round. `$DD` also controls the color switching of the so called 'attract' mode between rounds (although the attractiveness of these colors is debatable). And during gameplay, `$DD` also triggers the flashing player scores that indicate the round is about to end.

Disabling line `F190` stops the game from ending, but it doesn't stop the game scores from flashing. So I instead choose to disable the timer increment all together. This replaces line `F18C` with a nop, along with an increment to make the BNE of line `F18E` happy. 

```
F18C    NOP  # EA
F18D    INC  # E8
```

Nooping line `F18C` does disable the flashing colors in attract mode, but that's not much of a loss. With this simple edit, *Combat* is transformed into a perpetual war simulator, a digital war of attrition played out on wood veneered killing fields of tangerine orange and lime green.


# BPA Free!
With a modded version of *Combat* all set, time to get the player input from Blot're.

I actually began thinking about using Blot're to control a video game a while back, but quickly realized that a *Twitch Plays Pokémon* style game would be impossible with the then current version of Blot're. I would need to create a stream that any player could post to, something Blot're 0.1 did not support. Sure you could favorite other people's streams, but this was a manual process and a player couldn't add themselves to another person's stream.

So I decided to [introduce tags with Blot're 0.2][blotre-0.2]. Besides adding metadata to streams, the tagging system brings shared stream collections. Each tag in the system is conceptually a collection of child streams with that tag. Subscribe to updates on the `#player1` tag, and you'll receive status updates from any stream that has this tag across all of Blot're. Tag collection streams are automatically maintained and work exactly like normal stream collections. 

The tagging system makes it easy to collect player input: I would simply subscribe to updates on the `#player1` and `#player2` tags and translate received status updated events into game input. Anyone would be able to start playing by simply adding one of those tags to their stream.

## Color to Control
Because a unique tag controls each player, that leaves the entire spectrum of 16,777,216 Blot're colors to work when mapping color to game input. Blot're uses HTML style RGB colors encoded as six hex digits, but other RGA representations are easier to understand and provide more straightforward control mapping opportunities. I choose to use hue, saturation, value (HSV) for this purpose.

HSV uses a cylindrical coordinate system, which maps nicely to an Atari 2600 controller. `hex_to_hsv` converts a Blot're formatted color to HSV.

```python
def hex_to_rgb(hex):
    return struct.unpack('BBB', codecs.decode(hex[1:], 'hex'))

def hex_to_hsv(hex):
    rgb = hex_to_rgb(hex)
    return colorsys.rgb_to_hsv(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)
```

The standard Atari 2600 controller is pretty simple, just a joystick and a single button. Dark colors are translated to button presses, as determined by the 'value' component of the HSV color. 

```python
def is_dark(hsv, threshold=0.15):
    return hsv[2] <= threshold
```

Hue controls the joystick. For this, I divided the hue circle into 4 quadrants. Colors with a hue of between between -45 and 45 degrees map to *up*, *left* is mapped 45 and 135 degrees, *down* is mapped 135 and 225 degrees, and *right* is mapped 225 and 315 degrees. Four direction input is enough for a game like *Combat*, but this mapping scheme could be expanded to add diagonal input if needed. 

```python
CONTROLS = ["up", "left", "down", "right"]

def hsv_to_control(hsv):
    if is_dark(hsv):
        return 'fire'
    sector = math.ceil(hsv[0] / 0.125)
    return CONTROLS[int((sector % 7) / 2)]
```

Holding left on the joystick is different from a quick left tap of the joystick. I use the saturation component to determine this timing, with fully saturated colors resulting in button presses of up to two seconds, while almost white colors result in quick taps of the Joystick.

```python
MAX_PRESS = 2
MIN_PRESS = 0.2

def hex_to_action(hex):
    hsv = hex_to_hsv(hex)
    input = hsv_to_control(hsv)
    if input == 'fire':
        return (0.2, 'fire')
    else:
        return ((MAX_PRESS - MIN_PRESS) * hsv[1] + MIN_PRESS, input)
```

## Getting Input
Blot're tags work exactly like normal shared stream collections, so we can subscribe to real time events for a tag with the Blot're [subscription API][subscription]. I used the [websockets][] library to handle the websocket part, along with [Blot're.py][blotre-py] to get the websocket address.

```python
PLAYER1_TAG = "#player1"
PLAYER2_TAG = "#player2"

@asyncio.coroutine
def open_socket(client):
    debug('opened socket')
    websocket = yield from websockets.connect(client.get_websocket_url())
    yield from subscribe_tag(websocket, PLAYER1_TAG)
    yield from subscribe_tag(websocket, PLAYER2_TAG)
    yield from process_messages(websocket)
    yield from websocket.close()
    
client = blotre.Blotre({}, {}, BLOTRE_CONF)

loop.run_until_complete(open_socket(client))
```

Tags are subscribed to exactly like normal stream collections, but must be prefixed with `#`.

```python
def subscribe_tag(websocket, tagname):
    yield from websocket.send(json.dumps({
        'type': 'SubscribeCollection',
        'to': tagname
    }))
```

## Receiving Input
A subscription to a tag stream collection receives three types of events:

* `ChildAdded` when the given tag is added to a stream.
* `ChildRemoved` when the given tag is removed from a stream.
* `StatusUpdated` when the status of the stream with the given tag is changed.

All three of these events include the current stream's status, although, for the game, only the `ChildAdded` and `StatusUpdated` events are interesting.

```python
def process_messages(websocket):
    while True:
        msg = yield from websocket.recv()
        if msg is None:
            break
        else:
            process_message(msg)

def process_message(msg):
    data = json.loads(msg)
    color = None
    if data['type'] == "StatusUpdated": 
        color = data['status']['color']
    elif data['type'] == "ChildAdded":
        color = data['child']['status']['color']
    else:
        return
    
    if data['source'] == PLAYER1_TAG:
        return on_player_input('player1', PLAYER1, color)
    elif data['source'] == PLAYER2_TAG:
        return on_player_input('player2', PLAYER2, color)
```

The `source` property on the message tells us which collection is broadcasting the message. If a stream has both the `#player1` and `#player2` tags, we will receive separate messages for each.

## Direct Input
I decided to run the actual game on a Windows machine using [Stella][].
There are probably ways to simulate player input programmatically for Stella, but I didn't bother overcomplicating things and instead just choose to simulate key presses directly.

I used some Python DirectInput bindings taken from [this StackOverflow question](http://stackoverflow.com/a/23468236/306149) to actually talk to Stella. Each player has a unique set of keys to control their movement (note that these are different from the default Stella key bindings).

```python
PLAYER1 = {
    "up": 0x11,     # w
    "right": 0x20,  # d
    "down": 0x1f,   # s
    "left": 0x1e,   # a
    "fire": 0x12 }  # e

PLAYER2 = {
    "up": 0x15,     # y
    "right": 0x24,  # j
    "down": 0x23,   # h
    "left": 0x22,   # g
    "fire": 0x16 }  # u
```

When an actionable message is received, `on_player_input` maps the color to an action (duration + action name) and then actually performs the keypresses. 

```python
def on_player_input(name, controls, color):
    action = hex_to_action(color)
    enter_input(name, controls, action)
```

`current_inputs` is global state that maintains the current keys that each player is pressing, along with the action index, a simple counter used to identify individual inputs.

```python
current_inputs = {
    'player1': { 'index': 0, 'value': 0 },
    'player2': { 'index': 0, 'value': 0 } }
```

When a key is pressed, `enter_input` first releases the existing key and then presses the new key. It then updates the global state and schedules the asynchronous callback function `try_release_key` to be invoked after given input delay. 

```python
def enter_input(player, controls, action):
    global current_inputs
    delay, input = action
    key = controls.get(input, '0')
    current = current_inputs[player]
    ReleaseKey(current['value'])
    PressKey(key)
    index = current['index'] + 1
    current['index'] = index
    current['value'] = key
    loop.call_later(delay, try_release_key, player, key, index)
```

Operations like `PressKey` are stateful, so `try_release_key` ensures that the key is released after the specified delay.  Because other messages and other inputs may have been received between when the input was first trigger and when it was released, it has to make sure only to release keys for the targeted action. 

```python
def try_release_key(player, key, target_index):
    global current_inputs
    current = current_inputs[player]
    if current['index'] != target_index or current['value'] != key:
        return
    ReleaseKey(key)
    current['value'] = 0
```

That's basically it.

The game also resets itself and randomly selects a new mode every 30 minutes, but that logic is not all that interesting. You can find the complete source [on Github][src].

# Results
Blot're play's Atari is live right now. I've set up a [live Youtube stream][stream] that shows player inputs plus the actual game. Latency plus the color to input mapping results in lots of fun (almost 100% of this latency is Youtube itself and not Blot're, which has around a 250ms delay at most end-to-end).

To play, simply add the tag `#player1` or `#player2` to any Blot're stream. This joins the stream to the game for that team. Any status updates you make to the stream are now automatically broadcast on the tag and will be received and processed by the Python script.

Have you played your [Atari today][have-you-played]?


[blotre]: https://blot.re
[blotre-py]: https://github.com/mattbierner/blotre-py

[blotre-0.2]: /blotre-0-2-0-tagging-like-its-web-2-0/

[stream]: https://gaming.youtube.com/c/Mattbierner/live
[src]: http://github.com/mattbierner/blotre-plays

[stella]: http://stella.sourceforge.net
[combat]: https://en.wikipedia.org/wiki/Combat_(1977_video_game)
[combat-dis]: https://atariage.com/2600/archives/combat_asm/index.html

[subscription]: http://github.com/mattbierner/blotre/wiki/subscriptions
[websockets]: https://pypi.python.org/pypi/websockets

[have-you-played]: https://www.youtube.com/watch?v=1v6TQ_5u9fs