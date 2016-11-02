---
layout: post
title: 'Lazy Compile-Time Lists'
series: stupid_template_tricks
date: '2014-10-28'
---
> In this time, the most precious substance in the Universe is the List. The List extends life. The List expands consciousness. The List is vital to functional travel.

This post overviews the implementation of a compile-time lazy list in C++ templates, along with a few common list operations, such as concatenation and mapping. The complete code can be [found in this gist](https://gist.github.com/mattbierner/d3ea4c9b792d36eeecbd).

{% include image.html file="kenneth_mcmillan_as_baron_vladimir_harkonnen.jpg" description="Oh my C++. You are SO beautiful. Your syntax, love to me. Your diseases lovingly cared for, for all eternity." %}

# List Structure
The core list datatype is based on a [stream][streams] structure. It has two components: a head, which is directly accessible in constant time, and a tail, which is a [thunk][thunk] that returns the rest of the list.

To implement this structure at compile time, the head is a type (or meta-value) and the rest thunk is a meta-function. A meta-function is a template type that, when instantiated, produces a result type. I have chosen to encode meta-functions as template template parameters in this post, as I find this can make the code a bit more clear.

Putting this all together, here is the main list structure:

``` cpp
template <
    typename head,
    template <typename> class get_rest>
struct List {
    using first = head;
    using rest = typename get_rest<head>::type;
};
```

One possible alternative is to instead encode meta-functions a regular types, types that contain an `apply` templated type that invokes the meta-function to produce a result:

``` cpp
template <typename head, typename get_rest>
struct List2 {
    using first = head;
    using rest = typename get_rest::template apply<head>::type;
};
```

The advantage of avoiding template template parameters directly is that both meta-values and meta-functions can be bound using `typename`, allowing certain higher order template operations to be more easily defined, such as the [type reversal](/stupid-template-tricks-reversing-template-parameters-on-templated-types/) I previously examined.

Finally, the `Nil` type represents the empty list.

``` cpp
struct Nil { };
``` 

# Basic Operations
The `car` function gets the head of the list, while `cdr` gets the rest of a list. These eliminate the need for using the `typename` prefix to access a list.

``` cpp
template <typename l>
using car = typename L::first;

template <typename l>
using cdr = typename l::rest;
```

`cons` constructs a new list by prepending a value onto an existing list. Since we already know the rest of the list, the `get_rest` parameter of `List` is more generic than we need to implement `cons`. The `constant` function creates another function called `apply` that returns a constant value. `cons` uses `constant` to define a `List`.

``` cpp
template <typename x>
struct constant {
    template <typename>
    struct apply {
        using type = x;
    };
};

template <typename x, typename l>
using cons = List<x, constant<l>::template apply>; 
```
 
Constructing a list from `cons` still requires a fair bit of typing. `ListFrom` behaves like `list` is Lisp, building a list from its arguments 

``` cpp
template <typename...>
struct ListFrom;

template <typename x, typename... xs>
struct ListFrom<x, xs...> {
    using type = cons<x, typename ListFrom<xs...>::type>;
};

template <>
struct From<> {
    ListFrom type = Nil;
};
```

Whenever template specialization is required, a wrapper type makes invoking the template a bit more natural. 

``` cpp
template <typename... elements>
using from = typename ListFrom<elements...>::type;
```

# Transformations
More complex transforms can be implemented using the basic operations. Here I present a few examples, many of which are almost direct translations of their [Haskell](http://hackage.haskell.org/package/base-4.7.0.1/docs/Prelude.html) or [Scheme](http://trac.sacrideo.us/wg/wiki/R7RSHomePage) counterparts.

`map` lazily applies function `f` to every element of list `l`, producing a new list of the results.
 
``` cpp
template <
    template<typename> class f,
    typename l>
struct ListMap {
    template <typename>
    struct MapImpl {
        using type = typename ListMap<f, cdr<l>>::type;
    };
    
    using type = List<typename f<car<l>>::type, MapImpl>;
};

template <template<typename> class f>
struct ListMap<f, Nil> {
    using type = Nil;
};

template <template<typename> class f, typename l>
using map = typename ListMap<f, l>::type;
```

`take` creates a list consisting of at most `count` elements from list `l`. 

``` cpp
template <size_t count, typename l>
struct ListTake {
    template <typename>
    struct TakeImpl {
        using type = typename ListTake<
            count - 1,
            cdr<l>>::type;
    };

    using type = List<car<l>, TakeImpl>;
};

template <typename L>
struct ListTake<0, L> {
    using type = Nil;
};

template <size_t count>
struct ListTake<count, Nil> {
    using type = Nil;
};

template <size_t count, typename L>
using take = typename ListTake<count, L>::type;
```

And `reverse` reverses list `l`. Unlike all the other transformations presented so far, `l` must be finite, otherwise we could never find the head of the reversed list. 

``` cpp
template <typename l>
struct Reverse {
    using type = concat<
        typename Reverse<cdr<l>>::type,
        cons<car<l>, Nil>>;
};

template<>
struct Reverse<Nil> {
    using type = Nil;
};

template <typename l>
using reverse = typename Reverse<l>::type;
```

# Construction and Generation
`concat` joins lists `l1` and `l2`.

``` cpp
template <typename l1, typename l2>
struct ListConcat {
    template <typename>
    struct ConcatImpl {
        using type = typename ListConcat<cdr<l1>, l2>::type;
    };

    using type = List<car<L1>, ConcatImpl>;
};

template <typename l2>
struct ListConcat<Nil, l2> {
    using type = l2;
};

template <typename l1, typename l2>
using concat = typename ListConcat<l1, l2>::type;
```

`iterate` constructs a list from recursive application of function `f` to an initial value `x`. The resulting infinite list has the form: `[x, f(x), f(f(x)), f(f(f(x))), ...]`

``` cpp
template <
    template <typename> class f,
    typename x>
struct Iterate {
    template <typename l>
    struct IterateImpl {
        using type = List<typename f<l>::type, IterateImpl>;
    };
    
    using type = List<x, IterateImpl>;
};

template <template<typename> class f, typename x>
using iterate = typename Iterate<f, x>::type;
```

`gen` creates an infinite list of repeated values.

```cpp
template <typename x>
struct id {
    using type = x;
};

template <typename x>
using gen = iterate<id, x>;
```

# Conclusion
`List` proves to be a nice abstraction that also allows us to work with infinite lists compile-time. And once you get past some of the C++ template meta-programming warts, many functional concepts can be easily implemented at compile time in C++.

{% include image.html file="Kyle_MacLachlan_en_Dune.jpg" description="Glowing blue eyes (and terrible acting skills) are only a temporary side effect of too much template meta-programming." %}

[streams]: https://www.gnu.org/software/mit-scheme/documentation/mit-scheme-ref/Streams.html
[thunk]: http://en.wikipedia.org/wiki/Thunk
