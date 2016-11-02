---
layout: post
title: 'Super Template Tetris'
series: stupid_template_tricks
date: '2015-07-01'
---
Let me share with you a vision of the future which offers hope. It is that we embark on a program to counter the awesome Runtime threat with measures that are preemptive. Let us turn to the very strengths in templating that spawned our great metaprogramming base and have given us the beautiful C++ we enjoy today.

Today, I want to share an important first step with you: *Super Template Tetris*.

# A Rendezvous with Destiny
Yes. Tetris. In C++. At compiletime.

{% include image.html file="Screen-Shot-2015-06-28-at-10-45-30-PM.png" %}

Some people <sup>[who?]</sup> said it couldn't be done. C++ too old, they claim; metaprogramming a parlor trick, they cry. But sometimes, when you're up against it and those script cynics are beating you down, you just have to go out there and win one for the CPPer (Oh god, I am sorry for that one. I just don't know what has happened to this blog).

In this post, we're going to implement Tetris as a C++ template metaprogram. What exactly does that mean? Well, the game will be played by compiling its source code, with player input supplied by compiler flags, and all game logic will be implemented using C++ templates.

Tetris as a template metaprogram? Sounds scary. It's not though. 

The C++ template system is just a quirky functional programming language, albeit one with unfortunate syntax and some nasty pitfalls. And, while this isn't going to be a *Learn You A Template* style tutorial, hopefully this post will show that, by thinking functionally and breaking down problems, metaprogramming is manageable and fun.

Check out the complete, documented [source code on Github][source].

Let's get started.


# Templico, Illinois - Beginnings
*Super Template Tetris* isn't our first go at template based gaming. We previously implemented the arcade game *Snake* or *Nibbler* [as a C++ template metaprogram][nibbler].

{% include image.html file="Screen-Shot-2015-06-28-at-11-03-36-PM.png" %}

That project is a good starting point. Many of data structures, such as lists and grids, will be reused, and we will use the same basic logic for serialization and the game loop.

But let's step it up. This is ***Super** Template Tetris* after all. Besides just getting a compiletime Tetris clone up and running, secondary goals are:

* Color rendering.
* Develop a simple console graphics, compiletime library. 
* Concentrate all Runtime Bullshit in the `main.cpp` file and limit it to around ten lines of code with almost zero logic.
* And kill Hitler.

## Interactivity
{% include image.html file="Screen-Shot-2015-06-28-at-10-55-10-PM.png" description="To play Tetris, we're going to have to animate it frame-by-frame and basically make a flip book. Master Shake would not be pleased." %}

There are two approaches to compiletime gaming.

The non-interactive approach takes a list of player input and plays the entire game in a single compile, from initial state until the player looses or no more input is available. This is how Part One of [Template Nibbler][nibbler] worked.

While players do not have direct control of the game, a form of realtime play is possible by appending input to the input list and recompiling. However, because the compiler always starts from the initial game state, compile time grows linearly with the number of player inputs. Not the best endgame.

More interactive gameplay was developed for Part Two of [Template Nibbler][nibbler]. This plays the game one step at a time, with each compile taking a single player input and computing a single frame. Because frames are computed individually, the compile time of each frame is low, often reaching very reasonable, single digit SPF (seconds per frame). 

The challenge with the interactive approach is that the game state must be saved between compiles. And unfortunately, that pretty much has to be done at runtime.

*Super Template Tetris* targets the interactive approach.

## Game Loop
Each compile goes through one iteration of the game loop. At a high level, the game loop is identical to the one we used for [Template Nibbler][nibbler].

To review:

1. Load the current game state from a file. The game state is serialized to C++ source code, so loading uses a `#include` statement.
2. Read player input. Input is supplied by compiler flags.
3. Based on the current game state and input, determine the next game state.
4. Print the game state to the console.
5. Serialize the game state to C++ and save it to a file. 

*Super Template Tetris* changes up a few key details though. Mainly, the runtime components of steps four and five contain almost no logic. How will this be accomplished?

Before diving into any Tetris game logic, let's take a look at a few compiletime data structures.

# Peace Through String
We cheated a bit in [Template Nibbler][nibbler]. Sad, but true.

Nibbler defined the `Printer` interface to display the game state and the `Serialize` interface to save the game state to a file. Every type in Nibbler specialized these two interfaces, defining a static `Print` method that performed the given operation.

```cpp
template <typename>
struct Printer;

template <typename T, T x>
struct Printer<std::integral_constant<T, x>> {
    static std::ostream& Print(std::ostream& output) {
        return output << x;
    }
};
```

Seems innocent enough for simple types, such `std::integral_constant`, right? But other specializations did a bit more. Don't worry about any of the actual logic here, just notice all the computations that could happen at runtime when `Print` is called.

```cpp
template <PlayerState playerState, typename position, Direction direction, typename world, typename random>
struct Printer<State<playerState, position, direction, world, random>>
{
    static void Print(std::ostream& output) {
        output << "--" 
            << (playerState == PlayerState::Dead
                    ? " You Are Dead "
                    : "--------------")
            << "--\n";
        Printer<world>::Print(output);
    }
};
```

Ewwww, gross!!!

Look, template gaming will always require some Runtime Bullshit, at least until C++2X standardizes proper compiletime I/O, but in *Super Template Tetris*, we can contain and confine the Runtime contagion to a single location or two. 

Instead of defining a runtime print function for each type, we'll define a compiletime print function that translates that type into a compiletime string. Compiletime strings will store both the graphical representation of the world before it is printed to the console, and the serialization of the world before it is written to a file. This means that the only Runtime Bullshit required is the logic to print out a compiletime string. 

But what is a compiletime string?

## String
Jane Austen discussed the theory and implementation of compiletime strings in her seminal work, [Pride and Parser Combinators][pride]. We'll build on her work in *Super Template Tetris*. 

{% include image.html file="jane-austen_in_blue_dress_e5no.jpg" description="Jane Austen, template metaprogramming before it was cool." %}

`String` encodes a string as a character list type. 

```cpp
template <char... chars>
struct String {
    static constexpr const size_t size = sizeof...(chars);
};
```

`String` takes each character individually, so writing string literals is very tedious. Like in [Pride and Parser Combinators][pride], we'll use a user defined literal to automate the process.

```cpp
template <typename T, T... chars>
constexpr auto operator""_string() {
    return String<chars...>{};
}
```

```cpp
std::are_same<
    String<'a', 'b', 'c'>,
    decltype("abc"_string)>::value;
```

## ToString and print
One role of `String` is to store the game's visual representation before it is written to the console.

The `ToString` interface converts a type to a `String` and must be specified for any type that can be rendered.

```cpp
template <typename>
struct ToString;

template <typename s>
using to_string = typename ToString<s>::type;

template <char... chars>
struct ToString<String<chars...>> {
    using type = String<chars...>;
};
```

The prime benefit of `String` over `Printer` is that we only need a single runtime function to print a `String` to the console.

```cpp
template <char... elements>
std::ostream& print(std::ostream& output, String<elements...>) {
    return (output << ... << elements);
}
```

## String Operations
But, while on the subject of strings, let's cover a few other string operations. 

`string_add` combines two strings by smashing their character lists together at relativistic speeds.

```cpp
template <typename l, typename r>
struct StringAdd;

template <char... ls, char... rs>
struct StringAdd<String<ls...>, String<rs...>> {
    using type = String<ls..., rs...>;
};

template <typename l, typename r>
using string_add = typename StringAdd<to_string<l>, to_string<r>>::type;
```

```cpp
std::is_same<
    decltype("abcdefg"_string),
    string_add<
        String<'abc'>,
        string_add<
            String<>,
            decltype("defg"_string)>>>::value;
```

`string_join` combines multiple strings, separating elements by the `joiner` string. 

```cpp
template <typename joiner, typename...>
struct StringJoin;

template <typename joiner, typename... elements>
using string_join = typename StringJoin<joiner, elements...>::type;

template <typename joiner, typename first, typename second, typename... rest>
struct StringJoin<joiner, first, second, rest...> {
    using type =
        string_add<
            first,
            string_add<
                joiner,
                string_join<joiner, second, rest...>>>;
};

template <typename joiner, typename first>
struct StringJoin<joiner, first> {
    using type = to_string<first>;
};

template <typename joiner>
struct StringJoin<joiner> {
    using type = String<>;
};
```

`string_take` trims a `String` to be, at most, `n` characters long.

```cpp
template <size_t n, typename s, bool = (n == 0)>
struct StringTake {
    using type = String<>;
};

template <size_t n, typename s>
using string_take = typename StringTake<n, s>::type;

template <size_t n, char x, char... xs>
struct StringTake<n, String<x, xs...>, false> {
    using type =
        string_add<
            String<x>,
            string_take<n - 1, String<xs...>>>;
};
```

```cpp
std::is_same<
    decltype("Randy"_string),
    string_take<5, decltype("Randy, where's the rest of me!"_string)>>::value;
```

## Int To String
One final common operation is converting an integer value to a string representation of that value. `int_to_string` takes any integer value (positive or negative) and recursively builds up a string.

``` cpp
template <long val>
struct IntToString {
    struct Rec {
        using type =
            string_add<
                typename IntToString<val / 10>::type,
                String<'0' + (val % 10)>>;
    };

    using type =
        typename std::conditional_t<(val < 10),
            identity<String<'0' + (val % 10)>>,
            Rec>::type;
};

template <long val>
using int_to_string =
    string_add<
        std::conditional_t<val >= 0, String<>, String<'-'>>,
        typename IntToString<val >= 0 ? val : -val>::type>;
```


``` cpp
static_assert(
    std::is_same<
        String<'1', '3'>,
        int_to_string<13>>::value, "");

static_assert(
    std::is_same<
        String<'-', '1', '3', '3', '0'>,
        int_to_string<-1330>>::value, "");
```

# List is on the Air
The Tetris playfield is really not all that different than the world of [Template Nibbler][nibbler]. Both are grids, Tetris just arranges and moves pieces around its grid slightly differently. So we'll start with the same basic grid implementation as Nibbler, the grid as a list of lists.

{% include image.html file="Barry-Goldwater-Pin-Heart-Right.jpg" description="The Conscience of a Conser - The Barry Goldwater Story" %}

The actual compiletime list structure is almost completely unchanged from Nibbler, so it won't be covered here in any detail (checkout the [source][] if you are interested). Remember, we can get by with a finite list implementation for games like Nibbler and Tetris, instead of the lazy, potentially infinite list that we used to implement [Conway's Game of Life][life]. 

Many of our data structures support the same kinds of generic operations. We've already seen one example of this, `ToString`. Any type that specializes `ToString` can be rendered to a `String`.

```cpp
template <typename... elements>
struct ToString<List<elements...>> {
    using type = string_join<String<>, elements...>;
};
```

`List` also provides a good introduction to two other helpful interfaces: `Functor` and `Foldable`.

## Functor
[Functor](https://hackage.haskell.org/package/base-4.7.0.2/docs/Data-Functor.html) maps a metafunction function `f` over a type `x`. A metafunction is just a type with a template `apply` member, which can be invoked using the `call` helper.

```cpp
template <typename f, typename... args>
using call = typename f::template apply<args...>::type;

template <typename f, typename x>
struct FMap {
    using type = call<f, x>;
};

template <typename f, typename x>
using fmap = typename Fmap<f, x>::type;
```

Fmapping a list applies `f` to every element of the list.

```cpp
template <typename f, typename... elements>
struct FMap<f, List<elements...>> {
    using type = List<call<f, elements>...>;
};
```

```cpp
template <typename T>
struct identity { using type = T; };

struct Doop {
    template <typename x>
    using apply = identity<List<x, x>>;
};

std::is_same<
    List<List<bool, bool>, List<int, int>, List<List<>, List<>>>,
    fmap<Doop, List<bool, int, List<>>>>::value;
```

## Foldable
[Foldable](http://hackage.haskell.org/package/base-4.8.0.0/docs/Data-Foldable.html) maps and accumulates over a type with a metafunction. Unlike `Functor`,
`Foldable` produces a result value instead of applying the function inside of the structure.

The `Foldable` interface takes three arguments: metafunction `f` which is invoked with the accumulated value and the current value , initial value `z`, and the target structure `s`.

```cpp
template <typename f, typename z, typename s>
struct Foldable {
    using type = call<f, z, s>;
};

template <typename f, typename z, typename s>
using fold = typename Foldable<f, z, s>::type;
```

Fold will be used for lists, and later grids, to check for collisions, find full rows, and more.

```cpp
template <typename f, typename z>
struct Foldable<f, z, List<>> {
    using type = z;
};

template <typename f, typename z, typename x, typename... xs>
struct Foldable<f, z, List<x, xs...>> {
    using type = fold<f, call<f, z, x>, List<xs...>>;
};
```

# Grid-nada
Grids store the *Super Template Tetris* playfield and the game screen. Abstracting the screen to a grid of pixels allows us to develop a simple, compiletime graphics library to render more complex scenes.

The grid structure is almost identical to the one we used in [Template Nibbler][nibbler]. A grid is just a list of lists, with each inner list storing a row of values. 

```cpp
template <typename r>
struct Grid {
    using rows = r;
    
    static constexpr size_t height = rows::size;
    
    struct GetWidth {
        using type = std::integral_constant<size_t, get<0, rows>::size>;
    };
    static constexpr size_t width =
        std::conditional_t<height == 0,
            identity<std::integral_constant<size_t, 0>>,
            GetWidth>::type::value;
};
```

`width` is the only complication.

`Grid` assumes that all rows have the same width, so it takes the size of the first row as the width of the entire grid. But, in cases where the grid is empty, `get<0, rows>` does not compile. That's why we have to [short circuit][short-circuit] the evaluation of width.

## Creating Grids
The `Grid` constructor is not often directly used. We'll mostly create empty grids and transform them.

`gen_grid` builds a `width` by `height` grid of `value`.

```cpp
template <size_t width, size_t height, typename value>
using gen_grid = Grid<gen<height, gen<width, value>>>;
```

`create_list_grid` and `create_line_grid` both create a grid with a single row or column based on orientation.

```cpp
enum class Orientation {
    Vertical,
    Horizontal
};
```

`create_list_grid` is the more generic of the two, taking a list of values and transforming it into a grid with a single row or column. 

```cpp
template <template<typename...> class f>
struct mfunc {
    template <typename... args>
    using apply = identity<f<args...>>;
};

template <Orientation orientation, typename list>
using create_list_grid =
    Grid<
        std::conditional_t<orientation == Orientation::Vertical,
            f_map<mfunc<List>, list>,
            List<list>>>;
```

For the vertical case, we `fmap` the input list to wrap each value in a `List`. `mfunc` takes a template, the `List` constructor in this case, and turns it into a metafunction.

`create_line_grid` behaves much the same way, except that it generates a list of `value` repeated `size` times.

```cpp
template <Orientation orientation, size_t size, typename value>
using create_line_grid = create_list_grid<orientation, gen<size, value>>;
```

## Grid Lookups / Editing
Grid cells are addressed by `Position`.

```cpp
template <int xVal, int yVal>
struct Position {
    static constexpr int x = xVal;
    static constexpr int y = yVal;
    
    template <typename p2>
    using add = Position<x + p2::x, y + p2::y>;
};
```

`grid_get` looks up a value in a grid, first getting the target row and then getting the target column in that row.

```cpp
template <typename pos, typename g>
using grid_get = get<pos::x, get<pos::y, typename g::rows>>;
```

`grid_put` edits a cell in a grid, first updating the target row and then updating the list of rows.

```cpp
template <typename pos, typename value, typename g>
using grid_put = Grid<
    put<
        pos::y,
        put<pos::x, value, get<pos::y, typename g::rows>>,
        typename g::rows>>; 
```

And `grid_remove_row` removes a row, while `grid_cons_row` adds one back in at the top of the grid.

```cpp
template <size_t N, typename g>
using grid_remove_row = Grid<slice_out<N, typename g::rows>>;

template <typename newRow, typename g>
using grid_cons_row = Grid<cons<newRow, typename g::rows>>;
```

One last, somewhat unrelated, operation: converting a grid to positions. `grid_zip_positions` is the basis of this, transforming a grid of values into a grid of position, value pairs.

```cpp
template <typename g, typename pos>
using nextPosition =
    Position<
        (pos::x + 1) % g::width,
        pos::x + 1 == g::width ? pos::y + 1 : pos::y>;

template <typename g>
struct GridZipPositions {
    template <typename p, typename c>
    struct apply {
        using pos = car<p>;
        using grid = caar<p>;
        using type = List<
            nextPosition<grid, pos>,
            grid_put<pos, List<pos, c>, grid>>;
    };
};

template <typename g>
using grid_zip_positions =
    caar<fold<
        GridZipPositions<g>,
        List<Position<0, 0>, g>,
        g>>;
```

## Combining Grids
`grid_get` and `grid_put` do not compile if the requested position is outside of the grid. For many cases though, such as when drawing to the screen grid, it makes sense to just ignore positions outside of the screen.

`grid_is_in_bounds` checks if a position is within the bounds of a grid. 

```cpp
template <typename pos, typename g>
constexpr bool grid_is_in_xbounds = pos::x >= 0 && pos::x < g::width;

template <typename pos, typename g>
constexpr bool grid_is_in_ybounds = pos::y >= 0 && pos::y < g::height;

template <typename pos, typename g>
constexpr const bool grid_is_in_bounds =
    grid_is_in_xbounds<pos, g> && grid_is_in_ybounds<pos, g>;
```

`GridTryPut` updates an entry in a grid using a metafunction. It uses `grid_is_in_bounds` to noop for positions outside of the grid. 

```cpp
template <typename combine, typename pos, typename value, typename g>
struct GridTryPut {
    struct DoPut {
        using type = grid_put<
            pos,
            call<combine, grid_get<pos, g>, value>,
            g>;
    };

    using type =
        typename std::conditional_t<grid_is_in_bounds<pos, g>,
            DoPut,
            identity<g>>::type;
};
```

`grid_place_row` uses similar logic to update an entire row of a grid.

```cpp
template <typename combine>
struct GridPlaceRow {
    template <typename p, typename c>
    struct apply {
        using type = List<
            typename GridTryPut<combine, caar<p>, c, car<p>>::type,
            typename caar<p>::template add<Position<1, 0>>>;
    };
};

template <typename combine, typename origin, typename row, typename grid>
using grid_place_row = car<fold<
    GridPlaceRow<combine>,
    List<grid, origin>,
    row>>;
```

While `grid_place_grid` combines two grids using an update function, again ignoring any positions outside of the grid.

```cpp
template <typename combine>
struct GridPlaceGrid {
    template <typename p, typename c>
    struct apply {
        using type = List<
            grid_place_row<combine, caar<p>, c, car<p>>,
            typename caar<p>::template add<Position<0, 1>>>;
    };
};

template <typename combine, typename origin, typename other, typename grid>
using grid_place_grid = car<fold<
    GridPlaceGrid<combine>,
    List<grid, origin>,
    typename other::rows>>;
```

These update operations are the basis for both drawing to the screen and updating the playfield in *Super Template Tetris*.


# Buffer
Some gamers scoffed at good o' Template Nibbler's black and white, console graphics. They should be happy that there were any graphics at all. Real template gamers play by compiler error alone. But I guess we can throw them a bone. 

{% include image.html file="Screen-Shot-2015-06-28-at-6-04-53-PM.png" description="I ain't seen nothing like him in any amusement hall..." %}

That's why *Super Template Tetris* features an astonishing new graphics system capable of unprecedented levels of detail and nearly photorealistic rendering*.

Template Nibbler's rendering system was simple, it just printed out the game board grid as a string and then consed on some UI. That's not going to fly this time. Its just not scalable. With *Super Template Tetris*, we want to decouple the graphics from the game state more, and also support drawing UI and other elements more easily.

At the heart of this new rendering system is `Buffer`. `Buffer` is a grid of "pixels" that can be easily printed to the console. So, let's take a look at the `Buffer` and then implement a very simple graphics library.

*\* When compared to other template based gaming systems.*

## Pixel
First off, color. That's right, *Super Template Tetris* supports color rendering.

While the human eye only has receptors for three colors, and your dog makes do with a measly two colors, *Super Template Tetris* supports an astonishing [eight drawing colors][ansi-colors]!

```cpp
enum class Color : unsigned {
    Black = 0,
    Red = 1,
    Green = 2,
    Yellow = 3,
    Blue = 4,
    Magenta = 5,
    Cyan = 6,
    White = 7,
    Default = 9
};
```

*Super Template Tetris* renders to the console, so the smallest visual unit is the character. `Pixel` encodes this visual unit as a type, storing both the character to draw and how it should be drawn.

```cpp
template <char val, typename g = default_gfx>
struct Pixel {
    static constexpr const char value = val;
    using gfx = g;
};
```

`Gfx` tells the system how each `Pixel` should be drawn. We control both the foreground (text) color and background (highlight) color of each character.

```cpp
template <Color fg, Color bg>
struct Gfx {
    static constexpr const Color foreground = fg;
    static constexpr const Color background = bg;
    
    template <Color newColor>
    using setBg = Gfx<fg, newColor>;
    
    template <Color newColor>
    using setFg = Gfx<newColor, bg>;
};
```

`default_gfx` uses the terminal's standard drawing mode, white text on a black background for example.

```cpp
using default_gfx = Gfx<Color::Default, Color::Default>;
```

To draw a given `Pixel` to the screen, we convert the foreground and background colors to their [ANSI color codes][ansi-colors]. `escape_code` provides the basic logic for this.

```cpp
template <unsigned x>
using escape_code =
    string_join<String<>,
        decltype("\x1b["_string),
        int_to_string<x>,
        String<'m'>>;

template <Color c>
using color_to_fg_code = escape_code<30 + static_cast<unsigned>(c)>;
    
template <Color c>
using color_to_bg_code = escape_code<40 + static_cast<unsigned>(c)>;
```

Setting the ANSI color code is a stateful operation. Print the magenta background color escape code, `\x1b[45m`, and all text printed to the console after will have a magenta background until someone changes the background color again.

`colorReset`, with the escape code `\x1b[0m`, resets both the foreground and background colors to the terminal defaults.

```cpp
using colorReset = escape_code<0>;
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-05-58-PM.png" %}

Finally, `empty_pixel` encodes a transparent pixel. It's not actually a `Pixel` but a distinct type.

```cpp
struct empty_pixel { };

template <typename x>
struct IsEmpty : std::is_same_t<x, empty_pixel> {};

template <typename x>
constexpr const bool is_empty = std::is_same<x, empty_pixel>::value;
```

We'll write `Buffer` to ignore `empty_pixel` while drawing, allowing us to draw blocks to the screen without overwriting the existing graphics in the empty areas of the block.

`ToString` `Pixel` creates the string representation of that character. This will be printed to the console to render the screen. `Pixel` always explicitly sets both the foreground and background colors, and resets them after it finishes rendering the character.  

```cpp
template <>
struct ToString<empty_pixel> {
    using type = String<' '>;
};

template <char val, typename gfx>
struct ToString<Pixel<val, gfx>> {
    using type =
        string_join<String<>,
            color_to_fg_code<gfx::foreground>,
            color_to_bg_code<gfx::background>,
            String<val>,
            colorReset>;
};
```

```cpp
print(std::cout,
    to_string<Pixel<'X', Gfx<Color::Magenta, Color::Yellow>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-14-23-PM.png" %}

## Basic Buffer
A buffer is just a grid of pixels. Each frame starts with an `empty_buffer`

```cpp
template <size_t width, size_t height>
using empty_buffer = gen_grid<width, height, empty_pixel>;
```

Because `Buffer` is a grid, all the standard grid operations work just fine.

```cpp
print(std::cout,
    to_string<grid_put<
        Position<2, 3>,
        Pixel<'X', Gfx<Color::Magenta, Color::Yellow>>,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-24-29-PM.png" %}

As hinted at, a [sprite][] is just another buffer with some possible transparency (`empty_pixel`). To draw a sprite to the screen, we copy all non-empty pixels from the source sprite to the screen at some offset position.

`grid_place_grid` already provides the bulk of the logic for this operation, all we need to do is pass in the `BufferCombine` metafunction which only draws non-empty pixels from the source sprite.

```cpp
struct BufferCombine {
    template <typename current, typename toPlace>
    using apply =
        std::conditional<is_empty<toPlace>,
            current,
            toPlace>;
};

template <typename origin, typename other, typename grid>
using buffer_draw_grid = grid_place_grid<BufferCombine, origin, other, grid>;
```

```cpp
using px = Pixel<'X', Gfx<Color::Magenta, Color::Yellow>>;

print(std::cout,
    to_string<buffer_draw_grid<
        Position<2, 3>,
        grid_put<
            Position<0, 0>,
            empty_pixel,
            gen_grid<2, 2, px>>,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-29-42-PM.png" %}

## Basic Drawing 
`buffer_draw_grid` is enough to start putting together a simple, console graphics library.

`buffer_draw_line` draws a straight line of `px` repeated `len` times.

```cpp
template <typename origin, Orientation orientation, size_t len, typename px, typename buffer>
using buffer_draw_line =
    buffer_draw_grid<
        origin,
        create_line_grid<orientation, len, px>,
        buffer>;
```

```cpp
print(std::cout,
    to_string<buffer_draw_line<
        Position<2, 1>,
        Orientation::Vertical,
        3,
        px,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-32-12-PM-1.png" %}

`buffer_draw_rect` draws a filled rectangle.

```cpp
template <typename origin, typename size, typename px, typename buffer>
using buffer_draw_rect =
    buffer_draw_grid<
        origin,
        gen_grid<size::width, size::height, px>,
        buffer>;
```

```cpp
print(std::cout,
    to_string<buffer_draw_rect<
        Position<2, 1>,
        Size<4, 3>,
        px,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-35-13-PM.png" %}

While `buffer_draw_rect_outline` draws the outline of a rectangle using four lines:

```cpp
template <typename origin, typename size, typename px, typename buffer>
using buffer_draw_rect_outline =
    buffer_draw_line<origin, Orientation::Horizontal, size::width, px,
        buffer_draw_line<origin, Orientation::Vertical, size::height, px,
            buffer_draw_line<typename origin::template add<Position<0, size::height - 1>>, Orientation::Horizontal, size::width, px,
                buffer_draw_line<typename origin::template add<Position<size::width - 1, 0>>, Orientation::Vertical, size::height, px, buffer>>>>;
```

```cpp
print(std::cout,
    to_string<buffer_draw_rect_outline<
        Position<2, 1>,
        Size<4, 3>,
        px,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-35-27-PM-1.png" %}

And because of the bounds checking in `grid_place_grid`, drawing that extends outside of the buffer is automatically clipped.

## Text
One advantage of rendering to a console is that strings are really easy to print. `buffer_draw_text` renders a `String` into a buffer.

```cpp
template <typename origin, Orientation orientation, typename str, typename gfx, typename buffer>
struct BufferDrawText;

template <typename origin, Orientation orientation, typename gfx, typename buffer, char... chars>
struct BufferDrawText<origin, orientation, String<chars...>, gfx, buffer> {
    using type =
        buffer_draw_grid<
            origin,
            create_list_grid<orientation, List<Pixel<chars, gfx>...>>,
            buffer>;
};

template <typename origin, Orientation orientation, typename str, typename gfx, typename buffer>
using buffer_draw_text = typename BufferDrawText<origin, orientation, str, gfx, buffer>::type;
```

```cpp
print(std::cout,
    to_string<buffer_draw_text<
        Position<2, 0>,
        Orientation::Vertical,
        decltype("Hello!"_string),
        default_gfx::setFg<Color::Magenta>,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-39-50-PM.png" %}

`buffer_draw_text` always draws the entire string of text starting at the origin. For UI though, we often want to render text inside a specific area, clipping overflow and perhaps centering the text if it does not fill the entire area. `buffer_draw_centered_text` automates this.

```cpp
template <Orientation o, int size>
using create_offset =
    std::conditional_t<o == Orientation::Vertical,
        Position<0, size>,
        Position<size, 0>>;

template <
    typename origin,
    Orientation orientation,
    size_t max,
    typename str,
    typename gfx,
    typename buffer,
    typename trimmedStr = typename StringTake<max, str>::type>
using buffer_draw_centered_text =
    buffer_draw_text<
        typename origin::template add<create_offset<orientation, (max - trimmedStr::size) / 2>>,
        orientation,
        trimmedStr,
        gfx,
        buffer>;
```

```cpp
print(std::cout,
    to_string<buffer_draw_centered_text<
        Position<0, 2>,
        Orientation::Horizontal,
        6,
        decltype("ab"_string),
        default_gfx::setFg<Color::Magenta>,
        empty_buffer<6, 6>>>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-24-at-9-41-10-PM.png" %}


# Tetrominos and the Playfield
{% include image.html file="sdi.png" description="That's right Space, you best check yourself lest you wreck yourself." %}

Damn. More than halfway in and not one line of code concerning Tetris's game logic. It's not like we haven't made progress though. We've built up a set of compiletime data structures, created a simple graphics library, and seen how to render graphics using `print`.

Time to do something with all that work.

## Tetrominos
Each Tetris piece, or tetromino, is an arrangement of four connected blocks. Standard Tetris features seven kinds of tetrominos, each commonly named after the letter of the alphabet that best fits its shape: I, J, L, O, S, T, and Z.

*Super Template Tetris* stores tetrominos in a buffer.

```cpp
using x_cell = empty_pixel;
using s_cell = Pixel<' ', default_gfx::setBg<Color::Green>>;

using sblock_data = Grid<List<
    List<x_cell, s_cell, s_cell>,
    List<s_cell, s_cell, x_cell>,
    List<x_cell, x_cell, x_cell>>>;
```

Each tetromino has four possible orientations specified by the [Super Rotation System (SRS)][srs]. Rather than develop an algorithm to correctly rotate tetrominos according to the SRS, the set of tetrominos is small enough that we can just as easily hardcode all the rotations.

`Block` stores all the data about a tetromino, including its total set of rotations `o`, and the index of the current rotation `r`.

```cpp
template <size_t r, typename o>
struct Block {
    using orientations = o;
    using piece = get<r, o>;
    
    using rotateCw = Block<(r + 1) % o::size, o>;
    using rotateCcw = Block<r == 0 ? o::size - 1 : r - 1, o>;
};
```

`piece` is the buffer for the tetromino's current rotation. Rotations are performed simply by incrementing and decrementing `r`. 

Here's the specification of an `SBlock`

```cpp
using x_cell = empty_pixel;
using s_cell = Pixel<' ', default_gfx::setBg<Color::Green>>;

using SBlock = Block<0,
    List<
        Grid<List<
            List<x_cell, s_cell, s_cell>,
            List<s_cell, s_cell, x_cell>,
            List<x_cell, x_cell, x_cell>>>,
        Grid<List<
            List<x_cell, s_cell, x_cell>,
            List<x_cell, s_cell, s_cell>,
            List<x_cell, x_cell, s_cell>>>,
        Grid<List<
            List<x_cell, x_cell, x_cell>,
            List<x_cell, s_cell, s_cell>,
            List<s_cell, s_cell, x_cell>>>,
        Grid<List<
            List<s_cell, x_cell, x_cell>,
            List<s_cell, s_cell, x_cell>,
            List<x_cell, s_cell, x_cell>>>>>;
```

```cpp
print(std::cout,
    to_string<SBlock::piece>{}) << "\n";
```

{% include image.html file="Screen-Shot-2015-06-25-at-9-26-48-PM.png" %}

## Random Bag
Tetrominos are randomly selected during gameplay. But how do we generate random numbers at compiletime?

Template Nibbler randomly placed food pieces in its game world using a linear feedback shift reduce register based compiletime random number generator. But encoding binary as `std::integer_sequences<bool, ...>` may have been slight case of template overkill.

A linear congruent generator accomplishes much the same in six lines of rather boring code.

```cpp
template <unsigned seed, unsigned a, unsigned c, unsigned max = std::numeric_limits<unsigned>::max()>
struct LinearGenerator {
    static constexpr const unsigned value = ((long)seed * a + c) % max;
    using next = LinearGenerator<value, a, c, max>;
};
```

`Random` provides some BSD values to the generator and also clamps its output to `[0, max)`

```cpp
template <unsigned max, typename rand = LinearGenerator<0, 1103515245, 12345>>
struct Random {
    static constexpr const unsigned value = rand::value % max;
    using next = Random<max, typename rand::next>;
};
```

`BlockGenerator` randomly produces the actual blocks for gameplay from a list of all tetrominos.

```cpp
using blocks = List<IBlock, JBlock, LBlock, OBlock, SBlock, TBlock, ZBlock>;

template <typename rand>
struct BlockGenerator {
    using next = BlockGenerator<typename rand::next>;
    using value = get<rand::value, blocks>;
};

using initialBlockGenerator = BlockGenerator<Random<blocks::size>>;
```

## Playfield
The Tetris playfield is also just a buffer, a grid of pixels ten wide and twenty high. Placing a block that extends off the top of the playfield ends the game. Let's call that area at the top of the playfield the dangerzone.

For practical purposes, we'll store dangerzone in the top four rows of the playfield.

```cpp
constexpr const size_t worldWidth = 10;
constexpr const size_t worldHeight = 20;
constexpr const size_t dangerZoneHeight = 4;

using InitialWorld = gen_grid<worldWidth, worldHeight + dangerZoneHeight, x_cell>;
```

`playfield_is_empty` checks if a given position in the playfield is empty. 

```cpp
template <typename pos, typename grid>
struct CheckIsEmpty :
    IsEmpty<grid_get<pos, grid>> { };

template <typename pos, typename grid>
constexpr const bool playfield_is_empty =
    logical_and<
        grid_is_in_bounds<pos, grid>,
        Thunk<CheckIsEmpty, pos, grid>>::value;
```

`playfield_is_empty` requires [short circuit evaluation][short-circuit] using `logical_and`, so as to only try to get elements that are within the grid's bounds. `Thunk` creates a metafunction that calls another metafunction (`CheckIsEmpty`) with a set of arguments (`pos` and `grid`).

`playfield_get_positions` returns a list of all non-empty positions within the playfield. An optional `offset` is added to each position found.

```cpp
template <typename grid, typename offset>
struct PlayfieldGetPositionsReducer {
    template <typename p, typename c>
    using apply =
        std::conditional<is_empty<caar<c>>,
            p,
            cons<typename car<c>::template add<offset>, p>>;
};

template <typename grid, typename offset = Position<0, 0>>
using playfield_get_positions =
    fold<
        PlayfieldGetPositionsReducer<grid, offset>,
        List<>,
        grid_zip_positions<grid>>;
```

## Collision Checking
The primary role of the playfield is to store blocks and check for collisions with the active `Tetromino`. Again, we can reuse many of the base grid operations to implement collision checking.

One useful application of `Foldable` is to test all elements of a structure with a predicate. The template variable `any` applies a metapredicate to any `Foldable` `s`, returning true if the metapredicate was satisfied for any value in `s`.

```cpp
template <typename f>
struct AnyReducer {
    template <typename p, typename c>
    using apply = logical_or<p::value, Thunk<call, f, c>>;
};

template <typename f, typename s>
constexpr const bool any = fold<AnyReducer<f>, std::false_type, s>::value;
```

`Grid` implements `Foldable` so we can use `any` on it to find collisions. The active tetromino can never overlap with any blocks in the current playfield. `playfield_is_colliding` detects these collisions, using `any` to check if `block` (just another grid) at `position` in playfield `g` is colliding.

```cpp
template <typename position, typename block, typename g>
struct PlayfieldIsCollidingCheck {
    template <typename c>
    using apply =
        identity<std::integral_constant<bool,
            !playfield_is_empty<c, g>>>;
};

template <typename position, typename block, typename g>
constexpr const bool playfield_is_colliding =
    any<
        PlayfieldIsCollidingCheck<position, block, g>,
        playfield_get_positions<block, position>>;
```

The playfield's other role is to remove full rows. `playfield_get_full_rows` returns the indices of all full rows in a playfield. A row is full if every block in that row is not empty. 

```cpp
struct PlayfieldGetFullRows {
    template <typename p, typename c>
    using apply =
        identity<List<
            std::conditional_t<any<mfunc<IsEmpty>, c>,
                car<p>,
                cons<std::integral_constant<size_t, caar<p>::value>, car<p>>>,
            std::integral_constant<size_t, caar<p>::value + 1>>>;
};

template <typename g>
using playfield_get_full_rows = car<
    fold<
        PlayfieldGetFullRows,
        List<List<>, std::integral_constant<size_t, 0>>,
        typename g::rows>>;
```

After identifying full rows, we use `playfield_remove_row` to actually remove them. After the target row is removed, an empty row is added to the top of the playfield to maintain its height.

```cpp
template <size_t i, typename g>
using playfield_remove_row =
    grid_cons_row<
        gen<g::width, empty_pixel>,
        grid_remove_row<i, g>>;
```


# Game Logic
Time to Tetris. About time.

## State 
The entire state of *Super Template Tetris* is stored in seven variables:

* Player state - Is the player alive or dead?
* Score - Number of points the player has.
* Delay - Number of frames the active tetromino has been resting. This is used to prevent a piece from instantly being placed when it collides with a block of the playfield. Instead, the player can continue to move the active tetromino around until the delay expires.
* Position - Top left position of the player controlled tetromino.
* Block - Tetromino controlled by the player.
* World - Playfield. Contains all placed blocks.
* Block generator - Random tetromino bag. 

`State` captures all this information, provides setters for many of the variables, and also exposes a few helper values like `is_collision`.

```cpp
enum class PlayerState : unsigned {
    Alive,
    Dead
};

template <
    PlayerState currentPlayerState,
    unsigned currentScore,
    size_t currentDelay,
    typename currentPosition,
    typename currentBlock,
    typename currentWorld,
    typename currentBlockGenerator>
struct State {
    /* Non-computed Members */
    
    using nextBlock = typename currentBlockGenerator::next::value;

    static constexpr const bool is_collision =
        playfield_is_colliding<
            position,
            typename block::piece,
            world>;

    /* Setters */
};
```

`place_initial_piece` places the next tetromino from the block generator in the game world. Tetrominos begin centered at top of the playfield, fully inside of the dangerzone. 

```cpp
template <typename s>
using place_initial_piece =
    typename s
        ::template set_position<
            Position<
                (s::world::width / 2) - (s::nextBlock::piece::width / 2),
                0>>
        ::template set_block<typename s::nextBlock>
        ::template set_random<typename s::random::next>;
```

`initialState` captures the state of a new game.

```cpp
using initialState =
    place_initial_piece<
        State<
            PlayerState::Alive,
            0,
            0,
            Position<0, 0>,
            typename initialBlockGenerator::value,
            InitialWorld,
            initialBlockGenerator>>;
```

## Transition Function
*Super Template Tetris* is rendered one frame at a time, at about 5 SPF. The `step` transition function takes player input and the current state, and produces the next state.

The simplist case is when the player has lost the game.

```cpp
template <Input input, typename state>
struct step;

template <
    Input input,
    unsigned score,
    size_t delay,
    typename... vars>
struct step<input, State<PlayerState::Dead, score, delay, vars...>> {
    using type = State<PlayerState::Dead, score, delay, vars...>;
}; 
```

If the player has not yet lost the game, the next frame is computed as follows:

1. Input - Move the block in response to player input.
2. Gravity - Move the block downwards and possibly place it if there is a collision.
3. Remove full rows - Remove all full rows from the playfield and update the player's score.
4. Check game over - If, after completing the previous three steps, any playfield block is inside of the dangerzone, the player has lost.

```cpp
template <Input input, typename state>
struct step {
    /* apply_gravity */
    /* update_full_rows */
    /* check_game_over */

    using type =
        check_game_over<
        update_full_rows<
        apply_gravity<
            typename move<input, state>::type>>>;
};
```

Let's look at movement first.

## Movement
The player can input one of eight commands to control the active tetromino.

```cpp
enum class Input : unsigned {
    None, // Do nothing.
    Hard, // Hard drop the block to the bottom, placing it.
    Soft, // Soft drop the block to the bottom but don't place it.
    Down, // Softly move the block down by 4.
    Left, // Nudge block left by 1.
    Right, // Nudge block right by 1.
    LRot, // Rotate block to the left (counter-clockwise)
    RRot  // Rotate block to the right (clockwise)
};
```

Movement is only valid if it does not produce a collision. Invalid moves are treated like `Input::None`.

`move` attempts to apply the player's input to the current game state, returning the original game state if a collision occurs.

```cpp
template <Input input, typename state>
struct move {
    using next = typename move_block<input, state>::type;
    using type = std::conditional_t<next::is_collision, state, next>;
};
```

`move_block` actually moves the piece in response to the player's input, but does not check if a collision occurred. `move_block` may also increment or reset the current delay, which, remember, tracks how long a block has been colliding.

`Input::None` uses the non-specialized version of `move_block`. 

```cpp
template <Input input, typename state>
struct move_block {
    using type = typename state::inc_delay;
};
```

`Input::Left` and `Input::Right` shift the current position.

```cpp
template <typename state>
struct move_block<Input::Left, state> {
    using type = typename state
        ::template set_position<
            typename state::position::template add<Position<-1, 0>>>
        ::reset_delay;
};

template <typename state>
struct move_block<Input::Right, state> {
    using type = typename state
        ::template set_position<
            typename state::position::template add<Position<1, 0>>>
        ::reset_delay;
};
```

While `Input::RRot` and `Input::LRot` change the current block's rotation. A proper implementation of Tetris would handle kicks and other corner cases, but we won't worry about those here.

```cpp
template <typename state>
struct move_block<Input::RRot, state> {
    using type = typename state
        ::template set_block<typename state::block::rotateCw>
        ::reset_delay;
};

template <typename state>
struct move_block<Input::LRot, state> {
    using type = typename state
        ::template set_block<typename state::block::rotateCcw>
        ::reset_delay;
};
```

The various drop commands (`Input::Hard`, `Input::Soft`, and `Input::Down`) are a bit more complex since their behavior depends on the state of the playfield as well. Each of these commands moves the current piece down by some number of steps (infinite for `Input::Hard` and `Input::Soft`, four for `Input::Down`), or until the current piece collides with a placed block. `Drop` implements this recursively.

```cpp
template <size_t max, typename state>
struct Drop {
    using next = typename state
        ::template set_position<
            typename state::position::template add<Position<0, 1>>>;
    
    struct NoCollision {
        using type = typename Drop<max - 1, next>::type;
    };
    
    using type =
        typename std::conditional_t<next::is_collision,
            identity<state>,
            NoCollision>::type;
};

template <typename state>
struct Drop<0, state> {
    using type = state;
};
```

Which is enough for both `Input::Soft` and `Input::Down`

```cpp
template <typename state>
struct move_block<Input::Down, state> {
    using type = typename Drop<4, state>::type::reset_delay;
};

template <typename state>
struct move_block<Input::Soft, state> {
    using type = typename Drop<static_cast<size_t>(-1), state>::type::reset_delay;
};
```

`Input::Hard` performs the same infinite drop as `Input::Soft` but also places the current piece. Placing the piece is accomplished by setting the delay to its maximum value, so that `step` sees that both the current piece is colliding and that the delay is over its limit, ensuring placement.

```cpp
template <typename state>
struct move_block<Input::Hard, state> {
    using type = typename Drop<static_cast<size_t>(-1), state>
        ::template set_delay<static_cast<size_t>(-1)>;
};
```

## Gravity
Back in the `step` function.

After player input is processed, `apply_gravity` moves the active block down by one. 

```cpp
template <Input input, typename state>
struct step {
    template <
        typename s,
        typename gnext = typename s::template set_position<typename s::position::template add<Position<0, 1>>>>
    using apply_gravity =
        typename std::conditional_t<gnext::is_collision,
            TryPlaceCollisionPiece<s>,
            identity<gnext>>::type;

    /* ... */
};
```

If a collision occurs after gravity is applied, we may place the current piece.  `TryPlaceCollisionPiece` uses the old, non-colliding state to places the active piece if the current delay is over its limit (one frame).

```cpp
template <typename s>
using place_piece =
    place_initial_piece<
        typename s::template set_world<
            buffer_draw_grid<
                typename s::position,
                typename s::block::piece,
                typename s::world>>>;

template <typename s>
struct TryPlaceCollisionPiece :
    std::conditional<(s::delay >= standardDelay),
        typename place_piece<s>::reset_delay,
        s> { };
```

## Scoring
Gravity and movement done. On to collapsing full rows.

`update_full_rows` computes the number of full rows, removes them, and updates the score based on the number removed.

```cpp
template <Input input, typename state>
struct step {
    /* ... */

    struct RemoveFullRow {
        template <typename p, typename c>
        using apply = identity<
            typename p::template set_world<
                playfield_remove_row<c::value, typename p::world>>>;
    };

    template <typename s,
        typename fullRows = playfield_get_full_rows<typename s::world>>
    using update_full_rows =
        update_score<
            fullRows::size,
            fold<RemoveFullRow, s, fullRows>>;

    /* ... */
};
```

Scoring is weighted to reward removing more rows in a single action.

```cpp
template <size_t rowsRemoved, typename s>
using update_score =
    typename s::template set_score<
        s::score +
            (rowsRemoved == 1
                ?40
            :rowsRemoved == 2
                ?100
            :rowsRemoved == 3
                ?300
            :rowsRemoved == 4
                ?1200
                :0)>;
```

Tetris would be pretty boring if you could never lose. As a final step, after the current piece has potentially been placed and all full rows have been removed, `check_game_over` checks if the player has lost. A loss is detected by checking if anything in the playfield is colliding with the dangerzone.

```cpp
template <typename s>
using check_game_over =
    std::conditional_t<
        playfield_is_colliding<
            Position<0, 0>,
            gen_grid<s::world::width, dangerZoneHeight, o_cell>,
            typename s::world>,
        typename s::set_game_over,
        s>;
```

And that's Tetris for you. Not too complex actually.

Just two components left: rendering and saving.


# That Printer of Tetrominos
`State` specializes `ToString`, creating a screen that is slightly larger than the playfield's size. 

```cpp
template <
    PlayerState playerState,
    unsigned score,
    size_t delay,
    typename position,
    typename block,
    typename world,
    typename blockGenerator>
struct ToString<
    State<playerState, score, delay, position, block, world, blockGenerator>>
{
    using self = State<playerState, score, delay, position, block, world, blockGenerator>;
    
    static constexpr const size_t uiSize = 10; // on the right side of game
    
    using screen = empty_buffer<world::width + 2 + uiSize, world::height + 2>;
    
    /*...*/
    
    using type = to_string<...>;
};
```

Breaking down the drawing step-by-step, first we outline the playfield and draw the dangerzone. The order of drawing is important for some components, as drawing always overwrites existing data in the buffer.

```cpp
using outline = buffer_draw_rect_outline<
    Position<0, 0>,
    Size<world::width + 2, world::height + 2>,
    Pixel<'+', default_gfx>,
    screen>;
    
using dz_buffer = buffer_draw_rect<
    Position<1, 1>,
    Size<world::width, dangerZoneHeight>,
    Pixel<'-', default_gfx>,
    outline>;
```

{% include image.html file="Screen-Shot-2015-06-26-at-12-29-16-AM-1.png" %}

Next comes UI, displaying the current score, next block, and a message if the player has lost the game.

```cpp
using next_block = buffer_draw_grid<
    Position<world::width + 2 + 2, 2>,
    typename self::nextBlock::piece,
    d_buffer>;

using score_buffer =
    buffer_draw_centered_text<
        Position<world::width + 2, 7>,
        Orientation::Horizontal,
        uiSize,
        std::conditional_t<playerState == PlayerState::Dead,
            decltype("GameOver"_string),
            String<>>,
        default_gfx,
    
    buffer_draw_centered_text<
        Position<world::width + 2, 8>,
        Orientation::Horizontal,
        uiSize,
        decltype("Score"_string),
        default_gfx,
        
    buffer_draw_centered_text<
        Position<world::width + 2, 10>,
        Orientation::Horizontal,
        uiSize,
        int_to_string<score>,
        default_gfx,
        next_block>>>;
```

{% include image.html file="Screen-Shot-2015-06-26-at-12-29-33-AM.png" %}

Finally we draw the playfield itself and overlay the active piece on top. We also draw the ghost piece. The ghost piece shows where the active piece would land for a drop. 

```cpp
// draw playfield
using play_buffer = buffer_draw_grid<
    Position<1, 1>,
    world,
    score_buffer>;

using ghost_buffer = buffer_draw_grid<
    Position<1, 1>::add<
        typename Drop<static_cast<size_t>(-1), self>::type::position>,
    typename s::block::as_ghost_piece,
    play_buffer>;

using current_block_buffer = buffer_draw_grid<
    Position<1, 1>::add<position>,
    typename block::piece,
    ghost_buffer>;
```

{% include image.html file="Screen-Shot-2015-06-26-at-12-29-48-AM.png" %}


# Serialization 
{% include image.html file="reagan_bonzo-1.gif" description="It's breakfast again in America" %}

That's enough to actually play *Super Template Tetris*, just not in the interactive mode we are targeting.

`play` applies a list of inputs to a game state, building a list of game states that can be printed.

```cpp
template <typename s, Input... inputs>
struct Play {
    using type = List<s>;
};

template <typename s, Input... inputs>
using play = typename Play<s, inputs...>::type;

template <typename s, Input x, Input... xs>
struct Play<s, x, xs...> {
    using type = cons<s, play<step_t<x, s>, xs...>>;
};
```

```cpp
using game = play<initialState,
    Input::Down, Input::LRot, Input::Left, Input::Left, Input::Hard,
    Input::LRot, Input::Right, Input::Right, Input::Hard>;
```

As we discussed, there are a few big problems with this approach. The most significant is that it starts with the initial state on every compiler run. As the list of inputs grows, so does the compiletime. Good luck trying to clear more than single row, a action that itself requires at least fifteen inputs or so. Non-interactive play also lacks the fast paced, twitch based gameplay experiance that modern template gamers demand. 

## Serialize
The solution introduced by [Template Nibbler][nibbler] is to save the game state between each compile run. Serializing to C++ template source code sounds crazy, but it gets us a lot for free, compiletime deserialization using `#include` for one.

The entire game state must be saved between compile runs. The serialization logic is implemented using the `Serialize` interface, and any type that is part of the game state must implement `Serialize`. 

```cpp
template <typename>
struct Serialize;

template <typename x>
using serialize = typename Serialize<x>::type;
```

Serializing basic types is easy.

```cpp
template <> struct Serialize<bool> { using type = decltype("bool"_string); };
template <> struct Serialize<int> { using type = decltype("int"_string); };
 };
```

## Class Serialization
Now let's consider serializing a data structure like `List`. 

`List` takes its elements as template parameters: `List<int, bool, int>`. In fact, all template classes share the same basic serialization: `CLASS_NAME<PARAM1, PARAM2, ..., PARAMN>`. `serialize_class` removes the need for too much boilerplate code.

```cpp
template <typename name, typename... elements>
using serialize_class =
    string_join<String<>,
        name,
        String<'<'>,
        string_join<String<','>, serialize<elements>...>,
        String<'>'>>;
```

`Serialize` `List` simply passes the name of the class and forwards all template parameters to `serialize_class`. 

```cpp
template <typename... elements>
struct Serialize<List<elements...>> {
    using type = serialize_class<decltype("List"_string), elements...>;
};
```

## Serializing Values
One small complication of using `serialize_class` is value template parameters. Consider `Gfx`: 

```cpp
// Does not work
template <Color fg, Color bg>
struct Serialize<Gfx<fg, bg>> {
    using type =
        serialize_class<decltype("Gfx"_string), fg, bg>;
};
```

Because `serialize_class` takes `typename...` for the elements of the class, we cannot pass `Color` values directly as parameters. Instead, we have to convert values to types by wrapping them in `SerializableValue` before passing them on to `serialize_class`.  

```cpp
template <typename T, T x>
struct SerializableValue { };

template <typename T, T x>
struct Serialize<SerializableValue<T, x>> {
    using type = int_to_string<x>;
};

template <> struct Serialize<SerializableValue<bool, false>> {
    using type = decltype("false"_string);
};
template <> struct Serialize<SerializableValue<bool, true>> {
    using type = decltype("true"_string);
};
```

Classes must wrap all value parameters in a `SerializableValue`.

```cpp
template <Color fg, Color bg>
struct Serialize<Gfx<fg, bg>> {
    using type =
        serialize_class<decltype("Gfx"_string),
            SerializableValue<Color, fg>,
            SerializableValue<Color, bg>>;
};
```

## Serializing Strongly Typed Enumerations
But wait! `Color` is a strongly typed enumeration! So, even after wrapping it in `SerializableValue`, how should we actually serialize it to C++ source code?

The obvious approach is to serialize `Color` values to their full symbol names.

```cpp
struct Serialize<SerializableValue<Color, Color::Default>> {
    using type = decltype("Color::Default"_string);
};

struct Serialize<SerializableValue<Color, Color::Black>> {
    using type = decltype("Color::Black"_string);
};
...
```

While that would work, it's fragile and tedious. And remember, we're serializing to C++ template source code, so we can do all sorts of nonsense. Nonsense like serializing to `static_cast`.

The idea here is that we can convert a strongly typed enumeration value to an integer value with `static_cast`. This is great because we only have to write one specialization of `Serialize` per enumeration.

Here's a first go at it:

```cpp
// Still will not work :(
template <Color x>
struct Serialize<SerializableValue<Color, x>> {
    using type = 
        int_to_string<static_cast<std::underlying_type_t<Color>>(x)>;
};
```

But the `Serialize` implementation above ends up producing source code like `Gfx<5, 5>`, which is invalid because of the implicit `int` to `Color` cast. Things are looking bleak. It'll be back to string drudgery for sure.

Yet fear not! When in doubt, cast it out. A `static_cast` back to the original enumeration type fixes everything up just fine.

```cpp
Gfx<static_cast<Color>(5), static_cast<Color>(5)>;
```

So let's just serialize enumerations to `static_cast` expressions.

`serialize_enum` helps us do this, taking the name of a strongly typed enumeration, the enumeration's type, and a value of that enumeration to serialize.

```cpp
template <typename name, typename t, t x>
using serialize_enum =
    string_join<String<>,
        decltype("static_cast<"_string),
        name,
        String<'>', '('>,
        int_to_string<static_cast<std::underlying_type_t<t>>(x)>,
        String<')'>>;
```

We can now easily serialize any strongly typed enumeration using `serialize_enum`.
 
```cpp
template <Color x>
struct Serialize<SerializableValue<Color, x>> {
    using type =
        serialize_enum<decltype("Color"_string), Color, x>;
};
```

The remaining implementations of `Serialize` are just boilerplate at this point. Check out the [source][] if you're interested.

## Writing and Reading 
After implementing `Serialize` for every compoent of the game state, we can serialize the entire game state to a string:

```cpp
serialize<initialState>;
```

It's bigger on the inside... 

```cpp
String<'S', 't', 'a', 't', 'e', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'P', 'l', 'a', 'y', 'e', 'r', 'S', 't', 'a', 't', 'e', '>', '(', '0', ')', ',', '0', ',', '0', ',', 'P', 'o', 's', 'i', 't', 'i', 'o', 'n', '<', '4', ',', '0', '>', ',', 'B', 'l', 'o', 'c', 'k', '<', '0', ',', 'L', 'i', 's', 't', '<', 'G', 'r', 'i', 'd', '<', 'L', 'i', 's', 't', '<', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', '>', ',', 'L', 'i', 's', 't', '<', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', '>', '>', ',', 'G', 'r', 'i', 'd', '<', 'L', 'i', 's', 't', '<', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', '>', '>', '>', ',', 'G', 'r', 'i', 'd', '<', 'L', 'i', 's', 't', '<', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', '>', ',', 'L', 'i', 's', 't', '<', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', '>', '>', ',', 'G', 'r', 'i', 'd', '<', 'L', 'i', 's', 't', '<', 'L', 'i', 's', 't', '<', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'P', 'i', 'x', 'e', 'l', '<', '3', '2', ',', 'G', 'f', 'x', '<', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '9', ')', ',', 's', 't', 'a', 't', 'i', 'c', '_', 'c', 'a', 's', 't', '<', 'C', 'o', 'l', 'o', 'r', '>', '(', '2', ')', '>', '>', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', '>', '>', '>', '>', ',', 'G', 'r', 'i', 'd', '<', 'L', 'i', 's', 't', '<', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', ',', 'L', 'i', 's', 't', '<', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', ',', 'e', 'm', 'p', 't', 'y', '_', 'p', 'i', 'x', 'e', 'l', '>', '>', '>', ',', 'B', 'l', 'o', 'c', 'k', 'G', 'e', 'n', 'e', 'r', 'a', 't', 'o', 'r', '<', 'R', 'a', 'n', 'd', 'o', 'm', '<', '7', ',', 'L', 'i', 'n', 'e', 'a', 'r', 'G', 'e', 'n', 'e', 'r', 'a', 't', 'o', 'r', '<', 'u', 'n', 's', 'i', 'g', 'n', 'e', 'd', ',', '1', '2', '3', '4', '5', ',', '4', '2', '9', '4', '9', '6', '7', '2', '9', '5', ',', '1', '1', '0', '3', '5', '1', '5', '2', '4', '5', ',', '1', '2', '3', '4', '5', '>', '>', '>', '>'> >'
```

Such beauty; a C++ template of C++ template source code. Truly like looking into the face of God.

But sometimes, at the height of our revelries, when our templating is at it's zenith, and all is most right with the world, the most unthinkable disasters descend upon us. We must save the state to a file. Runtime beckons. And Runtime, like Satan, will not descend to [evaluation] hell till he has dragged a living part of [compiletime] heaven down with him, and helmeted himself with it.

`serialize_game` is the only other runtime operation besides `print` used in *Super Template Tetris*. It saves the game state to a file called `current_game.h`.

```cpp
template <typename state>
void serialize_game() {
    std::ofstream s;
    s.open("current_game.h");
    s << "using state = ";
    print(s, serialize<state>{});
    s << ";";
    s.close();
}
```

And because we serialized to C++, all we have to do is write `#include "current_game.h"` to read in the saved game state.

```
#include "current_game.h" // state loaded from here
using game = step_t<INPUT::LROT, state>;
```

# The Shining City
Almost done now. Just a few finishing touches.

## Reading Player Input
Player input is supplied through compiler flags, one flag for each of the valid commands.  

```cpp
static constexpr const Input input =
#if defined(HARD)
    Input::Hard;
#elif defined(SOFT)
    Input::Soft;
#elif defined(DOWN)
    Input::Down;
#elif defined(LEFT)
    Input::Left;
#elif defined(RIGHT)
    Input::Right;
#elif defined(LROT)
    Input::LRot;
#elif defined(RROT)
    Input::RRot;
#else
    Input::None;
#endif
```

If no input is supplied, the game advances by one frame. 

{% include image.html file="Screen-Shot-2015-06-29-at-8-26-24-PM.png" description="Live free or -D HARD" %}

## Main
`main` brings the runtime components together. It loads the current game state with `#include`, reads the player input, computes the next frame, prints the world to the console, and then saves the game state.

```cpp
int main(int argc, const char* argv[]) {
#include "current_game.h"
#include "get_input.h"

    using game = step_t<input, state>;
    print(std::cout, to_string<game>{}) << "\n";
    serialize_game<game>();
    
    return 0;
}
```

## Gameplay
You play *Super Template Tetris* by recompiling its source code, then executing the runtime program to render the game and update its saved state. We're using a few C++17 features, such as fold expressions, along with a proposed C++17 extension for creating `String` from string literals, so a few additional flags must be passed to the compiler.  
 
```
$ clang++ main.cpp -std=c++1z -Wno-gnu-string-literal-operator-template -o tetris ; ./tetris
```

{% include image.html file="Screen-Shot-2015-06-29-at-8-33-52-PM.png" %}

To drop the current piece, set a flag with `-D HARD` and recompile.

```
$ clang++ main.cpp -std=c++1z -Wno-gnu-string-literal-operator-template -D HARD -o tetris ; ./tetris
```

{% include image.html file="Screen-Shot-2015-06-29-at-8-34-10-PM.png" %}

Games can get pretty complex.

{% include image.html file="4.png" %}

# Farewell
Well, that's it! Check out the documented [source][] for more details on the implementation or to play a game or two. 

It's been quite a journey, and we held together through some stormy syntax, but in the end we reached our destination. Tetris as a template metaprogram. So now it's up to you. Go forth and metaprogram.

And, until next time, a final word to you, the metaprogrammers of the Template revolution. My friends, we did it. We weren't just marking time. Let *Super Template Tetris* stand as a beacon, a beacon for all the Runtime refugees of the world hurtling through the darkness, toward home.

All in all, not bad, not bad at all.


[source]: https://github.com/mattbierner/Super-Template-Tetris
[pride]: /stupid-template-tricks-pride-and-parser-combinators-part-one/
[nibbler]: /stupid-template-tricks-snake-part-2-interactive-nibbler/
[life]: /stupid-template-tricks-the-life-comonadic/

[short-circuit]: /stupid-template-tricks-short-circuiting/

[srs]: http://tetris.wikia.com/wiki/SRS
[ansi-colors]: https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
[sprite]: https://en.wikipedia.org/wiki/Sprite_(computer_graphics)