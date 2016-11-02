---
layout: post
title: 'Snake Part 2 - Interactive Nibbler'
series: stupid_template_tricks
date: '2015-01-22'
---
Compile time Nibbler, man. We gotta get this sucker done. [Last time][part1], we got so caught in metaprogramming that we ended up with a state machine. To play a game, you had enter all of the commands ahead of time. That's pathetic. Is that what you want to do with your life? Type `Input::Up` and `Input::Left` into a compiler so that you can guide a bunch of triangles into asterisks? That's senseless! But that's what happens, man.

{% include image.html file="1198440-scooty_puff_sr.png" %}

So this time around, let's make compile time Nibbler "interactive". You’ll still play the game with a compiler, but now each compilation will only advance a single step. Player input will come from macro flags passed to the compiler on the command line.

The flow of a single interactive Nibbler game step will be:

1. Compile time - Load and deserialize the current game state.
2. Compile time - Take one player input.
3. Compile time - For the given input and current game state, advanced the world one step.
4. Run time - Print display of world type to `stdout`.
5. Run time - Write serialized world type to file.

We already have steps three and four completed, so let's move on to the biggest remaining challenge, serialization and saving state across compiler runs.

The code in this post directly builds on what we wrote [last time][part1]. The complete source code is [available on Github][src].


# Basic Serialization
Let’s assume that we have some way to pass text data across compiler runs. We’ll cover the details of this later, but first we need to turn our game state, which is just a really complex type, into a string. So what data format should we use? Json? XML? Yaml?

Yet we need look no further than C++ itself. Yes, perhaps the best serialization of a C++ template data structure is to C++ source code for that template data structure. This is not as crazy as it sounds, since we get compile time deserialization for free. Just `#include` the save file and the compiler does the rest.

## Type Serialization
We [previously][part1] used a `Print` interface to print out visual representations of our compile time data structures at runtime. Serialization will basically do the same, but output C++ source code the represents the data structure itself. 

The `Serialize` interface defines a `Write` operation which writes a C++ representation of the target type to a stream. The write operation itself will be executed at runtime (For both `Print` and `Serialize`, you could instead output to a `template<char...>` if you really wanted to).

```cpp
template <typename>
struct Serialize
{
    static std::ostream& Write(std::ostream& output)
    {
        ...
    } 
};
```

Like `Print`, each serializable type specializes the `Serialize` interface. Eventually, all types in the game state need to implement this interface. But let’s take things one step at a time.

Here are serializations for a few basic types. Note how we are not serializing boolean or integer values, but the types themselves.

```cpp
template <>
struct Serialize<bool> { static std::ostream& Write(std::ostream& output) { return output << "bool"; } };

template <>
struct Serialize<int> { static std::ostream& Write(std::ostream& output) { return output << "int"; } };

template <>
struct Serialize<size_t> { static std::ostream& Write(std::ostream& output) { return output << "size_t"; } };
```

## Value Serialization
But our `Serialize` interface has a key limitation, it only works for types. Even though we specialized `Serialize` for the type `int`, we can’t specialize it for integer arguments like `Serialize<3>`.

But we can get around this restriction by encoding values as types. `SerializableValue` encodes both the type `T` and value `x` of a value, as a type.

```cpp
template <typename T, T x>
struct SerializableValue { };
```

So that we can now specialize `Serialize` for `SerializableValue`.

```cpp
template <typename T, T x>
struct Serialize<SerializableValue<T, x>>
{
    static std::ostream& Write(std::ostream& output)
    {
        return output << std::boolalpha << x;
    }
};
```

The main limitation to this approach that you have manually wrap value types in a `SerializableValue` when serializing them:

```cpp
// This does not compile
Serialize<3>::Write(std::cout);

// But this does
Serialize<SerializableValue<int, 3>>::Write(std::cout);
```

## Join
Serializing variadic templates presents a small challenge. We used variadic templates to encode lists, but because the arguments to a template must be comma separated in C++ source code, we need a helper that can comma separate a variable number of template arguments.

The `Join` helper acts like [Javascript’s](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join) `Array.prototype.join`. It takes a separator character and list of values, and writes out a list of serialized value separated by the separator character.

```cpp
template <char joiner, typename... list>
struct Join;
```

In cases where `list` contains two or more elements, `Join` serializes the first element and then outputs the separator character. The rest of the list is serialized with a recursive call to `Join`.

```cpp
template <char joiner, typename first, typename second, typename... rest>
struct Join<joiner, first, second, rest...>
{
    static std::ostream& Write(std::ostream& output)
    {
        Serialize<first>::Write(output);
        output << joiner;
        return Join<joiner, second, rest...>::Write(output);
    }
};
```

The two base cases are when the list contains zero or one elements. 

```cpp
template <char joiner, typename first>
struct Join<joiner, first>
{
    static std::ostream& Write(std::ostream& output)
    {
        return Serialize<first>::Write(output);
    }
};

template <char joiner>
struct Join<joiner>
{
    static std::ostream& Write(std::ostream& output)
    {
        return output;
    }
};
```

We can now use `Join` and `SerializableValue` to serialize a `std::integer_sequence`.

```cpp
template <typename T, T... elements>
struct Serialize<std::integer_sequence<T, elements...>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "std::integer_sequence<";
        Join<',', T, SerializableValue<T, elements>...>::Write(output);
        return output << ">";
    }
};
```


# Serializing Nibbler
Any type stored in the Nibbler `State` object must be serializable. That may sound intimidating, but this is really only around 10 types, and most of the code is straightforward (This probably would be a good application of macros as well).

{% include image.html file="3fhdgZOw7j-2.png" description="It's my duty to inform you that Honey Bunches of Oats is the greatest cereal ever created by man." %}

## Lists and Grids
`Position` only uses basic values, which we can write directly to the data stream.
 
```cpp
template <size_t x, size_t y>
struct Serialize<Position<x, y>>
{
    static std::ostream& Write(std::ostream& output)
    {
        return output << "Position<" << x << "," << y << ">";
    }
};
```

`List` is made up of zero or more types and the `Join` function handles most of the heavy lifting for us.

```cpp
template <typename... elements>
struct Serialize<List<elements...>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "List<";
        Join<',', elements...>::Write(output);
        return output << ">";
    }
};
```

And a `Grid` is just a list of lists. By serializing the `rows` object, all rows and all elements in those rows are serialized.

```cpp
template <typename rows>
struct Serialize<Grid<rows>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "Grid<";
        Serialize<rows>::Write(output);
        return output << ">";
    }
};
```

## Cell
Each cell in the game world has three components: state, weight, and direction. State and weight are both enum class values. Because enum classes are strongly typed, we must provide custom value serialization logic for them:

```cpp
template <CellState state>
struct Serialize<SerializableValue<CellState, state>>
{
    static std::ostream& Write(std::ostream& output)
    {
        switch (state)
        {
        case CellState::Snake: return output << "CellState::Snake";
        case CellState::Food: return output << "CellState::Food";
        case CellState::Collision: return output << "CellState::Collision";
        case CellState::Empty: return output << "CellState::Empty";
        }
    }
};
```

```cpp
template <Direction d>
struct Serialize<SerializableValue<Direction, d>>
{
    static std::ostream& Write(std::ostream& output)
    {
        switch (d)
        {
        case Direction::Up: return output << "Direction::Up";
        case Direction::Down: return output << "Direction::Down";
        case Direction::Left: return output << "Direction::Left";
        case Direction::Right: return output << "Direction::Right";
        }
    }
};
```

To serialize a `Cell`, we `Join` its constituents, but must wrap them in `SerializableValue` to convert them to types.

```cpp
template <CellState state, unsigned weight, Direction direction>
struct Serialize<Cell<state, weight, direction>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "Cell<";
        Join<',',
            SerializableValue<CellState, state>,
            SerializableValue<unsigned, weight>,
            SerializableValue<Direction, direction>>::Write(output);
        return output << ">";
    }
};
```

## Random
Some objects that are part of the game state are not visually displayed, and therefore did not implement the `Print` interface. This includes the [compile time pseudo-random number generator][prandom], `PseudoRandomGenerator`. But it is an important part of the game state, and must be serialized. 

```cpp
template <unsigned max, typename lfsr>
struct Serialize<PseudoRandomGenerator<max, lfsr>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "PseudoRandomGenerator<";
        Join<',',
            SerializableValue<unsigned, max>,
            lfsr>::Write(output);
        return output << ">";
    }
};
```

The linear feedback shift register contains the state of the register and the taps that are sampled. Both of these are `std::integer_sequence`.

```cpp
template <typename state, typename taps>
struct Serialize<Lfsr<state, taps>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "Lfsr<";
        Join<',', state, taps>::Write(output);
        return output << ">";
    }
};
```

## Serializing the World
First, the `PlayerState` enum class.

```cpp
template <PlayerState state>
struct Serialize<SerializableValue<PlayerState, state>>
{
    static std::ostream& Write(std::ostream& output)
    {
        switch (state)
        {
        case PlayerState::Alive: return output << "PlayerState::Alive";
        case PlayerState::Dead: return output << "PlayerState::Dead";
        }
    }
};
```

And then we can write out the entire world, again just by `Join` on the `State` constituents.

```cpp
template <
    PlayerState playerState,
    typename position,
    Direction direction,
    typename world,
    typename random>
struct Serialize<State<playerState, position, direction, world, random>>
{
    static std::ostream& Write(std::ostream& output)
    {
        output << "State<";
        Join<',',
            SerializableValue<PlayerState, playerState>,
            position,
            SerializableValue<Direction, direction>,
            world,
            random>::Write(output);
        return output << ">";
    }
};
```



# Loading and Saving State
If we venture to serialize the initial game state, `Serialize<InitialState>`, we end up with this wonderful text blob:


```cpp
State<PlayerState::Alive,Position<5,5>,Direction::Right,Grid<List<List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Snake,1,Direction::Right>,Cell<CellState::Food,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>,List<Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>,Cell<CellState::Empty,0,Direction::Left>>>>,prandom::PseudoRandomGenerator<10,prandom::Lfsr<std::integer_sequence<bool,false,true,true,false,true,false,true,true,false,false,true,true,true,false,false,false>,std::integer_sequence<size_t,0,10,12,13,15>>>>;
```

That’s not very human readable, but it is perfectly valid C++. So let’s return to the problem of saving game state across compiler runs.

## Persistance
State persistence saves the game state in a format that can be deserialized at compile time. Unfortunately, the persistence itself must be handled at runtime using files (I believe you could possibly get around using runtime here by instead serializing the game state to a compiler error message, and then passing the error message into the next compiler run as a macro. But that's a whole lot of work just to prove a rather silly point).
 
When the Nibbler program is executed at the end of each game step, we'll write the state to a file called `"current_game.h"`. This is handled by the `serialize_game` function, which outputs text that binds the state to the name `”state”` with a `using` statement.

```cpp
template <typename state>
void serialize_game()
{
    std::ofstream s;
    s.open("current_game.h");    
    s << "using state = ";
    Serialize<state>::Write(s);
    s << ";";
}
```

## Loading State
To load a save state, we simply import `"current_game.h"` in the main function of the runtime program. This creates a local type called `state` that contains the current game state type.

We then use `state` to compute the next state of the game for the given player input. The next state of the game is printed out and written back to `"current_game.h"`.

The complete Nibbler program so far looks like this:

```cpp
int main(int argc, const char* argv[])
{
#include "current_game.h"

    /* get input */
    
    using game = step_t<input, state>;

    Printer<game>::Print(std::cout);
    
    serialize_game<game>();
    
    return 0;
}
```


# Interactive Nibbler
All that remains now are a few finishing touches.

## Input
Interactive Nibbler gets player input from C preprocessor macros specified on the compiler command line. Four macro input commands are supported: `UP`, `RIGHT`, `DOWN`, and `LEFT`. Any other input, or the lack of input, results in a noop command and the snake continues in its current direction.

```cpp
#if defined(UP)
    constexpr const Input input = Input::Up;
#elif defined(RIGHT)
    constexpr const Input input = Input::Right;
#elif defined(DOWN)
    constexpr const Input input = Input::Down;
#elif defined(LEFT)
    constexpr const Input input = Input::Left;
#else
    constexpr const Input input = Input::None;
#endif
```

This code replaces the `/* get input */` block in the `main` function above.

## Example Game
Brining it all together, here’s an example game of interactive Nibbler. It runs around half a FPS, which, considering, is really not too bad. 

Using the clang compiler, we provide input using a compiler flag (`-D UP`, `-D DOWN`, `-D LEFT`, or `-D RIGHT`), and compile the current game to `snake`. The `snake` program is executed, which both prints out the new game board and also serializes it to a file. Recompiling continues on with the next step.

```
bash-3.2$ ./reset.sh 
bash-3.2$ clang++ -std=c++1y main.cpp  -o snake ; ./snake
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺▶*╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -D RIGHT -o snake ; ./snake
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺*╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺▶▶╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -o snake ; ./snake
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺*╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺▶▶╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -D UP -o snake ; ./snake
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺*╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▶╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -o snake ; ./snake
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▶╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -o snake ; ./snake
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -D RIGHT -o snake ; ./snake
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲▶╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -o snake ; ./snake
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲▶▶
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
bash-3.2$ clang++ -std=c++1y main.cpp -o snake ; ./snake
-- You Are Dead --
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲▶█
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
```

The [full source code][src] includes a `./reset.sh` command as well so you can easily play interactive nibbler for hours. Gotta get that high score.

As hinted at in a few asides thoughout this post, you probably could get rid of the runtime components entirely, instead using compiler errors to both display and serialize the game state. But I'll leave that as an exercise to the reader.

[src]: https://github.com/mattbierner/STT-C-Compile-Time-Snake/tree/interactive

[prandom]: /stupid-template-tricks-compile-time-pseudo-random-number-generator/
[part1]: /stupid-template-tricks-snake/

