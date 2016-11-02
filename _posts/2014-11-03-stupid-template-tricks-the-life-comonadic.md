---
layout: post
title: 'The Life Comonadic'
series: stupid_template_tricks
date: '2014-11-03'
---
A [Brainfuck evaluator][brainfuck] is interesting and all, but far too one-dimensional. Lets's kick things up a dimension, it's time for C++ template compile-time [Conway's Game of Life][life]. 

{% include image.html file="larsonevolution.jpg" %}

This post translates a [Haskell comonad based Life implementation][void] into a C++ template meta-program. Much like with the [Brainfuck evaluator][brainfuck], once you get over the syntax, C++ templates turn out to be a fairly competent functional language.

I'll start by defining the data structures and operations that will be used to implement Life. The [lazy, compile-time list previously defined][list] will be used heavily. A row of the world is encoded as [zipper][zipper] of cells, with the world grid is simply a zipper of rows. Comonads for both one dimensional and two dimensional zippers make it easy to define and implement the rules of Life.

Complete source code can be found [here][source].

# One Dimensional Zipper
The [zipper][zipper] is a one dimensional structure, a list that also encodes the context of a position in that list. Zippers will be used both as rows of cells, and also to zipper rows to create the vertical dimension of the Life grid. 

In our zipper structure, `x` is the focus, `l` is a [list][list] of elements to the right of the focus, and `r` is a [list][list] of elements to the right of the focus. The first element of both `l` and `r` are the direct neighbors of the focus, which requires `l` to be stored in reverse order. 

``` cpp
template<typename l, typename x, typename r>
struct Zipper {
    /*- movement -*/
    /*- editing -*/
    /*- fmap -*/  
    /*- to_list -*/
};
```

We change our position in the zippered list by shifting the context in either direction, referred to as `left` and `right` movement. The movement operations take the next element from the side of the zippered list we are moving towards. This becomes the new focus, and the old focus is consed onto the other side of the list.

``` cpp
template<typename l, typename x, typename r>
struct Zipper {
    using left =
        Zipper<
            cdr<l>,
            car<l>,
            cons<x, r>>;
    
    using right =
        Zipper<
            cons<x, l>,
            car<r>,
            cdr<r>>;
            
    /*- editing -*/
    /*- fmap -*/  
    /*- to_list -*/
};
```

A zipper can get and edit its focus in constant time. `get` returns the focus, while `put` replaces the current focus.

``` cpp
template<typename l, typename x, typename r>
struct Zipper {  
    /*- movement -*/
  
    using get = X;
    
    template <typename val>
    using put = Zipper<l, val, r>;
    
    /*- fmap -*/  
    /*- to_list -*/
};
```

Unbound helper functions that take a zipper are also helpful since they reduce the need using the `template` and `typename` keywords. This makes the similarities between C++ templates and more traditional functional languages clearer.

``` cpp
template <typename z>
using get = typename z::get;

template <typename z, typename x>
using put = typename z::template put<x>;
```

Let's also implement [Functor][functor] for Zippers. `fmap` maps a function `f` over every element of the zipper, producing a new zipper with the results.

``` cpp
template<typename l, typename x, typename r>
struct Zipper {  
    /*- movement -*/
    /*- editing -*/
   
    template <template<typename> class f>
    using fmap =
        Zipper<
            map<f, l>,
            typename F<x>::type,
            map<f, r>>;
   
    /*- to_list -*/
};
```

An unbound version of `fmap` taking a zipper `z` will also be used.

``` cpp
template <template<typename> class f, typename z>
using fmap = typename z::template fmap<f>;
```

To more closely emulate Haskell, we could instead define a `Functor` interface struct and implement `fmap` for Zipper using template specialization of `Functor`.

``` cpp
template <typename>
struct Functor;

template<typename l, typename x, typename r>
struct Functor<Zipper<l, x, r>> {
    template <template<typename> class f>
    using fmap =
        Zipper<
            map<f, l>,
            typename F<x>::type,
            map<f, r>>;
};
```

This approach is a bit more verbose, but may make interfaces more clear and explicit. It greatly benefits from the use of helper function that calls `fmap` by automatically wrapping the callee in a `Functor`.

``` cpp
template <template<typename> class f, typename x>
using fmap_functor = typename Functor<x>::template fmap<f>;
```

The zippers used to implement Life will all be infinite, but to print out the results of the simulation we also need a way to select a finite range of elements from a zipper. `to_list` takes `count` elements from the left and right sides of the focus and constructs a list of `count * 2 + 1` elements. The left side of the list is stored in reverse order, and must be reversed again during the conversion.

``` cpp
template<typename l, typename x, typename r>
struct Zipper {  
    /*- movement -*/
    /*- editing -*/
    /*- fmap -*/

    template <size_t count>
    using to_list =
        concat<
            reverse<take<count, L>>,
            concat<
                cons<X, Nil>,
                take<count, R>>>;
};
```

## Zipper Comonad
The [comonad interface][comonad] requires the implementation of two operations: `extract` and either `extend` or `duplicate`. `extend` and `duplicate` can both be implemented in terms of each other.

For the `comonad` of a `zipper`, the `extract` operation is already defined as `get`. I'll use the `extend` and `duplicate` comonad definition to complete the interface.

For a zipper, `duplicate` basically rewrites every value in the zipper to a zipper focused at that value. The result is a zipper of zippers. To actually accomplish this, we take a zipper `z` and create a new zipper that contains: `Zipper<List<left<z>, left<left<z>>, ...>, z, List<right<z>, right<right<z>>, ...>>`. The `move` operation generalizes this pattern for any left and right mapping functions.

``` cpp
template <template<typename> class f, typename x>
using iterate_rest = cdr<iterate<f, x>>;

template <
    template<typename> class left_mapper,
    template<typename> class right_mapper,
    typename z>
using move =
    Zipper<
        iterate_rest<left_mapper, z>,
        z,
        iterate_rest<right_mapper, z>>;
```

`duplicate` maps the `go_left` and `go_right` functions, which shift a zipper left or right respectively, over a zipper `z` using `move`.

``` cpp
template <typename z>
struct go_left {
    using type = typename z::left;
};

template <typename z>
struct go_right {
    using type = typename z::right;
};

template <typename z>
using duplicate = move<go_left, go_right, z>;
```

`extend` is then implemented using `duplicate`.

``` cpp
template <template<typename> class f, typename z>
using extend = fmap<f, duplicate<z>>;
```

# Plane Zipper
The zipper is a one dimensional data structure while we need a two-dimensional grid for life. So, much like how you can use an arrays of arrays in C to create a 2D matrix, we'll use a zipper of zippers to build an infinite grid.

`PlaneZipper` take a zipper of zippers `z`.

``` cpp
template<typename z>
struct PlaneZipper {
    /*- movement -*/

    /*- editing -*/
   
    /*- fmap -*/
};
```

The outermost zipper acts as the vertical axis. Each inner zipper contains a single row of cells of the world. Movement is accomplished by shifting the focus, much like with `zipper`, but now we can move in four directions: up, down, left, and right.

Movement along the vertical simply moves the outer zipper to focus on a new row. This is accomplished by the `up` and `down` operations. 

Movement along the horizontal is a bit more complicated. Simply moving the inner zipper left or right, `z::get::left` or `z::get::right`, only moves a single row of the grid, leaving all other rows in place. Instead, horizontal movement in the grid must shift all rows, so that the cells remain in the same relative positions, and so that the current row moves to a new focus. Shifting all rows of the grid in one direction or the other is accomplished by a `fmap` over the outer zipper using the `go_left` and `go_right` zipper movement functions.

``` cpp
template<typename z>
struct PlaneZipper {
    using up = PlaneZipper<typename z::left>;
    using down = PlaneZipper<typename z::right>;

    using left = PlaneZipper<fmap<go_left, z>>;
    using right = PlaneZipper<fmap<go_right, z>>;
    
    /*- editing -*/
    /*- fmap -*/
};
```

The actual value at the focus is read by first reading the outer zipper to get the current row zipper and then reading the row zipper. Editing the focus similarly edits the outer zipper to replace the current row, with the current row edited to replace the value at the focus.

``` cpp
template<typename z>
struct PlaneZipper {
    /*- movement -*/
    
    using get = get<get<z>>;
    
    template <typename val>
    using put =
        PlaneZipper<
            put<z, put<typename z::get, val>>>;
    
    /*- fmap -*/
};
```

`PlaneZipper` also is a [Functor][functor]. Mapping a function `f` over a plane zipper applies `f` to every value in the grid, building a new grid from the results. For each row in zipper `z`, we `fmap` the outer zipper first with a functor `do_fmap`. `do_fmap` is applied to every row in the grid and is basically a manually curring of the `fmap` function, fmapping the row with function `f`.

``` cpp
template<typename z>
struct PlaneZipper {
    /*- movement -*/
    /*- editing -*/
 
    template <template<typename> class f>
    struct do_fmap {
        template <typename x>
        struct apply {
            using type = fmap<f, x>;
        };
    };
    
    template <template<typename> class f>
    using fmap =
        PlaneZipper<
            fmap<
                do_fmap<f>::template apply,
                z>>;
};
```

## Plane Zipper Comonad
The `PlaneZipper` comonad already implements `extend` as `get`. `duplicate` is implemented by creating a grid of plane zippers focused at each value. `vertical` create the vertical shift components of this grid, while `horizontal` creates the rows.

``` cpp
template <typename z>
using horizontal = move<go_left, go_right, z>;

template <typename z>
using vertical = move<go_up, go_down, z>;
```

`duplicate` applies both the vertical and horizontal duplication to build the plane zipper of contexts.

``` cpp
template <typename z>
struct go_horizontal {
    using type = horizontal<z>;
};

template <typename z>
using duplicatePlane = PlaneZipper<fmap<go_horizontal, vertical<z>>>;
    
template <template<typename> class F, typename z>
using extendPlane = fmap<F, duplicatePlane<z>>;
```

# Life
After establishing all of our data structures and operations, implementing life turns out to the easiest part of the whole process.

{% include image.html file="Evolution_of_the_Stick_Man-1.gif" %}

Conway's Game of Life is simulated on a 2D, infinite grid of cells. Every cell is either alive or dead. Time is broken into discrete steps or generations.  A transition function determines the state of the next generation based entirely on the state of the current generation.

For every cell in the grid, the transition function does the following:

* If the cell is alive and it has less than 2 living neighbors, the cell dies.
* If the cell is alive and it has 2 or 3 living neighbors, it stays alive.
* If the cell is alive and it has more than 3 living neighbors, the cell dies.
* If the cell is dead and it has 3 living neighbors, the cell becomes alive.

## Cell
Cells are a boolean state of either living or dead. We'll encode cells using the `Cell` type, along with aliases for living and dead cell types.
 
``` cpp
template <bool alive>
struct Cell {
    static const bool value = alive;
};

using DeadCell = Cell<false>;
using LiveCell = Cell<true>;
```

## Rules
The next state of a cell is determined solely by the cell's current state and the state of its direct neighbors. `living_neighbors_count` takes a plane zipper `z` and by examines the state of the focus's eight neighboring cells to determine the total number of living neighboring cells of the focus.

``` cpp
template <typename z>
struct living_neighbors_count {
    template <typename neighbor>
    struct get_weight {
        enum { value = neighbor::get::value ? 1 : 0 };
    };

    enum {
        value =
            get_weight<typename z::left>::value +
            get_weight<typename z::right>::value +
            get_weight<typename z::up>::value +
            get_weight<typename z::down>::value +
            get_weight<typename z::left::up>::value +
            get_weight<typename z::left::down>::value +
            get_weight<typename z::right::up>::value +
            get_weight<typename z::right::down>::value };
};
```

The Life transition function is encoded in `life_rule`. It determines the next state of the cell at the focus of plane zipper `z` based on its current state and the state of its neighbors.

``` cpp
template <typename z>
struct life_rule {
    using living = living_neighbors_count<z>;
    
    using type =
        typename std::conditional<living::value == 2,
            typename z::get,
            Cell<living::value == 3>>::type;
};
```

`evolve` applies the transition function  to all cells in the plane zipper `world`.

``` cpp
template <typename world>
struct evolve {
    using type = extendPlane<life_rule, world>;
};
```   


# Output
Our compile time Life implementation outputs a type that encodes the state of the game world. This type is completely useless on its own, but we can write simple printing functions that transform the type into a set of operations that print it out at runtime.

Printing of the various types uses the `Print` struct interface.
   
``` cpp
template <typename>
struct Print;
```

`Print` is specialized for each type we are interested in, with specializations implementing a static `Do` function that writes the value of the input type to stdout.

``` cpp
template <>
struct Print<Cell<true>> {
    static void Do() {
        std::cout << "X";
    }
};

template <>
struct Print<Cell<false>> {
    static void Do() {
        std::cout << "-";
    }
};
```

Lists are printed by first printing the head of the list, and then recursively  printing the rest of the list. 

``` cpp
template <typename X, template<typename> class XS>
struct Print<List<X, XS>> {
    static void Do() {
        Print<car<List<X, XS>>>::Do();
        Print<cdr<List<X, XS>>>::Do();
    }
};

template <>
struct Print<Nil> {
    static void Do() { /* noop */ }
};
```

One-dimensional zippers are printed by converting them to a fixed size list, in this case five elements from each side of the focus for a total of eleven columns, and then printing the contents of the list. Since these zippers form the rows in the Life world, a new line is printed after the contents of the zipper are printed.

``` cpp
template <typename l, typename x, typename r>
struct Print<Zipper<l, x, r>> {
    static void Do() {
        Print<typename Zipper<l, x, r>::template to_list<5>>::Do();
        std::cout << "\n";
    }
};
```

Finally, two-dimensional plane zippers are printed by printing the rows of the world. Again, five elements from each size of the focus are taken for a total of eleven rows.

``` cpp
template <typename z>
struct Print<PlaneZipper<z>> {
    static void Do() {
        Print<typename z::template to_list<5>>::Do();
        std::cout << "\n";
    }
};
```


# Putting It All Together
The base state of Life is an infinite plane of dead cells. Each row is a zippered, infinite lazy lists of dead cells. 

``` cpp
using inf_dead_list = gen<DeadCell>;

using dead_row =
    Zipper<
        inf_dead_list,
        DeadCell,
        inf_dead_list>;
```

The initial state of a row is written with the `line` function.

``` cpp
template <typename... values>
using line = Zipper<
    inf_dead_list,
    DeadCell,
    concat<
        list_from_params<values...>,
        inf_dead_list>>;
```

The vertical is a zippered, infinite lazy list of dead rows, forming a dead plane of cells.

``` cpp
using inf_dead_rows = gen<dead_row>;

using dead_plane =
    Zipper<
        inf_dead_rows,
        dead_row,
        inf_dead_rows>;
```

The initial state of the world is expressed as a zipper of rows, with each row expressed using `line`. This example shows a [glider][glider] structure.

``` cpp
using glider =
    PlaneZipper<
        Zipper<
            inf_dead_rows,
            dead_row,
            concat<
                list_from_params<
                    line<DeadCell, LiveCell, DeadCell>,
                    line<DeadCell, DeadCell, LiveCell>,
                    line<LiveCell, LiveCell, LiveCell>>,
                inf_dead_rows>>>;
```

```
-----------
-----------
-----------
-----------
-----------
-----------
-------X---
--------X--
------XXX--
-----------
-----------
```

## Running
Each generation of the world is constructed by invoking `evolve` on the current state. For example, the third generation of the glider is computed, `typename evolve<typename evolve<glider>::type>::type`.

An infinite list of generations of the glider structure is expressed, `iterate<evolve, glider>`.

To actually print out the results, we must select a fixed number of generations from the list. This example prints the first 4 generations of the glider.

``` cpp
int main(int argc, const char * argv[]) {
    Print<
        take<4, iterate<evolve, glider>>>::Do();
    return 0;
}
```

```
-----------
-----------
-----------
-----------
-----------
-----------
-------X---
--------X--
------XXX--
-----------
-----------

-----------
-----------
-----------
-----------
-----------
-----------
-----------
------X-X--
-------XX--
-------X---
-----------

-----------
-----------
-----------
-----------
-----------
-----------
-----------
--------X--
------X-X--
-------XX--
-----------

-----------
-----------
-----------
-----------
-----------
-----------
-----------
-------X---
--------XX-
-------XX--
-----------
```

Any more than the first few generations, or printing larger areas, is completely impractical because of how long compilation takes. 


[brainfuck]: /stupid-template-tricks-brainfuck-compile-time-evaluator/
[list]: /stupid-template-tricks-lazy-compile-time-lists/
[source]: https://gist.github.com/mattbierner/bbd2d4d07772273029c2

[comonad]: http://hackage.haskell.org/package/comonad-3.0.0.2/docs/Control-Comonad.html
[functor]: http://hackage.haskell.org/package/base-4.7.0.1/docs/Prelude.html#t:Functor

[zipper]: http://en.wikipedia.org/wiki/Zipper_(data_structure)
[life]: http://en.wikipedia.org/wiki/Conway's_Game_of_Life
[glider]: http://en.wikipedia.org/wiki/Glider_(Conway's_Life)

[void]: http://blog.emillon.org/posts/2012-10-18-comonadic-life.html