---
layout: post
title: 'Brainfuck Compile Time Evaluator'
series: stupid_template_tricks
date: '2014-10-13'
---
Every 2nd grader knows that the [C++ template system is Turing complete](http://stackoverflow.com/a/275295/306149). So what? Compile time Brainfuck evaluator that's what!

{% include image.html file="LarsonLaBrea.jpeg" %}

It turns out that I'm [not the first person](https://github.com/knome/metabrainfuck/blob/master/bf.cpp) who learned me some  metaprogramming and thought it would be a good laugh to implement Brainfuck with C++ templates. But in going though this admitidly pointless exercise, what struck me is how similar a Brainfuck C++ template evaluator is to [one implemented in a functional-style](https://github.com/mattbierner/neith-brainfuck/blob/master/lib/bf.kep).

In just around 200 LOC, you can create a fairly reasonable and clear Brainfuck implementation using C++ templates. And, while implementing Brainfuck is certainly not very practical, metaprogramming in the same vein actually [does have some interesting applications](http://www.boost.org/doc/libs/1_56_0/doc/html/xpressive.html).

# Overview
This post covers expressing a Brainfuck evaluator from the ground up. The complete source code can be [found here](https://gist.github.com/mattbierner/090a80d25259b6472827).

I'll start by defining a few helper types and operations that will make the rest of the implementation more clear. Comprehensibility and generality are favored over brevity and cleverness. 

Let's get started.

# I/O Buffers
Before expressing language semantics, we need to encode a compile time character buffer. These buffers will be used as both the actual Brainfuck I/O buffers, and also to hold program source code.  

Our buffer type will encode specific characters sequence as unique types. The C++14 addition `std::integer_sequence` does exactly this, encoding a variadic parameter list of values as a type.

``` cpp
using iochar = char;

template <iochar... chars>
using char_string = std::integer_sequence<iochar, chars...>;

// Simple strings encoded as types
using empty = char_string<>;
using one_char = char_string<'x'>;
using abc = char_string<'a', 'b', 'c'>;
```

`std::integer_sequence` is pretty bare-bones list. It's useful for unpacks, but inconvenient for our purposes. So let's write some lisp style style `car` and `cdr` operations for `std::integer_sequence`. 

``` cpp
template <typename>
struct seq_car;

template <typename T, T x, T... xs>
struct seq_car<std::integer_sequence<T, x, xs...>> {
    enum { value = x };
};
```

```cpp
seq_car<one_char>::value; // 'x'
seq_car<abc>::value; // 'a'
seq_car<empty>::value; // Compile time error. `seq_car` is not defined for empty sequences.
```

``` cpp
template <typename>
struct seq_cdr;

template <typename T, T x, T... xs>
struct seq_cdr<std::integer_sequence<T, x, xs...>> {
    using type = std::integer_sequence<T, xs...>;
};
```

```cpp
seq_car<abc>::value; // 'a'
seq_car<typename seq_cdr<abc>::type>::value; // 'b'
seq_car<typename seq_cdr<typename seq_cdr<abc>::type>::type>::value; // 'c'
```

`std::integer_sequence` is fundamentally an immuable list of values, so we also need a way to transform a `std::integer_sequence`. Lisp uses the `cons` operations for this, which prepends an element onto the head of a list.

``` cpp
/// Note the reverse argument order vs. `cons` in lisp.
template <typename seq, typename seq::value_type>
struct seq_cons;

template <typename T, T x, T... xs>
struct seq_cons<std::integer_sequence<T, xs...>, x> {
    using type = std::integer_sequence<T, x, xs...>;
};
```

```cpp
using xy = typename seq_cons<one_char, 'y'>::type;

seq_car<xy>::value; // 'y'
seq_car<typename seq_cdr<xy>::type>::value; // 'x'
```

Our evaluator does not actually need `seq_cons`, but we do need its counterpart, `seq_append`, to append a value onto a list.

``` cpp
template <typename seq, typename seq::value_type>
struct seq_append;

template <typename T, T x, T... xs>
struct seq_append<std::integer_sequence<T, xs...>, x> {
    using type = std::integer_sequence<T, xs..., x>;
};
```
```cpp
using xy = typename seq_append<one_char, 'y'>::type;

seq_append<xy>::value; // 'x'
seq_append<typename seq_cdr<xy>::type>::value; // 'y'
```

# Memory Cells
Brainfuck models program memory as an infinite list of cells. Each cell stores a fixed bit number and is initialized to 0. There is [no standard cell size](http://en.wikipedia.org/wiki/Brainfuck#Cell_size), but one byte is the most common.

The `Cell` type encodes a Brainfuck memory cell storing an eight bit number as a type. A few helpers on the `Cell` type allow transforming's cells.

``` cpp
using memval = unsigned char;

template <memval val = 0>
struct Cell {
    enum { value = val };
    
    using add = Cell<static_cast<memval>(val + 1)>;
    using sub = Cell<static_cast<memval>(val - 1)>;
    
    template <memval new_val>
    using put = Cell<new_val>;
};
```

A classic Brainfuck implementation maintains a list of around 30,000 cells. But rather than artificially limit the size of our program memory, we can encode an infinite list fairly easily.

`List` is a lisp style list of types. It encodes a head element and the rest of the list. The `cdr` operation is how we make the list infinite. Unlike normal `cdr`, when we encounter the end of the list, as marked by the `Nil` type, we lazily generate another list element. 

``` cpp
struct Nil { };

template <typename x, typename xs = Nil>
struct List {
    using first = x;
    using rest = typename std::conditional<std::is_same<xs, Nil>::value,
        List<Cell<>>, // Generate next element
        xs>::type;
};
```

Two helpers simplify list access.

``` cpp
template <typename L>
using list_car = typename L::first;

template <typename L>
using list_cdr = typename L::rest;
```

# Memory
We also need a way to encode a position in a `List` of cells. Since `List` is an immutable list of values, a [zipper](http://en.wikipedia.org/wiki/Zipper_(data_structure)) turns out to be a good abstraction for this.


`Zipper` encodes a context in a `List`. `focus` is the element at the current position in the list. `left` is a list of elements to the left of the focus (stored in reverse-order). And `right` is a list of elements to the right of the focus (stored in-order).

``` cpp
template <typename left, typename focus, typename right>
struct Zipper {
    using get = focus;
      
    template <memval T>
    using put = Zipper<left, typename focus::template put<T>, right>;

    using add = Zipper<left, typename focus::add, right>;
    using sub = Zipper<left, typename focus::sub, right>;
    
    using go_left = Zipper<list_cdr<left>, list_car<left>, List<focus, right>>;
    using go_right = Zipper<List<focus, left>, list_car<right>, list_cdr<right>>;
};
```

`get`, `put`, `add`, and `sub` all manipulate the focus. `go_left` shifts the context left by one cell, while `go_right` shifts the context right by one cell.

This also has the advantage of allowing us to encode bi-directionally infinite memory. Again, not a strict requirement of Brainfuck, but certainly an interesting feature. 

`Memory` encodes the initial state of program memory.

``` cpp
using Memory = Zipper<List<Cell<>>, Cell<>, List<Cell<>>>;
```

# State
The complete state of our Brainfuck interpreter is captured in a 3-tuple of memory, input buffer, and output buffer.

``` cpp
template <typename TMem, typename TIn, typename TOut>
struct State {
    using mem = TMem;
    using in = TIn;
    using out = TOut;
};
```

Helpers are used to transform states more easily.

``` cpp
template <typename state, typename mem>
using state_set_mem = State<mem, typename state::in, typename state::out>;
```

For some given program input, the initial state is:

``` cpp
template <iochar... input>
using initial_state = State<Memory, char_string<input...>, char_string<>>;
```

# Basic Semantics
With our data structures and operations defined, we can now express the semantics of Brainfuck.

The `Semantics` type maps program source code to a `eval` templated type that encodes the semantics of the input program. The `eval` template type takes a `state` and outputs a new `state`.

`Semantics<>` is the specialization for empty program input, with `eval` acting as the identity function.

``` cpp
template <iochar... prog>
struct Semantics;

template <> // no more input
struct Semantics<> {
    template <typename state>
    using eval = state;
};
```

The helper `eval` evaluates a semantic type with a given state. 

``` cpp
template <typename semantics, typename state>
using eval = typename semantics::template eval<state>;
```

The semantics of the `+`, `-`, `<`, and `>` operations are straightforward. Each maps a state to a new state by modifying the memory using our previously defined state operations.

* `+` - Increments value of current cell.
* `-` - Decrements value of current cell.
* `>` - Move memory pointer right one cell.
* `<` - Move memory pointer left one cell.

Evaluation is continued on the rest input with the new state.

``` cpp
template <iochar... rest>
struct Semantics<'+', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        state_set_mem<state, typename state::mem::add>>;
};

template <iochar... rest>
struct Semantics<'-', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        state_set_mem<state, typename state::mem::sub>>;
};
```

``` cpp
template <iochar... rest>
struct Semantics<'>', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        state_set_mem<state, typename state::mem::go_right>>;
};

template <iochar... rest>
struct Semantics<'<', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        state_set_mem<state, typename state::mem::go_left>>;
};
```

# I/O Semantics
Input and output is also easily expressed using the previously defined operations.

The output operation `.` reads the value held in memory at the current location, and appends this value to the output buffer.

``` cpp
template <iochar... rest>
struct Semantics<'.', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        State<
            typename state::mem,
            typename state::in,
            typename seq_append<typename state::out, state::mem::get::value>::type>>;
};
```

The input operation `,` reads a value from the input buffer, and stores this value at the current location in memory. The input buffer is also advanced by one. It is a compile time error if the input buffer is empty.

``` cpp
template <iochar... rest>
struct Semantics<',', rest...> {
    template <typename state>
    using eval = eval<
        Semantics<rest...>,
        State<
            typename state::mem::template put<seq_car<typename state::in>::value>,
            typename seq_cdr<typename state::in>::type,
            typename state::out>>;
};
```

# Loop Semantics
Looping is the only somewhat complicated part of the evaluator, as it involves matching symbols in the program source.

When the `[` symbol is encountered, we check if the value stored at the current memory cell is zero. If it is, then we skip to the next instruction after the matching `]` in the source code. Otherwise, we enter the body of the loop, and when the matching `]` is encountered, jump back to execute the original `[` operation again.

First off, let's determine the extent of a loop in source code. `LoopDelimiter` breaks program source code into a `body` section for the loop body between `[` and `]` and an `after` section for everything after the closing `]`.

``` cpp
template <bool end, size_t depth, typename loopBody, iochar... prog>
struct LoopDelimiter;
```

The `end` flag tracks if we found the matching `]` yet. `depth` stores the number of subloops we have entered.

``` cpp
/* Base case, we found end */
template <size_t depth, iochar... body, iochar... prog>
struct LoopDelimiter<true, depth, char_string<body...>, prog...> {
    using body = Semantics<body...>;
    using after = Semantics<prog...>;
};
```

The real logic for `LoopDelimiter` is this rather ugly partial specialization. It examines the next character in the program and determines if the end of the loop has been found. `[` means that we found an inner loop and must continue matching at the next depth. `]` means we found the end of a loop. If the depth was also 1, then it was the end of the outermost loop.

``` cpp
template <size_t depth, iochar... b, iochar x, iochar... xs>
struct LoopDelimiter<false, depth, char_string<b...>, x, xs...> {
    using inner = LoopDelimiter<
        (depth == 1 && x == ']'), // Found end?
        (x == '[' ? (depth + 1) : (x == ']' ? (depth - 1) : depth)),
        char_string<b..., x>,
        xs...>;
    
    using body = typename inner::body;
    using after = typename inner::after;
};
```

When first entering a loop, we branch on whether or not the value of the current memory cell is zero. `LoopBranch` handles this logic, while also automatically reinvoking the loop (since `]` is treated as the unconditional jump) after evaluating the consequent.

``` cpp
/* Evaluate `A` then `B` */
template <typename A, typename B>
struct Then {
    template <typename state>
    using eval = eval<B, eval<A, state>>;
};

template <typename consequent, typename alternate>
struct LoopBranch {
    template <typename state>
    using eval = eval<
        typename std::conditional<state::mem::get::value == 0,
            alternate,
            Then<
                consequent,
                LoopBranch<consequent, alternate>>>::type,
        state>;
};
```

Using `LoopDelimiter` and `LoopBranch`, we can clearly express the semantics of a loop:

``` cpp
template <iochar... rest>
struct Semantics<'[', rest...> {
    template <typename state, typename loop = LoopDelimiter<false, 1, char_string<>, rest...>>
    using eval = eval<
        LoopBranch<typename loop::body, typename loop::after>,
        state>;
};
```

# Finishing Touches
Brainfuck treats any character besides `+-<>.,[]` as a comment. One final partial specialization of `Semantics` makes all other character noops.

``` cpp
template <iochar other, iochar... rest>
struct Semantics<other, rest...> {
    template <typename state>
    using eval = eval<Semantics<rest...>, state>;
};
```

`evaluate` runs a program and extracts the result (the output buffer).

``` cpp
template <typename prog, iochar... input>
using evaluate = typename prog::template eval<initial_state<input...>>::out;
```


# Hello World!
Here is 'Hello World!' in Brainfuck.

``` cpp
using hello_world = Semantics<
    '+', '+', '+', '+', '+', '+', '+', '+', '+', '+',
    '[', '>', '+', '+', '+', '+', '+', '+', '+', '>',
    '+', '+', '+', '+', '+', '+', '+', '+', '+', '+',
    '>', '+', '+', '+', '>', '+', '<', '<', '<', '<',
    '-', ']', '>', '+', '+', '.', '>', '+', '.', '+',
    '+', '+', '+', '+', '+', '+', '.', '.', '+', '+',
    '+', '.', '>', '+', '+', '.', '<', '<', '+', '+',
    '+', '+', '+', '+', '+', '+', '+', '+', '+', '+',
    '+', '+', '+', '.', '>', '.', '+', '+', '+', '.',
    '-', '-', '-', '-', '-', '-', '.', '-', '-', '-',
    '-', '-', '-', '-', '-', '.', '>', '+', '.', '>',
    '.'>;
```

Passing this type into `evaluate` produces a type encoding the output of this program.

``` cpp
evaluate<hello_world> x { }; // Perhaps the most useless variable ever
```

This type is not very useful on its own, but we can use a helper function `print_seq` to print the type (the sequence of characters in the output buffer) to stdout.

``` cpp
template <typename T, T... xs>
void print_seq(std::integer_sequence<T, xs...>) {
    bool Do[] = { (std::cout << xs, true)... };
    (void) Do;
    std::cout << std::endl << std::flush;
}
```

So that we can evaluate `hello_world` at compile time and print the result.

``` cpp
int main(int, const char*[]) {
    print_seq(evaluate<hello_world>{});
}
```

```
Hello World!

Program ended with exit code: 0
```

{% include image.html file="Hitler_Head_Asplode.gif" description="Today Hello World, Tomorrow the World!" %}


