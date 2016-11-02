---
layout: post
title: 'Nibbler'
series: stupid_template_tricks
date: '2015-01-19'
---
[Conway's game of Life][life] may be mathematically interesting, but it is not what most people would consider a real game. So let's take a look at another product of the 70's, the arcade game [Snake][snake]. This post walks through a complete, compile time implementation of a Snake game using C++ template metaprogramming. We'll start by implementing a basic list and grid, before moving on to encode the game rules. You can find the [complete source here][src].

{% include image.html file="206838120946081003_42d04362ada6-2.png" description="I don't need to wear one of those helmets for metaprogramming - Famous last words." %}

The variant of Snake that we'll implement is a simplified version of [Nibbler][nibbler]. In Nibbler, the player guides a snake about a grid by choosing a direction for the snake's next movement: turn left, turn right, or continue straight. Trailing behind the snake's head are a number of body sections. These body section cells stay occupied until the entire snake has moved over that cell, so that the head of the snake alway moves forward by one while the tail of the snake always shrinks by one.

The goal of Nibbler is to consume randomly placed food, which increases your score but also makes the snake grow one segment longer, increasing the difficulty. You lose when the snake's head collides with a wall or existing body section.

Let's get started.

# It Begins with a List
We've covered [lazy, potentially infinite lists previously][lazy-lists], and even used them to implement [Conway's Game of Life][life], but we don't need that much flexibility for Nibbler. The game world is fixed and finite size, so getting all fancy with zippers and comonads would only unnecessarily complicate things.

Instead, we'll use a list structure similar to the one used for our [compile time pseudo random number generator][pseudo-random], except that it'll be a list of types instead of a list of values. 

``` cpp
template <typename... elements>
struct List {
    static const size_t size = sizeof...(elements);
};
```

## Cons, Car, and Cdr
The basic `cons`, `car`, and `cdr` operations are about the same [as before][pseudo-random], just using types instead of values, so I won't go into much detail here.

``` cpp
template <typename list>
struct car;

template <typename x, typename... xs>
struct car<List<x, xs...>> {
    using type = x;
};

template <typename list>
using car_t = typename car<list>::type;
```

``` cpp
template <typename list>
struct cdr;

template <typename x, typename... xs>
struct cdr<List<x, xs...>> {
    using type = List<xs...>;
};

template <typename list>
using cdr_t = typename cdr<list>::type;
```

``` cpp
template <typename x, typename list>
struct cons;

template <typename x, typename... xs>
struct cons<x, List<xs...>> {
     using type = List<x, xs...>;
};

template <typename x, typename list>
using cons_t = typename cons<x, list>::type;
```

The `gen` function generated a list of `element` repeated `N` times. We'll use `gen` to build the initial game world.

``` cpp
template <size_t N, typename element>
struct gen {
    using type = cons_t<element,
        typename gen<N - 1, element>::type>;
};

template <typename element>
struct gen<0, element> {
    using type = List<>;
};

template <size_t N, typename element>
using gen_t = typename gen<N, element>::type;
```

## Element Access
Nibble will address individual tiles in the game grid cells using a absolute positions, consisting of a x and y coordinate. `get` and `set` on `List` are the basis for this two dimensional absolute positioning system.

`get` looks up the Nth value in a list.

```cpp
template <size_t N, typename list>
struct get;

template <size_t N, typename list>
using get_t = typename get<N, list>::type;

template <typename x, typename... xs>
struct get<0, List<x, xs...>> {
    using type = x;
};

template <size_t N, typename x, typename... xs>
struct get<N, List<x, xs...>> {
    using type = get_t<N - 1, List<xs...>>;
};
```

`put` creates a new list with the Nth value replaced by `newValue`.

```cpp
template <size_t N, typename newValue, typename list>
struct put;

template <size_t N, typename newValue, typename list>
using put_t = typename put<N, newValue, list>::type;

template <typename newValue, typename x, typename... xs>
struct put<0, newValue, List<x, xs...>> {
    using type = List<newValue, xs...>;
};

template <size_t N, typename newValue, typename x, typename... xs>
struct put<N, newValue, List<x, xs...>> {
    using type = cons_t<x, put_t<N - 1, newValue, List<xs...>>>;
};
```

## Print and Fmap 
We'll also reuse the `Printer` and `Functor` interfaces from our [Life implementation][life]. 

The `Printer` interface converts a type to a function that prints a visual representation of that type at runtime. This will serve as the basis of our rendering system.

```cpp
template <>
struct Printer<List<>>
{
    static void Print(std::ostream& output) { /* noop */ }
};

template <typename x, typename... xs>
struct Printer<List<x, xs...>>
{
    static void Print(std::ostream& output)
    {
        Printer<x>::Print(output);
        Printer<List<xs...>>::Print(output);
    }
};
```

`Functor` maps a function over a type. For the list, it builds a new list out of the results of applying functor `f` to every value in the list. This will be used to update the game world. 

```cpp
template <template<typename> class f>
struct Fmap<List<>, f> {
    using type = List<>;
};

template <typename x, typename... xs, template<typename> class f>
struct Fmap<List<x, xs...>, f> {
    using type = cons_t<
        typename f<x>::type,
        fmap_t<List<xs...>, f>>;
};
```


# The Grid
A grid is a list of lists, a two dimensional structure. `Grid` takes a list of rows, where each row is a list of values. Storing grid values first by row, and then by column, makes printing easier.

```cpp
template <typename r>
struct Grid {
    using rows = r;
    
    static const size_t size = rows::size;
};
```

`gen_grid` generates a square grid of values.

```cpp
template <size_t N, typename value>
using gen_grid = Grid<gen_t<N, gen_t<N, value>>>;
```

The `Position` type encodes an absolute two dimensional point as a type. 

```cpp
template <size_t xVal, size_t yVal>
struct Position {
    static const size_t x = xVal;
    static const size_t y = yVal;
};
```

## Element Access
We also need to be able to query and update any cell in the grid using a position.

`get_grid` looks up the value stored at `pos::x, pos::y`. It first gets the target row and then the target cell within that row.

```cpp
template <typename pos, typename grid>
using get_grid =
    get_t<pos::x,
        get_t<pos::y, typename grid::rows>>;
```

`put_grid` replaces the value at `pos::x, pos::y` with `newValue`. First, it gets the target row and updates it. Then it updates the entire row entry within the grid.

```cpp
template <typename pos, typename newValue, typename grid>
using put_grid = Grid<
    put_t<
        pos::y,
        put_t<pos::x, newValue, get_t<pos::y, typename grid::rows>>,
        typename grid::rows>>;
```

## Interfaces
Printing a grid, prints each row of the grid, followed by a newline character.

```cpp
template <>
struct Printer<Grid<List<>>>
{
    static void Print(std::ostream& output) { /* noop */ }
};

template <typename x, typename... xs>
struct Printer<Grid<List<x, xs...>>>
{
    static void Print(std::ostream& output)
    {
        Printer<x>::Print(output);
        output << "\n";
        Printer<Grid<List<xs...>>>::Print(output);
    }
};
```

Fmapping a grid, fmaps the column list with a bound version of `fmap`. This bound function fmaps every row element using the original functor `f`.

```cpp
template <typename rows, template<typename> class f>
struct Fmap<Grid<rows>, f> {
    template <typename val>
    struct fmap_inner {
        using type = fmap_t<val, f>;
    };
    
    using type = Grid<
        fmap_t<rows, fmap_inner>>;
};
```


# Cells
The world of Nibbler is made of cells. Each cell can be one of four types:

```cpp
enum class CellState : unsigned
{
    Empty,
    Snake,
    Food,
    Collision
};
```

Besides a type, cells also store two additional data fields: weight and direction. Both of these fields are only used for snake cells.

```cpp
template <CellState s, unsigned w, Direction d>
struct Cell {
    static const CellState state = s;
    static const unsigned weight = w;
    static const Direction direction = d;
};
```

```cpp
using EmptyCell = Cell<CellState::Empty, 0, Direction::Left>;

using FoodCell = Cell<CellState::Food, 0, Direction::Left>;

using CollisionCell = Cell<CellState::Collision, 0, Direction::Left>;

template <unsigned weight, Direction direction>
using MakeSnakeCell = Cell<CellState::Snake, weight, direction>;
```

## Weight and Decay
Weight is the the number of turns it takes for the snake cell to expire. Think of the snake as just a head moving about a grid. As it moves, the head lays down body cells of a fixed weight. For a three section long snake, the head lays down cells with a weight of three.

Each game step, snake body sections decay by one. When their weight reaches zero, the cell becomes an empty cell (Really, we don't even need an explicit empty cell type, but it makes code a bit more readable).

For a snake of length three:

```cpp
// Starting state, will move left
0000
0030
0120
0000

// First step, decay all cells by one

0000
0020
0010
0000

// Then move the head

0000
0320
0010
0000
```

When the snake consumes food, we skip the decay step and increment the head weight by one.

The decay function itself is a noop for Empty, Food, and Collision cells. For Snake cells, it reduced the weight by one. The snake cell becomes an empty cell when its weight reaches zero.

```cpp
template <typename cell>
struct decay {
    using type = cell;
};

template <unsigned weight, Direction direction>
struct decay<Cell<CellState::Snake, weight, direction>> {
    using type =
        typename std::conditional<weight <= 1,
            EmptyCell,
            Cell<CellState::Snake, weight - 1, direction>>::type;
};
```

## Direction
The direction property is also only used by snake cells. It is used to render the snake, visually showing which direction each segment is facing. 

```cpp
enum class Direction : unsigned
{
    Up,
    Down,
    Left,
    Right
};
```

We'll also later use `Direction` to store the direction a snake is moving so we can preserve it's heading when no player input is entered.

## Printing
The three basic cells always print the same value.

```cpp
template <unsigned weight, Direction direction>
struct Printer<Cell<CellState::Empty, weight, direction>>
{
    // small dash
    static void Print(std::ostream& output) { output << "\u257a"; } 
};

template <unsigned weight, Direction direction>
struct Printer<Cell<CellState::Food, weight, direction>>
{
    static void Print(std::ostream& output) { output << "*"; }
};

template <unsigned weight, Direction direction>
struct Printer<Cell<CellState::Collision, weight, direction>>
{
    // solid black box
    static void Print(std::ostream& output) { output << "\u2588"; }
};
```

Snake segment cells print one of four arrows, depending on the direction the segment is facing.

```cpp
template <unsigned weight, Direction direction>
struct Printer<Cell<CellState::Snake, weight, direction>>
{
    static void Print(std::ostream& output)
    {
        switch (direction)
        {
        case Direction::Up:     output << "\u25B2"; break;
        case Direction::Right:  output << "\u25B6"; break;
        case Direction::Down:   output << "\u25BC"; break;
        case Direction::Left:   output << "\u25C0"; break;
        }
    }
};
```

# Game World
That coves the basic types, so let's move on to implementing the game world. The world is just a fixed size grid. The initial world has a single snake cell some where in it. A food cell will also be placed in the world, but this will be handled later.

```cpp
constexpr const size_t worldSize = 10;

template <
    typename position,
    Direction direction>
using InitialWorld =
    put_grid<
        position,
        MakeSnakeCell<1, direction>,
        gen_grid<worldSize, EmptyCell>>;
```

## Queries
`is_in_bounds` checks if a cell is within the game grid. Because we are using unsigned numbers, we only have to perform a single, less than check in each direction.
 
```cpp
template <typename pos, typename world>
using is_in_bounds =
    std::integral_constant<bool,
        pos::x < world::size && pos::y < world::size>;
```

`is_empty` checks if a position is the game world is unoccupied. Because of [weird short circuiting with templates][short-circuit], we must use `logical_and` to avoid attempting to query out of bounds grid cells. `logical_and` ensures that its second argument will only be evaluated if `is_in_bounds` is true.

```cpp
template <typename cell, typename pos, typename world>
struct is_type :
    std::integral_constant<bool,
        get_grid<pos, world>::state == cell::state> { };

template <typename pos, typename world>
struct is_empty :
    logical_and<
        is_in_bounds<pos, world>::value,
        Thunk<is_type, EmptyCell, pos, world>> { };
```

`is_food` does the same, except it checks if a position holds a food cell.

```cpp
template <typename pos, typename world>
struct is_food :
    logical_and<
        is_in_bounds<pos, world>::value,
        Thunk<is_type, FoodCell, pos, world>> { };
```

`is_free` checks if the snake can move to a given position. The snake can more onto any empty or food cell.

```cpp
template <typename pos, typename world>
struct is_free :
    std::integral_constant<bool,
        is_food<pos, world>::value || is_empty<pos, world>::value> { };
```

And `get_weight` queries the weight of a cell in the game grid. We should probably also check `is_in_bounds` here, but it will not be needed for this implementation.

```cpp
template <typename pos, typename world>
struct get_weight :
    std::integral_constant<size_t,
        get_grid<pos, world>::weight> { };
```

## Movement
We also need to be able to check the state of a cell's neighbors to determine when the snake will collide with something. The first step is to lookup the next cell for a given position and direction.

`direction_delta_x` and `direction_delta_y` return the relative change in x and y position that each direction represents. The top left corner of the grid is `0,0`.

```cpp
template <Direction direction>
struct direction_delta_x : std::integral_constant<int, 0> { };
template <>
struct direction_delta_x<Direction::Left> : std::integral_constant<int, -1> { };
template <>
struct direction_delta_x<Direction::Right> : std::integral_constant<int, 1> { };

template <Direction direction>
struct direction_delta_y : std::integral_constant<int, 0> { };
template <>
struct direction_delta_y<Direction::Up> : std::integral_constant<int, -1> { };
template <>
struct direction_delta_y<Direction::Down> : std::integral_constant<int, 1> { };
```

Using the delta x and y, we can calculate the next position with `get_next_position`. The result of `get_next_position` may be outside of the game grid.

```cpp
template <Direction direction, typename pos>
using get_next_position =
    Position<
        pos::x + direction_delta_x<direction>::value,
        pos::y + direction_delta_y<direction>::value>;
```   

Using `get_next_position`, `can_continue_in_direction` determines if the snake can continue from `position` in `direction` without going beyond the bounds of the world or hitting a snake cell.

```cpp
template <Direction direction, typename pos, typename world>
using can_continue_in_direction =
    logical_and<
        is_in_bounds<get_next_position<direction, pos>, world>::value,
        Thunk<is_free, get_next_position<direction, pos>, world>>;
```


# Nibbler
Finally we get down to actually implementing Nibbler.

{% include image.html file="jackson-1.jpg" description="Samuel L. Jackson is ready for some motherfucking snakes on motherfucking two dimensional fields!" %}

## Game State
A game of Nibbler can either be in progress, or over if the player died.

```cpp
enum class PlayerState : unsigned
{
    Alive,
    Dead
};
```

The complete state of a game is captured in five values:

* `playerState` - Is the player alive of dead?
* `position` - The position of the snake's head.
* `direction` - The direction the snake's head is moving. Used when `Input::None` is entered.
* `world` - The game world.
* `random` - The random number generator state. Used for placing food.

```cpp
template <
    PlayerState currentPlayerState,
    typename currentPosition,
    Direction currentDirection,
    typename currentWorld,
    typename currentRandom>
struct State
{
    static const PlayerState PlayerState = currentPlayerState;

    using position = currentPosition;
    
    using world = currentWorld;
    
    static const Direction direction = currentDirection;
    
    using random = currentRandom;
    
    template <typename newWorld>
    using set_world = State<PlayerState, position, direction, newWorld, random>;
    
    template <typename newRandom>
    using set_random = State<PlayerState, position, direction, world, newRandom>;
};
```

`set_world` and `set_random` are two setters that make it slightly easier to change a property of a `State`.


## Food Placement
Food must be placed randomly in an unoccupied space in the game world. There is always one food item in play. As soon as that food is consumed, another is placed.

To handle randomness while remaining within the limitations of C++ templates, we'll use the [linear feedback shift register compile time pseudo random number generator][pseudo-random] previously implemented.

Because we only want random numbers in the range of `[0, worldSize)`, we can use a simple wrapper around the number generator to clamp its output (we have to subtract one since a LFSR can never generate zero).

``` cpp
template <unsigned max, typename lfsr>
struct PseudoRandomGenerator {
    using next = PseudoRandomGenerator<max, typename lfsr::next>;

    static const unsigned value = static_cast<unsigned>(
        (lfsr::template value<unsigned>::value - 1) % max);
};
```
  
Using the `State::random` property, `put_food` attempts to find a random position to place a new food cell. It generates a series of random x and y coordinates, until it the result is an unoccupied cell. The base case of the template handles this iterative search.
 
```
template <typename state, typename = void>
struct put_food {
    using type = typename put_food<
        typename state::template set_random<typename state::random::next::next>>::type;
};
```

When an unoccupied cell is found, the game world is updated with the new food cell. The random generator for the state is also advanced by two.

```
template <typename state>
struct put_food<state,
    typename std::enable_if<
        is_empty<
            Position<state::random::value, state::random::next::value>,
            typename state::world>
        ::value>::type>
{
    static const size_t targetX = state::random::value;
    static const size_t targetY = state::random::next::value;
    
    using targetPosition = Position<targetX, targetY>;
    
    using type = typename state
        ::template set_world<
            put_grid<
                targetPosition,
                FoodCell,
                typename state::world>>
        ::template set_random<
            typename state::random::next::next>;
};

template <typename state>
using put_food_t = typename put_food<state>::type;
```

## Input
Each step of the game, the player must input a single command. This command determines the action of the snake and the next state of the world.

 The player can give one of five commands, four directional commands as well as `None`. `None` signals that no input was provided and that the snake should continue in its current direction. 

```cpp
enum class Input : unsigned
{
    None,
    Up,
    Down,
    Left,
    Right
};
```

A complete game of Nibbler will be played against a compile time list of inputs. 

``` cpp
template <Input... inputs>
using PlayerInput = std::integer_sequence<Input, inputs...>;
```

Only certain inputs are valid. The player can turn 90 or -90 degrees, or continue straight. Attempting to turn 180 degrees results in a noop.

`get_new_direction` determines the direction the snake should move for the next game state based on the the input. It translates 180 degree movements into noops.

```cpp
template <Direction direction, Input input>
struct get_new_direction : std::integral_constant<Direction, direction> { };

template <Direction direction>
struct get_new_direction<direction, Input::Up> : std::integral_constant<Direction, (direction == Direction::Down ? direction : Direction::Up)> { };

template <Direction direction>
struct get_new_direction<direction, Input::Down> : std::integral_constant<Direction, (direction == Direction::Up ? direction : Direction::Down)> { };

template <Direction direction>
struct get_new_direction<direction, Input::Left> : std::integral_constant<Direction, (direction == Direction::Right ? direction : Direction::Left)> { };

template <Direction direction>
struct get_new_direction<direction, Input::Right> : std::integral_constant<Direction, (direction == Direction::Left ? direction : Direction::Right)> { };
```


## Game Steps
Now we come to the game step/transition function. The transition function takes an input and a game state, and produces a new game state.

The easiest case to handle is when the player has lost the game. In that case, the transition function does nothing.

```cpp
template <
    Input input,
    typename position,
    Direction direction,
    typename world,
    typename random>
struct step<input, State<PlayerState::Dead, position, direction, world, random>> {
    using type = State<PlayerState::Dead, position, direction, world, random>;
};
```

When the game is still going on, one of three things may happen:
* The snake consumes some food.
* The snake collides with something.
* The snake does not collide with something.

We'll handle the first case in `consume` and the other two in `regular`.

```cpp
template <Input input, typename state>
struct step {
    static const Direction direction =
        get_new_direction<state::direction, input>::value;

    using nextPosition =
        get_next_position<direction, typename state::position>;
    
    static const unsigned currentWeight =
        get_weight<typename state::position, typename state::world>::value;
    
    struct consume { ... };
    
    struct regular { ... };
    
    using type = branch_t<
        is_food<nextPosition, typename state::world>::value,
        consume,
        regular>;
};
```

When the snake consumes food, we increment the head of the snake. We also skip the decay step that `regular` will do, to make the snake one segment longer. Then we randomly place new food.

```cpp
struct consume
{
    using newWorld = grow_snake<currentWeight + 1, direction, nextPosition, typename state::world>;
    
    using type = put_food_t<
        State<
            PlayerState::Alive,
            nextPosition,
            direction,
            newWorld,
            typename state::random>>;
};
```

When the snake does not consume food, it may have collided with something. To check if a collision occurred, we decay the world once and check if the next position of the snake's head in the decayed world is a collision. Only the head of the snake can collide with something.

```cpp
struct regular {
    using decayedWorld = fmap_t<typename state::world, decay>;
    
    struct die { ... };
    
    struct live { ... };
    
    using type = branch_t<is_free<nextPosition, decayedWorld>::value,
        live,
        die>;
};
````

When a collision occurred, the game is over and we mark the collision on the map.

```cpp
struct die {
    using newWorld = mark_collision<
        typename std::conditional<is_in_bounds<nextPosition, decayedWorld>::value,
            nextPosition,
            typename state::position>::type,
        typename state::world>;

    using type = State<
        PlayerState::Dead,
        nextPosition,
        direction,
        newWorld,
        typename state::random>;
};
```

Otherwise, we advance the snake forward by one.

```cpp
struct live {
    using newWorld = grow_snake<
        currentWeight,
        direction,
        nextPosition,
        decayedWorld>;

    using type = State<
        PlayerState::Alive,
        nextPosition,
        direction,
        newWorld,
        typename state::random>;
};
```

## Printing
Printing the game state prints out a score bar followed by the game world.

```cpp
template <
    PlayerState PlayerState,
    typename position,
    Direction direction,
    typename world,
    typename random>
struct Printer<State<PlayerState, position, direction, world, random>>
{
    static void Print(std::ostream& output)
    {
        output
            << "--"
            << (PlayerState == PlayerState:: Dead
                ? " You Are Dead "
                : "--------------")
            << "--"
            << "\n";
        Printer<world>::Print(output);
    }
};
```

# Do You Want to Play a Game?
For this first iteration of Nibbler, we'll simulate the entire game in one compiler run. 

For a list of input, we feed the first input into to the current game state using `step_t`, to get a new game state. Each resulting gamestate is consed onto a list of previous game states, building up a game history. 

``` cpp
template <typename inputs, typename state>
struct play;

template <typename inputs, typename state>
using play_t = typename play<inputs, state>::type;

template <typename state>
struct play<PlayerInput<>, state> {
    using type = List<state>;
};

template <Input input, Input... inputs, typename state>
struct play<PlayerInput<input, inputs...>, state> {
    using type = cons_t<
        state,
        play_t<
            PlayerInput<inputs...>,
            step_t<input, state>>>;
};
```

Now we can print out an entire game and each step of its history, making debugging (and cheating) very easy. 


## Example Game
Here's metaprogrammed Nibbler in action.

``` cpp
int main(int argc, const char* argv[])
{
    using inputs = PlayerInput<
        Input::Right, Input::Up, Input::None, Input::Right, Input::Up,
        Input::None, Input::None, Input::Left, Input::None, Input::None,
        Input::None, Input::None, Input::None, Input::Down, Input::None,
        Input::None, Input::None, Input::None, Input::None, Input::None,
        Input::None, Input::Right, Input::Up, Input::Left>;

    using state = InitialState;
    
    using game = play_t<inputs, state>;

    Printer<game>::Print(std::cout);
    
    return 0;
}
```

```
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
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺*╺╺
╺╺╺╺╺╺▲╺╺╺
╺╺╺╺╺╺▶╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺▲*╺╺
╺╺╺╺╺╺▲╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺▲▶╺╺
╺╺╺╺╺╺▲╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺▲▶╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▶╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺╺◀▲╺╺
╺╺╺╺╺╺╺▲╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺╺◀◀▲╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺╺◀◀◀╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*╺◀◀◀╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺*◀◀◀╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺◀◀◀◀╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺◀◀◀╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺◀◀╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺◀╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺╺*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼*╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
*╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼▶╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
------------------
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
*╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺▼▲╺╺╺╺╺╺╺
╺▼▶╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
-- You Are Dead --
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
*╺╺╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
╺▼╺╺╺╺╺╺╺╺
╺█▲╺╺╺╺╺╺╺
╺▼▶╺╺╺╺╺╺╺
╺╺╺╺╺╺╺╺╺╺
Program ended with exit code: 0
```

{% include image.html file="f1303.JPG" description="Only Five? Fuck Rick! Fuck Rick and his high score of 1,231,372,670!" %}


# Next Time
By breaking down Nibbler to simple subproblems, implementing it using C++  metaprogramming is not hard. There are probably more clever or efficient ways to implement Snake. But that's not the point. Sure, template metaprogramming uses weird syntax and has major annoyances. But once you get past those initial barriers, you'll find a surprisingly competent functional language. 

Check out the [complete source on Github][src].

Next time, I'll look at adding "interactivity" to compile time Nibbler.


[src]: http://github.com/mattbierner/STT-C-Compile-Time-Snake
[life]: /stupid-template-tricks-the-life-comonadic/
[pseudo-random]: /stupid-template-tricks-compile-time-pseudo-random-number-generator/
[short-circuit]: /stupid-template-tricks-short-circuiting/
[lazy-lists]: /stupid-template-tricks-lazy-compile-time-lists/

[nibbler]: http://goo.gl/670zou 
[Snake]: http://goo.gl/670zou