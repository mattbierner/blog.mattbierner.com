---
layout: post
title: "Na Naa, Na Na Na Na Naa Naa Naa Na"
date: '2016-06-13'
description: "Visualizing Katamari Damacy gameplay input"
titleImage:
  file: "main.png"
---

{% include image.html file="main.png" %}

**Links**

* [Site][site]
* [Documentation][documentation]
* [Source][source]
* [Playstation 2 Input collector][collector]

*Katamari Damacy* is more than a game, it's the best argument I know against  anger and hatred. *Katamari Damacy* brings us together. *Katamari Damacy* reminds us that, in the end, we're all just stardust.

So although the songs never really stopped echoing in my head, I recently figured it was high time to boot up the ol' PS2 again and play me some Katamari. Not just for fun mind you, but for (computer) science! The result: the aptly named [*Na Naa, Na Na Na Na Naa Naa Naa Na*][site], an experiment visualizing the controller input for *Katamari Damacy*. It's very similar to my project [using *Spelunky* keyboard input to create a virtual etch-a-sketch][sketchy], but with joysticks instead of a keyboard, and drawing on a slowly expanding sphere instead of on a plane. <!--Also, no 🐍🐍🐍--> 

{% include image.html file="pretty8.png" %}

The results do resemble Katamaris, at least in that both are spherical. Close enough.


# Overview

{% include image.html file="pretty4.png" %}

The project had three parts: collecting dual analog stick input from a physical Playstation 2, translating the raw controller input into Katamari style movements, and using these movements to sketch out a path on a sphere. I chose to only consider controller input, and not game context for the visualization. The Katamaris in the game have momentum and collide with the game world, neither of which are handled here.

To understand the path drawing, imagine placing a marker down on a sphere. When the player moves the Katamari forward in the game, the marker also moves forward, drawing a straight line on the sphere. Move the Katamari left or right or backwards in the game, and the marker draws a line to the left or right or backwards respectively.

{% include image.html file="forward.gif" %}

Rotating the Katamari rotates the forward direction of the marker, without actually drawing anything.

{% include image.html file="rotate.gif" %}

The result is a path on a sphere that approximates the player's requested Katamari movement during a game.

{% include image.html file="translate.gif" %}

Besides basic movement, the sphere the marker draws on slowly expands over time. The path starts on a 0.05m sphere, which expands to an 1m sphere by the end of the run. This expansion helps visualize time and adds interesting interior details to the shape.

The path is drawn progressively, with a default playback speed of 8x realtime. Skip to the end of the game to see the full path.

A set of options for configuring the visualization are also provided. [Try playing around with these options][site] to explore the data or create more interesting graphics. [The documentation has more detail on these settings][documentation].


# Collecting PS2 Controller Input
{% include image.html file="pretty2.png" %}

Now let's dive a bit into the implementation. I'm going to focus more on the high-level considerations of the project, instead of code dumping or tutorializing or anything like that. [All the code is open source][source], so feel free to check it out, open issues, ask questions, or submit PRs.

My goal was to capture controller input playing *Katamari Damacy* on a physical Playstation 2, without effecting the gameplay experience. An emulator would be easier to work with, but less authentic and less interesting. And after a bit of trial and error, I was able to hack together something workable with an Arduino and a prayer.

## Physical Setup
The Playstation 2 talks to it's controllers using a slightly modified [SPI protocol](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface_Bus). So, by paralleling onto a few of the wires between the console and the controller, we can NSA the console to controller communications.

While it is possible to hook onto the Playstation 2 controller connector pins, I found it easier to sacrifice a controller by cutting through its cord to expose nine tiny wires; a veritable *Royal Rainbow*.

{% include image.html file="wiring.jpg" %}

These wires are the worst! a good deal too small and too fragile for my liking. Now if you're hardcore like me, cut all of these wires so you can reconnect them all again later. Or, be the amateur and save yourself a few steps by only cutting the yellow (attention), brown (data), and blue (clock) wires. These are the only ones needed to snoop on SPI.

I used an Arduino Uno to collect the controller data, but just about any model should work ([pin numbers may differ](https://www.arduino.cc/en/Reference/SPI).) The Arduino is setup as a parallel SPI slave here, with the yellow (attention) wire hooked up to pin 10 (SS), the brown (data) wire to pin 11 (MOSI), and the blue (clock) wire to pin 13 (SCK).

{% include image.html file="arduino.jpg" description="If your setup looks anything like this, chances are that something has gone terribly, terribly wrong." %}

Since the Arduino is in parallel with the console -> controller, input to the game should not be affected.

Time to start collecting some data.

## Ones and Zeros
Players use both analog sticks to steer the titular Katamari. There are a few other controls for cameras, and some button based controls that effect Katamari movement – such as pressing R3 and L3 to flip the Katamari over – but I decided to ignore these. This simplified movement model meant I only needed to poll the position of the two analog sticks during gameplay.

With all the wiring correctly hooked up and the Arduino configured as an SPI slave, we receive about 60 binary messages like this per second:

```
11111111:01110011:01011010:11111111:11111111:10001001:01111110:10010000:10000110
11111111:01110011:01011010:11111111:11111111:10001001:01111110:10010000:10000110
11111111:01110011:01011010:11111111:11111111:10001001:01111110:10010000:10000110
...
```

(In my understanding, all these ones and zeros are [really just C++ templates](/stupid-template-tricks-template-assembler/), but too small and tightly rolled up to directly observe.)

Here's a similar sample in hex:

```
ff:73:5a:ff:ff:89:7e:88:87
ff:73:5a:ff:ff:89:7e:88:87
ff:73:5a:ff:ff:89:7e:88:87
```

[The details of the PS2 controller protocol are well documented](http://store.curiousinventor.com/guides/PS2), but all I needed to know here was that the `0x73` identifies this as a polling response, with the controller analog stick state encoded by last four bytes: right joystick x, right joystick y, left joystick x, and left joystick y.

[Here's the code I used to collect the controller data][collector]. The Arduino code handles SPI interrupts and writes the controller state poll responses to serial. A simple Python script on the computer listens to the Arduino's serial and writes the received data to a file, while also appending some time metadata. 

## Normalization
Each analog stick axis value ranges from 0 to 255, so one may expect to see a value of 128 when the analog stick is not being used. This is rarely the case. Typical dead input values for my 15 year old PS2 controller's analog sticks were between 110 and 145, and *Katamari Damacy* itself only starts handling inputs below around 90 or above around 170. This is a pretty sizable deadzone, albeit one that I've rarely noticed in actual gameplay. 

To simplify working the controller data, it was normalize by:

* Pushing all the input values that fell within the deadzone to zero.
* Subtracted the deadzone out from from the remaining inputs.
* And then scaling the input values to between `[-1, 1]`.

I also tacked on some additional metadata to each poll and dumped the whole game log to json. The data normalization script is in `process_data/main.js` [in the main repo][source]. 

## Sample Collection
The original *Katamari Damacy* is a great game, but, for me, *We ♥ Katamari* will always be the series crowning point; the controls and physics are better, levels are more interesting and varied, and the humor is absolutely top notch (the *King of All Cosmos* was one influence for the [voice of Us over at Blot're][blotre].)

I collected ten samples from *We ♥ Katamari* using the hacked together Playstation -> Arduino -> Python -> Javascript -> json workflow described above. The samples cover a range of levels, each with slightly different play styles and goals. Here's a quick breakdown:

* `1000m`: As Large as Possible 5 - Bird and Elephant
  * Goal: 500m
  * Time: 17 minutes
  * Starting Size: 1 meter
  * Ending size: ~1000m
  
* `2500m`: As Large as Possible 5 - Bird and Elephant
  * Goal: 500m
  * Time: 17 minutes
  * Starting Size: 1 meter
  * Ending size: ~25000m

* `3000m`: As Large as Possible 5 - Bird and Elephant
  * Goal: 500m
  * Time: 17 minutes
  * Starting size: 1 meter
  * Ending size: ~3000m

* `15cm (fast)`: As Large as Possible 1 - Rainbow Girl
  * Goal: 15cm as fast as possible
  * Starting size: 5cm
  * Ending size: 15cm
  * Time: ~2.2 minutes

* `cleaning`: Busy Mom
  * Goal: roll up 100 items as fast as possible.
  * Time: ~2.2 minutes
    * Starting size: 8cm
  * Ending size: 20cmcm
  
* `friends (many)`: Dog
  * Goal: roll up as many friends (animals) as possible.
  * Time: 6 minutes
  * Starting size: 80cm
  * Ending size: 10m
  
* `origami`: Kid 
  * Goal: roll 1000 paper cranes.
  * Time: 8 minutes
  * Starting size: 20cm
  * Ending size: ~1m (900 cranes)
  
* `Race`: Race car driver
  * Goal: 5m.
  * Time: 6 minutes
  * Starting size: 1.2m
  * Ending size: ~20m 
  
* `sweets`: Hansel and Gretel
  * Goal: Roll up meadow of wafers.
  * Time: 3 minutes
  * Starting size: 70cm
  * Ending size: ~1.64m (100%)

* `sumo`
  * Goal: roll up the large sumo wrestler.
  * Time: 5 minutes
  * Starting size: 50kg
  * Ending size: 322kg

* `underwater`: Boy with Inter-tube
  * Goal: 80cm.
  * Time: 6 minutes
  * Starting size: 20cm
  * Ending size: 1.75m


I ultimately did not notice much variation between different samples besides game length however. The Katamaris on the `underwater` and `race` level control very differently, but this difference is not well captured by this visualization. The lack of real level distinction contrasts with [my Spelunky experiment][sketchy], wherein the five areas of the game each have distinct patterns of input. 


# Visualization

{% include image.html file="pretty5.png" %}

Now let's take a look at some of the more interesting aspects of the visualization. Feel free to [check out the source][source] to see how everything came together. The visualization itself uses WebGL and [Three.js](http://threejs.org), plus [React](https://facebook.github.io/react/) for the UI. 

## Main Draw Function
I wanted to produce something that resembles a Katamari, so drawing on a sphere was an obvious choice. Spheres have other benefits as well. In contrast to Spelunky, input for *Katamari Damacy* is primarily in a single direction, forwards, with sideways and backwards movement being much less common. If you plot this input on a plane, the resulting sketch is very sparse and dull. On the other hand, a sphere offers an infinite drawing canvas within a fixed sized area.

To understand how the path is constructed, consider the `drawGame` function. This function converts all inputs of a given game into a path on a sphere. 

```js
drawGame(gameData) {
    // Setup geometry buffers

    let quaternion = new THREE.Quaternion(0, 0, 0, 1);
    let angle = 0;
    
    for (const input of gameData) {
        const movement = katamariMovement(input, quaternion, angle);
        angle = movement.angle;
        quaternion = movement.quaternion;

        // Copy quaternion to geometry buffer.
        // The quaternion to xyz translation is handled in the vertex shader.
    }

    // Create mesh and add to scene
}
```

Two pieces of state are used to draw the path while iterating through the input: 

* `quaternion` - A [quaternion](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation) that tracks the position of the marker on the sphere.
* `angle` - The local angle of the marker on a 2d drawing plane. `angle` determines the forward direction of movement. 


## Rotation
`katamariMovement` updates both `angle` and `quaternion` based on the controller input. The simplest inputs to handle are rotations, which only update the angle:

```js
const isDead = (x, y) =>
    x === 0 && y === 0;

if (isDead(leftX, leftY) && !isDead(rightX, rightY)) {
    // right stick only rotation
    angle += rightY * ROTATION_SCALE;
} else if (!isDead(leftX, leftY) && isDead(rightX, rightY)) {
    // left stick only rotation
    angle -= leftY * ROTATION_SCALE;
} else if (leftY > 0 && rightY < 0) {
    // down left, up right rotation
    angle -= (leftY - rightY) * ROTATION_SCALE;
} else if (rightY > 0 && leftY < 0) {
    // down left, up right rotation
    angle += (rightY - leftY) * ROTATION_SCALE;
}
```

These are all approximations of how the actual Katamari responds to controls in the game. Moving a single joystick rotates the Katamari, with the y-axis of the active joystick determining rotation speed and rotation direction. Moving the two joysticks to opposite y directions allows faster rotation. This means there are three ways to rotate left or right:

* Move one joystick forwards.
* Move the opposite joystick backwards.
* Move both joysticks in opposite y directions.

In the actual game, the last case can also be used to steer the Katamari using its momentum. Again, this visualization only looks at controller input and ignores details such as momentum (if only real engineers had it this easy.)


## Movement
When both joysticks are pushed in roughly the same direction, The Prince rolls the Katamari in that direction. In the visualization, the forward direction of this movement is stored in `angle`.

Movement updates `quaternion` (the marker's location on the sphere) by computing vertical and horizontal movements for the current input, and then applying these using the current `angle`:

```js
const x = leftX + rightX;
const y = leftY + rightY;

// Update angle based on unequal left and right joystick movements.
// This simulates steering movements.
angle += ROTATION_SCALE * (rightY - leftY);

const direction = new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0);
const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0);

const horizontal = new THREE.Quaternion().setFromAxisAngle(
    direction,
    x * TRANSLATION_SCALE);

const vertical = new THREE.Quaternion().setFromAxisAngle(
    perpendicular,
    y * TRANSLATION_SCALE);
        
quaternion = quaternion.multiply(horizontal).multiply(vertical);
```

This logic is grossly simplified, but approximates the movement style of *Katamari Damacy* well enough in my testing. 


## Time
Early iterations of this visualization sketched out the movement path on a fixed sized sphere. This results in lots of intersections and can get messy for complex paths. 

{% include image.html file="no-radius.png" %}

To avoid this, I changed the marker to start drawing on a small sphere that slowly expands over the course of the game.

{% include image.html file="inner-radius.png" %}

The result is a much more interesting three dimensional shape, that also better captures the progression of a game. It also mirrors the ever expanding nature of a Katamari. You can disable this expansion in the configuration menu by setting `inner radius` to 100.

## Movement Scaling
Another parameter I experimented with is the damping of movements on the sphere. This effects the distance the marker moves at each step; less damping means that the marker moves further each step.

Increasing the damping takes us from this:

{% include image.html file="medium-damping.png" %}

To a very distinct path that is much easier to trace.

{% include image.html file="heavy-damping.png" %}

While decreased damping produces a big ball of craziness:

{% include image.html file="low-damping.png" %}

[Try playing around with different damping factors][site] in the configuration menu.

Since the distance covered by each step of the path increases as the sphere expands, I also experimented with damping movement based on the size of the sphere, so that all movements sweep out roughly the same distances throughout the span of the game (the larger the sphere becomes, the more damped movement becomes.)

Here's a normal path using a constant damping factor:

{% include image.html file="normal-damping.png" %}

And here's the same path using proportional damping:

{% include image.html file="prop-damping.png" %}

But I opted to disable this proportional damping since it tends to visually crowd the center of the shape, and the result is ultimately less Katamari-esque.

Playing around with all of the visualization options was actually a lot of fun, and I tried to make many aspects of the visualization interactive. Besides the `inner radius` and `movement damping` options, you can configure the colors and opacity of the path, along with the thickness of the path lines, to produce very interesting results.


# Oh! I feel it! I feel the Cosmos!
{% include image.html file="pretty1.png" %}

If this all seems rather abstract and pointless, well that's kind of the point. *Na Naa, Na Na Na Na Naa Naa Naa Na* only captures input used to play *Katamari Damacy*, not the game itself. And yet the results can be quite beautiful and resemble everything from nebulas and novas, to cells and proteins. 

{% include image.html file="pretty3.png" %}

These visualizations do not really offer any insights, or even any real value, but that somehow strikes me as very fitting.

Anyways, it's always fun to play with odd data streams like this, and I had almost as much fun creating this visualization as I had picking up *We ♥ Katamari* again. Try playing around with [*Na Naa, Na Na Na Na Naa Naa Naa Na*][site] to see what you discover in the data.


{% include image.html file="pretty6.png" description="PS: The King is so cool!" %}




[site]: http://mattbierner.github.io/na-naa-na-na-na-na-naa-naa-naa-na/
[documentation]: https://github.com/mattbierner/na-naa-na-na-na-na-naa-naa-naa-na/blob/gh-pages/documentation/about.md
[source]: https://github.com/mattbierner/na-naa-na-na-na-na-naa-naa-naa-na
[collector]: https://github.com/mattbierner/ps2_controller_collector

[blotre]: http://blog.blot.re
[sketchy]: /sketchy-keylogger