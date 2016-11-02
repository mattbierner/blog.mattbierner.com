---
layout: post
title: 'Short-Circuiting'
series: stupid_template_tricks
date: '2015-01-18'
---
C++ templates make it remarkably easy to shoot yourself in the foot. Case in point, this seemly innocent template function:

```cpp
template <unsigned val>
struct is_even {
    static const bool value = (val > 1) && (is_even<val - 2>::value);
};

template <>
struct is_even<0> : std::true_type { };
```

Now, no sane person would write `is_even` this way. But it turns out that this pattern is easy to accidentally introduce in complex programs. Let's take a look at what goes wrong.

Things start out well:

```cpp
is_even<0>::value; // true
is_even<2>::value; // true
```

But as soon as you try to check an odd number, the compiler goes crazy.

``` cpp
is_even<1>::value;
```

```
fatal error: recursive template instantiation exceeded maximum depth of 256
    static const bool value = val > 1 && is_even<val - 2>::value;
                                         ^
in instantiation of template class 'is_even<4294966785>' requested here
    static const bool value = val > 1 && is_even<val - 2>::value;
                                         ^
...
in instantiation of template class 'is_even<4294967293>' requested here
    static const bool value = val > 1 && is_even<val - 2>::value;
                                         ^
in instantiation of template class 'is_even<4294967295>' requested here
    static const bool value = val > 1 && is_even<val - 2>::value;
                                         ^
in instantiation of template class 'is_even<1>' requested here
    std::cout << is_even<1>::value;
        ^
```

{% include image.html file="shortcircuit1.jpg" description="Compiler errors like this make Johnny Five very upset" %}

# The problem
Looking bottom up through the error stack, we see that `is_even<1>` is instantiated first. This should produce: `1 > 1 && is_even<1 - 2>::value`, which evaluates to `false && is_even<1 - 2>::value`, which should just be `false`. Right?

But `is_even` assumes that the `&&` operator follows the same evaluation rules in a template context as it does in a regular program, including short circuiting if the lefthand side is `false`. And the `&&` does follow the same rules here. Except for the key detail that short circuiting operates on expressions, while template evaluation takes place during an earlier stage of compilation. And that is why the compiler keeps instantiating `is_even` until it blows up, even though it is clear to us that that instantiation is not needed. 

# Thunks
Our contrived `is_even` program can best be fixed with template specialization, which is arguably more clear as well:

```
template <unsigned val>
struct is_even {
    static const bool value = is_even<val - 2>::value;
};

template <> struct is_even<1> : std::false_type { };

template <> struct is_even<0> : std::true_type { };
```

But what about more complex programs? Thankfully, all problems of C++ metaprogramming are best solved by more C++ metaprogramming. 

The core problem here is that the compiler eagerly instantiates templates, resulting in instantiations that we don't need or even want. We have to explicitly tell the compiler to defer instantiation until we really need it, and that's where thunks come in.

First, a short circuiting `&&` operation. `logical_and` evaluates some type `right` by calling `right::type` only if the value branched on is true. We'll assume that the result `right::type` is a `std::integral_constant`, allowing us to use inheritance to implement `logical_and`. 

```cpp
template <bool, typename right>
struct logical_and : right::type { };

template <typename right>
struct logical_and<false, right> : std::false_type { };
```

Now, back in `is_even`, instead of using `&&` directly, we'll use `logical_and` and hardcode a local thunk that invokes `is_even` only when needed:

```cpp
template <unsigned val>
struct is_even {
    template <unsigned arg>
    struct Thunk {
        using type = is_even<arg>;
    };

    static const bool value = logical_and<(val > 1), Thunk<val - 2>>::value;
};
```

And now we can finally find out if `1` and `3` are even or not.

```cpp
is_even<1>::value; // false
is_even<3>::value; // false
```

# Further Work
If you are working only with types, and not values or template template parameters, a generic thunk can be encoded as:

```cpp
template <template<typename...> class T, typename... args>
struct Thunk {
    using type = T<args...>;
};
```

A short-circuiting replacement for the `||` operator is just as easy.

```cpp
template <bool, typename right>
struct logical_or : std::true_type { };

template <typename right>
struct logical_or<false, right> : right::type { };
```

As well as one for the ternary `?` operator.

```cpp
template <bool, typename consequent, typename alternate>
struct ternary : consequent::type { };

template <typename consequent, typename alternate>
struct ternary<false, consequent, alternate> : alternate::type { };
```


