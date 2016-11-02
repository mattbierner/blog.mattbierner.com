---
layout: post
title: 'Compile Time Pseudo-Random Number Generator'
series: stupid_template_tricks
date: '2015-01-16'
---
What with all those pesky NSA backdoors, runtime random number generation is just not secure. So let's build a compile time pseudo-random number generator with C++ templates.

{% include image.html file="sb-69.jpg" description="Witness the impossible as Matt Bierner encodes a five bit register using gigabytes of compiler memory and trillions of cpu cycles." %}
  
In this post, I'll walk through the implementation of a simple, deterministic pseudo-random number generator using a [linear feedback shift register (LFSR)][lfsr]. The complete source is [available here][src].

# State 
A LFSR is a simple state machine, with the state itself stored as string of binary cells. A runtime C++ LSFR implementation would typically use a `uint16_t` or `uint32_t` to hold the state, but us  metaprogrammers scoff at such fixed size naïvety. No, we'll encode our state as a `std::integer_sequence` of booleans.

``` cpp
template <bool... bits>
using bitset = std::integer_sequence<bool, bits...>;
```

`bitset` stores its most significant bit in the first (leftmost) position. The structure of `bitset` makes implementing the LSFR easy, but we'll also provide a way to convert a `bitset` to an integer values for more practical use.

The `to_int` accumulator converts a `bitset` to a value of `T`. For each bit, from most significant to least significant, it shifts the accumulated value left by one and ors the next bit on in the least significant position. 

``` cpp
template <typename T, T value, typename set>
struct to_int;

template <typename T, T value>
struct to_int<T, value, bitset<>> :
    std::integral_constant<T, value> { };

template <typename T, T value, bool x, bool... xs>
struct to_int<T, value, bitset<x, xs...>> :
    std::integral_constant<T,
        to_int<T,
            static_cast<T>((value << 1) | x),
            bitset<xs...>>::value> { };
```

# Indices and List Operations
The other component that defines a LFSR is its taps. In a [Fibonacci LFSR][lfsr], the taps are indices of the bits that are sampled to calculate the next input value. Every sample is xored together to produce the next input.

We'll also use an `std::integer_sequence` to store the indices.

``` cpp
template <size_t... values>
using indices = std::integer_sequence<size_t, values...>;
```

To make working with `bitset` and `indices` more natural, let's write a few quick helper functions to implement the basic list operations.

`car` gets the head of an `std::integer_sequence`

```  cpp
template <typename list>
struct car;

template <typename T, T x, T... xs>
struct car<std::integer_sequence<T, x, xs...>> :
    std::integral_constant<T, x> { };
```

`cdr` gets the rest of an `std::integer_sequence`. The type `cdr_t` allows us to use the more straightforward syntax `cdr<list>` instead of `typename cdr<list>::type` in the implementation.

```  cpp
template <typename list>
struct cdr;

template <typename T, T x, T... xs>
struct cdr<std::integer_sequence<T, x, xs...>> {
    using type = std::integer_sequence<T, xs...>;
};

template <typename list>
using cdr_t = typename cdr<list>::type;
```

`cons` prepends an element onto a list:

```  cpp
template <typename rest, typename rest::value_type head>
struct cons;

template <typename T, T x, T... xs>
struct cons<std::integer_sequence<T, xs...>, x> {
     using type = std::integer_sequence<T, x, xs...>;
};

template <typename rest, typename rest::value_type head>
using cons_t = typename cons<rest, head>::type;
```

`get` looks up the value at index `N` in a list:

``` cpp
template <size_t N, typename T>
struct get;

template <typename T, T x, T... xs>
struct get<0, std::integer_sequence<T, x, xs...>> :
    std::integral_constant<T, x> { };

template <size_t N, typename T, T x, T... xs>
struct get<N, std::integer_sequence<T, x, xs...>> :
    std::integral_constant<T,
        get<N - 1, std::integer_sequence<T, xs...>>::value> { };
```

And `take` ensures that the list contains at most `N` elements, starting at the most significant bit in a `bitset`.

``` cpp
template <size_t N, typename T>
struct take;

template <typename T, T... xs>
struct take<0, std::integer_sequence<T, xs...>> {
    using type = std::integer_sequence<T>;
};

template <size_t N, typename T, T... xs>
struct take<N, std::integer_sequence<T, xs...>> {
    using type = cons_t<
        typename take<N - 1,
            cdr_t<std::integer_sequence<T, xs...>>>::type,
        car<std::integer_sequence<T, xs...>>::value>;
};

template <size_t N, typename T>
using take_t = typename take<N, T>::type;
```

# The LFSR
The Linear feedback shift register itself has two components: a `bitset` state and an `indices` of taps. `value` converts the current state to a integer value of type `T`.

`next` advances the state by one. First, the new most significant bit is calculated using `get_next` on the current state. This new value is consed onto the head of new state. Then, to complete the shift, we trim the last value off the end of the state, leaving a bitset of the same length as the original with its contents shifted down by one.

``` cpp
template <typename state, typename taps>
struct Lfsr {
    template <typename T>
    using value = to_int<T, 0, state>;

    using next =
        Lfsr<
            take_t<state::size(),
                cons_t<
                    state,
                    get_next<state, taps>::value>>,
            taps>;
};
```

The `get_next` function calculates the most significant bit of the next state. For each tap in `taps`, it xors the value held in the state at that tap's position with the `get_next` result for the rest of the taps.

``` cpp
template <typename state, typename taps>
struct get_next;

template <typename state>
struct get_next<T, indices<>> :
    std::integral_constant<bool, false> { };

template <typename state, size_t tap, size_t... taps>
struct get_next<state, indices<tap, taps...>> :
    std::integral_constant<bool,
        (get<tap, state>::value) ^ (get_next<state, indices<taps...>>::value)> { };
```

# Output
Bringing it all together, here's a very simple LFSR of 5 bits with an initial state of `01011`. The two taps are at indexes `2` (the third bit) and `4` (the last bit).

``` cpp
using initial = bitset<false, true, false, true, true>;
using taps = indices<2, 4>;
using rdm = Lfsr<initial, taps>;
```

`rdm` is just a type though. We could use it for more metaprogramming, or convert it to a runtime value and use it in fancy expressions:

```
auto x = rdm::value<unsigned>::value;
int randomLenArray[rdm::value<size_t>::value];
```

And we can advance the LFSR too, to get a new random number.

```
using secondIteration = rdm::next;
auto y = secondIteration::value<unsigned>::value;
```

But manually advancing is tedious. To ensure our LFSR is working as expected, let's use a simple iterator `gen` to produce a list of the first `N` states of our LFSR (you can easily modify `gen` to produce just the Nth state).

``` cpp
template <size_t N, typename lfsr>
struct gen;

template <typename state, typename taps>
struct gen<0, Lfsr<state, taps>> {
    using type = std::integer_sequence<unsigned>;
};

template <size_t N, typename state, typename taps>
struct gen<N, Lfsr<state, taps>> {
    using lfsr = Lfsr<state, taps>;
    
    using type = cons_t<
        typename gen<N - 1, typename lfsr::next>::type,
        lfsr::template value<unsigned>::value>;
};
```

Then we'll specialize a `Printer` to convert a type to a `Print` operation that outputs a readable representation of that type at runtime.

``` cpp
template <typename>
struct Printer;

template <typename T>
struct Printer<std::integer_sequence<T>>
{
    static void Print() { /* noop */ }
};

template <typename T, T x, T... xs>
struct Printer<std::integer_sequence<T, x, xs...>>
{
    static void Print()
    {
        std::cout << x << "\n";
        Printer<std::integer_sequence<T, xs...>>::Print();
    }
};
```

Computing the first forty iterations at compile time.

``` cpp
using fortyIterations = typename gen<40, rdm>::type;
Printer<fortyIterations>::Print();
```

```
11
21
10
5
2
1
16
8
4
18
9
20
26
13
6
19
25
28
30
31
15
7
3
17
24
12
22
27
29
14
23
11 // loops after 31 outputs.
21
10
5
2
1
16
8
4
```

As expected, the result is a pseudo random stream of numbers that loops after outputting 31 values. The value `0` can never be output. 

So now you can sit back and enjoy your new zero overhead random number generator.

```
int getRandomNumber()
{
    // gauranteed to be random,
    // no dice required.
    return rdm::next::next::next
        ::next::next::next
        ::next::next::next::value<int>::value;
}
```

[lfsr]: http://en.wikipedia.org/wiki/Linear_feedback_shift_register#Fibonacci_LFSRs
[src]: https://gist.github.com/mattbierner/d6d989bf26a7e54e7135




