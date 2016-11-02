---
layout: post
title: 'Reversing Template Parameters on Templated Types'
series: stupid_template_tricks
date: '2014-10-11'
---
When I  came across [this Stack Overflow question][so] about reversing a c++ `std::tuple` type, naturally I wondered if the same could be done to templated types besides `std::tuple`, i.e. for a templated type `T`, converting `T<P1, P2, ..., Pn>` to `T<Pn, Pn-1, ..., P1>`.

Not that I have any practically application for type reversal mind you. But I was curious.

{% include image.html file="Claude_Cat_angel.jpg" %}


# Templated Type Template Parameter Combinations and Permutations
Before implementing type reversal, we need to understand templated type permutations and combinations. We ultimately only care about the reversed type permutation, but getting there requires a number of intermediate type combinations. And some of these combinations may not be valid instantiations of `T`.

With a set of parameters `std::tuple<P1, P2, ..., Pn>`, the `std::tuple` type is valid for any combination or permutation of `P1, P2, ..., Pn`.


``` cpp
// For a target tuple
using my_tuple = std::tuple<int, bool, std::string>;

// All permutations and combination are also valid:
std::tuple<int, bool, std::string>;
std::tuple<int, std::string, bool>;
std::tuple<bool, int, std::string>;
std::tuple<bool, std::string, int>;
std::tuple<std::string, int, bool>;
std::tuple<std::string, bool, int>;
std::tuple<int, bool>;
std::tuple<int, std::string>;
std::tuple<bool, int>;
std::tuple<bool, std::string>;
std::tuple<std::string, int>;
std::tuple<std::string, bool>;
std::tuple<int>;
std::tuple<bool>;
std::tuple<std::string>;
std::tuple<>;
```

But `std::tuple` is actually the exception in this respect. Most types, even `std::pair`, are only valid for specific permutations and combinations.


``` cpp
/// For a target pair
using my_pair = std::pair<int, std::string>;

// Only permutations are valid, and not combinations with 1 or zero types.
std::pair<int, std::string>; // valid
std::pair<std::string, int>; // valid
std::pair<std::string>; // invalid
std::pair<int>; // invalid
std::pair<>; // invalid
```

Furthermore, specific permutations of a type may be invalid, whereas the reversal type is valid.


``` cpp
template <typename A, typename B, typename C>
struct Foo
{
    static_assert(std::is_integral<C>::value, "");
};

Foo<int, std::string, unsigned>; // valid 
Foo<int, unsigned, std::string>; // invalid 
Foo<unsigned, std::string, int>; // reversal is also valid
```

Although our ultimate goal is to determine the revered type permutation, the most simple type reversal logic requires a number of intermediate combination types, all of which must be valid, to calculate the final reversed types.  

# Easy Case - Reversing Tuple-Like Types
We'll therefore start by reversing a `std::tuple`. This way, we don't have to worry about invalid type combinations and permutations. The second part of this post will apply reversal to any templated type.

To start, we need a helper to get the base case of type reversal, templated type `T` with zero parameters. 


``` cpp
template<typename>
struct templated_base_case;

template <template<typename...> class T, typename... TArgs>
struct templated_base_case<T<TArgs...>>
{
    using type = T<>;
};
```

The reversal implementation itself is based on [this Stack Overflow answer][reversal], generalized to template type `T`. `reverse_impl` operates on two templated types: an input type `T<...>` that captures the rest of the type list to be reversed and an output type `T<...>` that captures the reversed type output.


``` cpp
template<
    typename T, // Input
    typename = typename templated_base_case<T>::type> // Reversed output
struct reverse_impl;
```

The base case, expressed as a partial specialization, is when the input type list is empty, resulting in the output type list.


``` cpp
template<
    template <typename...> class T,
    typename... TArgs>
struct reverse_impl<
    typename templated_base_case<T<TArgs...>>::type,
    T<TArgs...>>
{
    using type = T<TArgs...>;
};
```

The main reversal implementation gets the head of the input type list and conses it onto the output type list. The remainder of the input type list is recursively reversed.


``` cpp
template<
    template<typename...> class T,
    typename x,
    typename... xs,
    typename... done>
struct reverse_impl<
    T<x, xs...>,
    T<done...>>
{
    using type = typename reverse_impl<T<xs...>, T<x, done...>>::type;
};
```

`reverse_impl` can successfully reverse any tuple type:


``` cpp
using my_tuple = std::tuple<int, bool, char>;

static_assert(
    std::is_same<
        typename reverse_impl<my_typle>::type,
        std::tuple<char, bool, int>>::value,
    "");

```

# Reversing Arbitrary Templated Types
Now if we try to apply `reverse_impl` to a type such as `std::pair`, the compiler will complain.


``` cpp
using my_pair = std::pair<int, std::string>;
using my_revesed_pair = typename reverse_impl<my_pair>::type; // Error here
```

This is because `reverse_impl` attempts to instantiate `std::pair` with invalid template parameters, such as `std::pair<>`. So even though we technically never use these intermediate types for anything more than storing a list of types, the compiler does not know this. We need another level of indirection to reverse arbitrary types where only the input and reversed type permutation must be valid.

The goal here is to make any templated type `T` behave like a `std::tuple`. In fact, we really just need to put the types of `T` into a `std::tuple`, reverse the tuple, and then extract and reapply the reversed types back to `T`.

To avoid confusion, I'll define a template type `type_list` that captures a list of types, much the way `std::tuple` does.


``` cpp
template <typename...>
struct type_list { };

/// Helper the creates a type list from a templated type.
template <typename>
struct make_type_list;

template <template <typename...> class T, typename... TArgs>
struct make_type_list<T<TArgs...>>
{
    using type = type_list<TArgs...>;
};
```

This allows us to put a templated type type list into a `type_list` type that can be reversed.


``` cpp
using my_pair = std::pair<int, std::string>;
using types = typename make_type_list<my_pair>::type; // {int, std::string}
using reversed_types = typename reverse_impl<types>::type; // {std::string, int}
```

Now all we need to do is reapply the reversed type list back to the original templated type `T`. A helper that swaps the template parameters of two templated types accomplishes this.


``` cpp
template<typename L, typename R>
struct swap_template_parameters;

template<
    template<typename...> class L,
    template<typename...> class R,
    typename... l_types,
    typename... r_types>
struct swap_template_parameters<L<l_types...>, R<r_types...>>
{
    using left_type = L<r_types...>;
    using right_type = R<l_types...>;
};
```

So that we can now reverse `std::pair` and other types.


``` cpp
using my_pair = std::pair<int, std::string>;

using types = typename make_type_list<my_pair>::type;
    
using reversed_types = typename reverse_impl<types>::type;

using reversed_my_pair = typename swap_template_parameters<my_type, reversed_type>::left;
```

Bringing this all together into a simple helper template.

``` cpp
template<typename T>
struct reverse_type;

template<
    template<typename...> class T,
    typename... list>
struct reverse_type<T<list...>>
{
    using types = type_list<list...>;
    
    using reversed_types = typename reverse_impl<types>::type;
    
    using type = typename swap_template_parameters<
        T<list...>,
        reversed_types>::left_type;
};
```

Which can reverse the parameters of any templated type, so long as the reversed templated type is also valid:


``` cpp
std::are_same<
    typename reverse_type<
        std::tuple<int, const char*, bool>>::type,
    std::tuple<bool, const char*, int>>::value

std::are_same<
    typename reverse_type<
        std::pair<int, std::string>>::type,
    std::pair<std::string, int>>::value;
``` 
   
``` cpp 
/// Standard collections cannot be directly reversed easily
/// because they take default template parameters such as Allocator.
template<typename K, typename V>
struct simple_map : std::unordered_map<K, V> { };

std::is_same<
    typename reverse_type<simple_map<std::string, int>>::type,
    simple_map<int, std::string>>::value;
```

# Conclusion

Like most good template metaprogramming, I have no clue how type reversal can be practically applied. But it is possible, and implementing it did significantly improve my understanding of the c++ template system.

And who knows, maybe someone will find a good use for this.

[so]: http://stackoverflow.com/q/17178075/306149
[reversal]: http://stackoverflow.com/a/26310770/306149