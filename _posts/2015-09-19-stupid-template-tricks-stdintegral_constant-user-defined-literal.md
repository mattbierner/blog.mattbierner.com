---
layout: post
title: std::integral_constant User Defined Literal
series: stupid_template_tricks
date: '2015-09-19'
---
Template metaprogramming is the great leveler. It doesn't discriminate between easy things and hard things, it just makes all things equally hard. Take for example encoding integers as types with user defined literals. Sounds easy. Looks easy. Writes easy:

```cpp
constexpr auto operator""_lit(unsigned long long x) {
    return std::integral_constant<unsigned long long, x>{};
}

auto a = 5_lit;
```

But while `constexpr` may be good for you and good for me, the compiler tells us that [`_lit` is invalid](http://stackoverflow.com/questions/26582875/constexpr-function-parameters-as-template-arguments). Why? `x` is not actually a compiletime constant as far as it cares, so what are we to do?

Naturally, C++ templates offer a perfectly reasonable solution: parse the literal yourself. 

{% include image.html file="worldoshit.jpg" description="In other words, it's a huge shit sandwich, and we're all gonna have to take a bite." %}

This post overviews the implementation of a user defined literal for `std::integral_constant`. The result support binary, octal, and hex literals, along with the `'` digit separator. You can find the complete code [on Github][src].

# Why?
`std::integral_constant` nicely augments [expression templates](expression templates c++ tutorial) and empowers embedded domain specific languages. Consider this toy example:

```cpp
template <typename Expression, typename T, T x,
    typename = std::enable_if_t<x != 0>>
constexpr auto operator*(Expression e, std::integral_constant<T, x> v) {
    return ...;
}

template <typename Expression, typename T>
constexpr auto operator*(Expression e, std::integral_constant<T, 0> v) {
    return ...;
}
```

`std::integral_constant` allows us to play the Haskeller and pattern matching on values themselves instead of just on their types. This in turn allows the overloads to return different result types based on argument values, something that is not otherwise possible with `constexpr` and integer arguments.

But for us lazy metaprogramers, typing out `std::integral_constant<int, 5>` is a chore, and the prefix notation of even shortened forms is still somewhat off-putting.

```cpp
template <int x>
using lit = std::integral_constant<int, x>;
```

Much more natural to write `5_lit`. And that's where this post come in.

# What's in a Literal
For an integer literal, we've seen that the `_lit` operator from the top of this post does not work. Thankfully the C++ standard committee recognized this oversight and provided an alternative user defined literal form, the [raw user defined integer literal][ud-literal], which takes the characters that make up the literal as template arguments.

```cpp
template <char... digits>
constexpr auto operator ""_raw() {
    return std::integer_sequence<char, digits...>{};
}
```

`digits` consist of the exact characters that make up the literal, which has some interesting ramifications when combined with the [different forms integer literals C++ supports][int-literals]. For starters, hex, octal, and binary literals include `0x`, `0`, and `0b` prefixes respectively:
 
```cpp
std::is_same<
    decltype(123_raw),
    std::integer_sequence<char, '7', '6', '2'>>;
    
std::is_same<
    decltype(0xF2bc_raw),
    std::integer_sequence<char, '0', 'x', 'F', '2' 'b', 'c'>>; 
```

And even digit separators `'` are included in the character data:

```cpp
std::is_same<
    decltype(5'9_raw),
    std::integer_sequence<char, '5', '\'', '9'>>; 
```

The compiler does ensure that only valid characters are included in a given integer literal, so you can't ever encounter a `9` in an octal literal or a `2` inside of binary literal. But if we want to support the standard correctly, we'll have to support all of these literal forms.

# Computing the Base and Getting the Digit Values
First off, let's get the raw literal characters into a more standardized format. Every integer literal is just a series of individual digits with integer values, along with the base of the numeral system being targeted.

`ParseNumber` takes raw literal data and identifies the numeral system using prefix, passing along the rest of the digits to `BaseAndDigits`.

```cpp
template <unsigned b, char... d>
struct BaseAndDigits {
    static constexpr unsigned base = b;
    using digits = typename GetDigits<
        std::integer_sequence<unsigned>,
        d...>::type;
};

template <char... digits>
struct ParseNumber : BaseAndDigits<10, digits...> { };

template <char... digits>
struct ParseNumber<'0', 'X', digits...> : BaseAndDigits<16, digits...> { };

template <char... digits>
struct ParseNumber<'0', 'x', digits...> : BaseAndDigits<16, digits...> { };

template <char... digits>
struct ParseNumber<'0', digits...> : BaseAndDigits<8, digits...> { };

template <char... digits>
struct ParseNumber<'0', 'b', digits...> : BaseAndDigits<2, digits...> { };

template <char... digits>
struct ParseNumber<'0', 'B', digits...> : BaseAndDigits<2, digits...> { };
```

This gets rid of the prefix, but the digits may still be hex characters or contain `'` digit separators. Here's where the `GetDigits` function comes in. `GetDigits` maps the raw character digits of the literal to a sequence of unsigned integer values. Separator characters are ignored while all other characters are converted numbers with `digit_to_value`.

```cpp
constexpr unsigned digit_to_value(char c) {
    if      (c >= 'a' && c <= 'f') return c - 'a' + 10;
    else if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    else if (c >= '0' && c <= '9') return c - '0';
    else                           throw std::invalid_argument("c");
}

template <typename digits, char...>
struct GetDigits {
    using type = digits;
};

template <unsigned... digits, char... xs>
struct GetDigits<std::integer_sequence<unsigned, digits...>, '\'', xs...> :
    GetDigits<
        std::integer_sequence<unsigned, existing...>,
        xs...> { };

template <unsigned... digits, char x, char... xs>
struct GetDigits<std::integer_sequence<unsigned, digits...>, x, xs...> :
    GetDigits<
        std::integer_sequence<unsigned, digits..., digit_to_value(x)>,
        xs...> { };
```

Again, the compiler ensures that the literal is valid before it ever reaches `digit_to_value`, so we do not have to worry about encountering hex digits in a binary literal or anything like that.  

Looking back at those literals from earlier, `ParseNumber` nicely standardizes the digits for all types of integer literals. 

```cpp
std::is_same<
    typename ParseNumber<decltype(762_raw)>::digits,
    std::integer_sequence<unsigned, 7, 6, 2>>;
    
std::is_same<
    typename ParseNumber<decltype(0xF2bc_raw)>::digits,
    std::integer_sequence<unsigned, 15, 2, 11, 12>>; 

std::is_same<
    typename ParseNumber<decltype(5'9_raw)>::digits,
    std::integer_sequence<unsigned, 5, 9>>; 
```


# Better Exponentiation Through Folding 
The last step is to combine digits back into an integer. A first attempt will probably look something like this:

```js
function number(base, digit1, digit2, ..., digitN) {
    return digit1 * pow(base, n - 0) +
        digit2 * pow(base, n - 1) + ... +
        digitn * pow(base, n - n);
}
```

Expanding `number` for a simple number we get:

```js
number(10/*base*/, 1, 2, 3) === (1 * 10 * 10) + (2 * 10) + (3);
```

The above expansion reveals that `number` can be more elegantly written with a fold, removing the need for `pow`:

```js
function number(base, digits...) {
    return fold(
        \sum c -> base * sum + c,
        digits...));
}
```

Back in C++, `ConstantFromString` is the top level function that converts raw literal characters to a `std::integral_constant`. It computes the base and digits with `GetBase` and then folds over the resulting `std::integer_sequence` of digits to reconstruct the original integer value. 

```cpp
template <typename T, char... values>
struct ConstantFromString {
    using number = GetBase<values...>;
    
    template <unsigned x, unsigned... xs>
    static constexpr unsigned long long fold(unsigned long sum, std::integer_sequence<unsigned, x, xs...>) {
        return fold(
            x + number::base * sum,
            std::integer_sequence<unsigned, xs...>{});
    }
    
    static constexpr unsigned long long fold(unsigned long sum, std::integer_sequence<unsigned>) {
        return sum;
    }
    
    using type = std::integral_constant<T,
        static_cast<T>(fold(typename number::digits{}))>;
};
```

And that's it.

We can use `ConstantFromString` to write a user defined operators for any kind of `std::integral_constant`:

```cpp
template <int8_t x>
using byte = std::integral_constant<int8_t, x>;

template <char... digits>
constexpr auto operator ""_b() {
    return typename ConstantFromString<typename byte<0>::value_type, digits...>::type{};
}
```

And easily use these values within expressions.

```cpp
auto val = expr * 0_b;
```

Expect a post shortly that uses `std::integral_constant` user defined literals for an interesting application.



[src]: https://gist.github.com/mattbierner/5c698972de0cdd9de86a


[int-literals]: http://en.cppreference.com/w/cpp/language/integer_literal
[ud-literal]: http://en.cppreference.com/w/cpp/language/user_literal