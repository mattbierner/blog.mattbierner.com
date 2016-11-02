---
layout: post
title: Pride and Parser Combinators, Part One
series: stupid_template_tricks
date: '2015-02-07'
---
It is a truth universally acknowledged, that a template metaprogrammer in possession of a domain specific language, must be in want of a compile time parser. However much a game of compile time [snake][nibbler] may be enjoyed by such a programmer, this truth is so well fixed, and the problem so pervasive, that it is about time we apply template metaprogramming to implement a compile time parser. 

{% include image.html file="protest-2.jpg" description="Begging pardon, Mr. Collins protested that he never parsed at compile time. Kitty stared at him, and Lydia exclaimed." %}

C++ compile time parsing. What kind of masochist would do that? Well, consider the humble `printf` statement. A "standard" compiler has no clue what the contents of the printf format string actually mean. A format string is a string formatting domain specific language, one that `printf` evaluates at runtime. That means that the type of the expected arguments are only known at runtime, and this, at best, results in unnecessary run time overhead. At worst, it can introduce fun bugs.

If we could parse the format string at compile time, we could determine the types of each expected argument, and use this information for type checking or to optimize the implementation. And modern compilers such as Clang do often implement such `printf` type checking. But what about custom domain specific languages? Sure, we could try extending the compiler again, but GCC isn't likely to accept a [Brainfuck][bf] source checker patch anytime soon. So instead, we'll write parsers using the magic of C++ template metaprogramming.


This post covers the first part of a simplified, but fairly powerful, library of compile time [parser combinators][parsercomb]. From a small set of core parser combinators, complex parsers can be constructed and run at compile time against programmer defined strings. The complete code is [available on Github][src] (including a sneak peek at part 2).

# Presenting the Parser Combinator
The C++ template system is a functional language, albeit one masked by layers or hideous syntax, so it makes sense to choose a functional approach to parsing. [Parser combinators][parser combinators] fit our needs perfectly. They are easy to implement, yet powerful and flexible, and they can provide good error reporting to boot. 

So, before descending into the madness that is C++ template metaprogramming, it may help to very briefly review the concepts behind parser combinators. Most of this post is based on [Bennu][bennu], a parser combinator library I wrote in Javascript, which itself is heavily based on [Parsec][parsec]. Check out either of those projects for more examples.

## Parsers
In the parser combinator model, a parser is just a function that maps an input state to a result.

```javascript
result parser(state) { ... }
```

Input state consists of:

* List of tokens to be parsed. A token can be anything, but, for string input, tokens are usually characters. To simplify this implementation, we'll only deal with string input and character tokens.
* Additional stream metadata, such as position within the stream. This is needed to generate human readable error messages.
* Optional user data. Arbitrary data that is threaded through parsers. Again, as a simplification, this post does not consider user data.

The result of a parser indicates if the parser failed or succeeded, along with a result value and result state. When a parser fails, the result value is usually a message describing why parsing failed. For successes, the result value could be anything, perhaps an AST fragment or some template data structure.

```javascript
// parse the character 'a'
result ParseA(state) {
    if (state.input[0] == 'a')
        return Success('a', state.next());
    else
        return Failure("Expected 'a'", state);
}
```

## Parser Combinators
Parser combinators, as the name suggests, are just higher order functions that compose parsers. They abstract over regular parsers with higher level, more declarative operations.

Some of these just abstract out common functionality that is duplicated in many parsers. Instead of writing a parser for each character, along the lines of `ParseA`, using parser combinators, we extract the concept of parsing a character to a reusable and declarative function.

```javascript
parser ParseChar(character) {
    return function(state) {
        if (state.input[0] == character)
            return Success(character, state.next());
        else
            return Failure("Expected 'a'", state);
    }
}
```

Parser combinators may also operate on parsers themselves, composing one or more parers together to create a parser with new behavior. The `Next` combinator for example runs parser `a`, then parser `b` if `a` succeeded.

```javascript
parser Next(a, b) {
    return function(state) {
        var aResult = a(state);
        
        if (aResult.type == Success)
            return b(aResult.state);
        else
            return aResult;
    }
}
```
 
## It's Functions All the Way Down
All this is not intended teach you everything you'll ever need to know about parsers and parser combinators, there are plenty of good tutorials out there that attempt that. The point is that parser combinators are not scary. They are just functions. But that's also what makes them so powerful.


# The Data Structures of the Fabulous Parser Combinator
Let's begin the process of translating the parser combinators concepts outlined above into a C++ metaprogram. And before even writing our first parser, we need to define a few template data structures for for the parse state, parse errors, and the input steam itself. 

{% include image.html file="1991-134-2_w.jpg" description="I always picture Mr. Darcy wearing these glasses, preferably also with the popped collar for maximum d-baggery." %}

## Compile Time Strings
C++ templates are a proud bunch. They don't associate with just any [string][template-string]:

```cpp
template <const char* myString>
struct Foo { };

Foo<"abc"> a { }; // compile error
```

No, templates only associate with the finest and purest strings; strings with external linkage.

```cpp
char abcString[] = "abc";
Foo<abcString> a { }; // ok
```

This pride comes at a fairly high programming and maintenance cost. But we want to be able to write code like `Foo<"abc">`, using string literals as the input to our parsers, as well as for compile time parse error messages.

Thankfully we can get around this limitation by encoding strings as types, storing their contents inside a `std::integer_sequence`.

```cpp
template <char... chars>
using stream = std::integer_sequence<char, chars...>;
```

Still, `stream` is not the most programmer friendly interface, as strings must be specified character by character:

```cpp
using hello_world = stream<'H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd', '!'>;
```

And that quickly becomes tedious. But a modern compiler can automatically split strings into characters using a user defined literal operator:

```cpp
template <typename T, T... chars>
constexpr stream<chars...> operator""_stream() { return { }; }
```

This user defined literal operator is not actually standard C++ but a GCC extension that Clang also supports. But a similar template syntax is standardized for raw numeric literals, so the lack of raw string user defined literals in C++14 is a pretty big inconsistency that I hope C++1z will resolve ([see N3599](http://open-std.org/JTC1/SC22/WG21/docs/papers/2013/n3599.html)).

Now we can write:

```cpp
using hello_world = decltype("Hello world!"_stream);
```

For functions, type inference replaces the need for `decltype`.

```cpp
template <char... chars, typename... Args>
void my_printf(stream<chars...>, Args&&... args) { ... };

my_printf("int=%d"_stream, 5);
```

## State
At a very minimum, the state of a parser must include the stream to parse, and a position in that stream for error reporting. A more complete parser combinator implementation would also allow specifying user data object on the state, but we'll omit that capability to simplify things a bit.
 
The position is used to generate human readable error messages. `Position` tracks an index in the original input stream.

```cpp
template <size_t i>
struct Position {
    static const size_t index = i;
    
    using next = Position<i + 1>;
};
```

We'll continue to use the `Printer` interface [used previously][life] to translate types to output at runtime.

```cpp
template <typename>
struct Printer;

template <size_t index>
struct Printer<Position<index>>
{
    static std::ostream& Print(std::ostream& output)
    {
        return output << "Position:" << index;
    }
};
```

The entire parser state then is just a `stream` and a `Position`:

```cpp
template <typename i, typename pos>
struct State {
    using input = i;
    using position = pos;
};
```

##  Results 
A parser takes a `State` and maps it to a result. The result captures three values: if parsing succeeded or failed, the result value, and the result state.

For our parser combinator implementation, there are actually three ways a parser can produce a value:

* `Success` - The parser succeeded and parsing should continue. 
* `Failure` - The parser failed but we can recover and retry.
* `Error` - The parser failed and we cannot recover.

The distinction between `Failure` and `Error` is important for producing good error messages and will be covered in more detail in part two.

```cpp
enum class ResultType
{
    Success,
    Failure,
    Error
};
```

The entire result structure:

```cpp
template <ResultType suc, typename x, typename s>
struct Result
{
    static const ResultType success = suc;
    using value = x;
    using state = s;
};
```

## Errors
Finally, we need objects that can encode errors and produce human readable error messages. For this simplified example, we'll only use a single error type, the expect error. 

`ExpectError` takes a position, the expected value, and the found value. 

```cpp
template <typename pos, typename expected, typename found>
struct ExpectError { };
```

When printing, expect errors produce messages like: `"At:3 Expected:a Found:b"`

```cpp
template <typename pos, typename expected, typename found>
struct Printer<ExpectError<pos, expected, found>>
{
    static std::ostream& Print(std::ostream& output)
    {
        output << "At:";
        Printer<pos>::Print(output) << " ";
        output << "Expected:";
        Printer<expected>::Print(output) << " ";
        output << "Found:";
        return Printer<found>::Print(output);
    }
};
```

# The Finest and Most Accomplished Combinatory Parsers
One aspect that makes parser combinators so easy to implement, is that we only need four or five primitive parsers. Then through composition, more complex and higher level combinators can be constructed. 

{% include image.html file="scan-6-3.jpeg" description="I am not altogether out of hopes, in some time, to suffer Mr. Darcy in my company, without the apprehensions I am yet under of his teeth or his claws. - Elizabeth Bennet" %}

## Always and Never
The `always` parser always produces a constant value. It does not alter the state or consume any input.

`always` is a template metafunction that takes a single parameter, `x`. The return value of `always` is the template structure `apply`. This inner template metafunction is the parser itself, mapping a parser state to a `Result`. `type` is the result of the inner parser metafunction.

```cpp
template <typename x>
struct always {
    template <typename state>
    struct apply {
        using type = Result<ResultType::Success, x, state>;
    };
};
```

`never` is the inverse of always. It also produces a constant value, but fails.

The pattern used for `always` to define `apply` is common enough that we can factor it out. `identity` creates a template metafunction that returns a constant value by binding its template argument to the `type` member.

```cpp
template <typename T>
struct identity {
    using type = T;
};
```

```cpp
template <typename x>
struct never {
    template <typename state>
    using apply = identity<Result<ResultType::Failure, x, state>>;
};
```

We can already run our parsers to test them out. The helper function `run_parser` invokes a parser with an input stream, creating the initial state, and extracting the result value.

```cpp
template <typename f, typename... args>
using call = typename f::template apply<args...>::type;

template <typename parser, typename input>
using parse = call<parser, input>;

template <typename parser, typename input>
using run_parser = typename parse<
    parser,
    State<input, Position<0>>>::value;
```

Testing out `always`, we'll use the `Value` type to encode values as types.

```cpp
template <typename T, T x>
struct Value { };

template <typename T, T x>
struct Printer<Value<T, x>>
{
    static std::ostream& Print(std::ostream& output)
    {
        return output << std::boolalpha << x;
    }
};
```

```cpp
using p = always<Value<int, 3>>;
using result = run_parser<p, decltype("abc"_stream)>;

Printer<result>::Print(std::cout) // 3
```

## Bind
Now let's implement our first combinator. We'll implement a monadic interface for our core parser combinators, and there some are advantages and disadvantages to this decision. The sequencing monadic `bind` operation is more powerful than we need in most cases, but it is easy to work with.

`bind` takes a parser `p` and a metafunction `f`.

```cpp
template <typename p, typename f>
struct bind {
    /* andThen */

    template <typename input>
    struct apply {
       /* bind apply */
    };
};
```

When invoked, `bind` first runs `p` with the passed in state. If `p` fails, the parser returns the failure result. But if `p` succeeds, the `bind` invokes `f` with the result value of `p` to get the next parser to run. This parser is then invoked with the result state of `p`.

```cpp
template <typename p, typename f>
struct bind {
    /* andThen */
 
    template <typename s>
    struct apply {
        using result = parse<p, s>;
        
        using type = typename std::conditional<
            (result::success == ResultType::Success),
            andThen<result>,
            identity<result>>::type::type;
            
    };
};
```

The actual sequencing on success happens in the `andThen` metafunction.

```cpp
template <typename result>
    struct andThen {
        using nextParser = call<f, typename result::value>;
        using type = parser<nextParser, typename result::state>;
    };
```

The parser `p` can be any parser. The function `f` must be a metafunction, a structure that defines an `apply` template structure that returns the next parser to run 

```cpp
struct addOne {
    template <typename val>
    using apply = identity<
        always<
            Value<
                typename val::type,
                val::value + 1>>>
};

using p = bind<always<Value<int, 2>>, addOne>;
using result = run_parser<p, decltype(""_stream)>;

Printer<result>::Print(std::cout) // 3
```

But if the parser `p` fails, `f` is never invoked. 

```cpp
using p = bind<never<Value<int, -1>>, addOne>;
using result = run_parser<p, decltype(""_stream)>;

Printer<result>::Print(std::cout) // -1
```

To handle failure, we'll take a look at the `Either` combinator in part two.

## Next
`next` is a special case of `bind` that is useful for unconditional sequencing. For `next`, the function in `bind` always returns the same value, regardless of the output from parser `p`.

```cpp
template <typename T>
struct constant {
    template <typename...>
    using apply = identity<T>;
};

template <typename p, typename q>
struct next : bind<p, constant<q>> { };
```

# Consumption
You may have noticed that none the parsers defined so far actually parse anything. They are really more of generic computations. To start actually matching and consuming input, we need the `token` primitive.

{% include image.html file="Thomson-PP17-1.jpg" description="The plumage and mating habits of the common yahoo." %}

## Token
`token` is a primitive that matches tokens and advances the input stream. While `token` is probably the most complicated part of this post, it is easily understood by breaking it down into small pieces of functionality.

`token` tests the head character of the input stream using a predicate function. When this predicate returns true, we advance the input stream by one and return the previous head of the stream. When it returns false, we do not touch the parser state and instead produce an error result. 

The implementation of `token`  takes two parameters, `test` and `error`. `test` is the metapredicate that tests if the token at the head of input stream should be consumed. `error` is meta function invoked with the head of the input stream when `test` fails, returning a human readable error message describing why the match failed.
 
```cpp
template <typename test, typename error>
struct token {
    /* token apply */

    template <typename s>
    using apply = _token_apply<test, s, typename s::input, error>;
};
```

There are two cases where `token` may fail. The simplest is when the input stream is empty, which will be the base case of the `_token_apply` specialization.

```cpp
template <typename test, typename s, typename input, typename error>
struct _token_apply {
    using type = Result<
        ResultType::Failure,
        call<error, typename s::position, decltype("eof"_stream)>,
        s>;
};
```

When the input stream is not empty, we have to test the head of the input stream. This is obtained using partial template specialization. Then, depending on the result of `test`, we produce the correct result value and state. Success advances the input stream by one while failure leaves the state untouched but invokes `error`.

```cpp
template <typename test, typename s, char c, char... input, typename error>
struct _token_apply<test, s, stream<c, input...>, error> {
    static const bool shouldConsume = test::template apply<c>::value;
    
    using type = std::conditional_t<shouldConsume,
        Result<
            ResultType::Success,
            Value<char, c>,
            State<stream<input...>, typename s::position::next>>,
        Result<
            ResultType::Failure,
            call<error, typename s::position, Value<char, c>>,
            s>>;
};
```

`token` is the basis for all consuming parsers.

## Character
The `character` parser is the simplest application of token, using an equality predicate to determine if an input character should be consumed.

```cpp
template <typename T, T a>
struct equals {
    template <T b>
    struct apply : std::integral_constant<bool, a == b> { };
};

template <char c>
struct character : token<equals<char, c>, characterError<c>> { };
```

When the match fails, `character` produces an error message indicating the expected value along with the actual value:

```cpp
template <char c>
struct characterError {
    template <typename pos, typename val>
    struct apply {
        using type = ExpectError<pos, Value<char, c>, val>;
    };
};
```

```cpp
using r1 = run_parser<character<'x'>, decltype("x"_stream)>;
Printer<r1>::Print(std::cout) // x

using r2 = run_parser<character<'x'>, decltype(""_stream)>;
Printer<r2>::Print(std::cout) // At:0 Expected:x Found:eof

using r3 = run_parser<character<'x'>, decltype("a"_stream)>;
Printer<r3>::Print(std::cout) // At:0 Expected:x Found:a
```

## Character Range
Character range matches any character in a range.

```cpp
template<char begin, char end>
struct characterRange : token<inRange<begin, end>, characterRangeError> { };

template<char begin, char end>
struct inRange {
    template <char tok>
    struct apply :
        std::integral_constant<bool,
            tok >= begin && tok <= end> { };
};
```

The error message indicates the expected range of characters.

```cpp
template<char begin, char end>
struct characterRangeError {
    template <typename pos, typename val>
    struct apply {
        using type = ExpectError<pos, stream<begin, '-', end>, val>;
    };
};
```

We can use `characterRange` to define parsers for common character sets, such as digits and letters.

```cpp
struct anyDigit : characterRange<'0', '9'> { };
```

## Eof
`token` works well for matching the head of the input, but sometimes we also need to match against empty inputs. For example, to ensure that all input has been consumed once a parser has run.

`eof` matches when the input stream is empty.

```cpp
struct None { };

struct eof {
    template <typename s>
    struct apply {
        using type = std::conditional_t<s::input::size() == 0,
            Result<
                ResultType::Success,
                None,
                s>,
            Result<
                ResultType::Failure,
                ExpectError<
                    typename s::position,
                    decltype("eof"_stream),
                    typename s::input>,
                s>
            >;
    };
};
```


# Next Time
Next time, we'll take a look at the `either` primitive, along with some useful choice and sequencing combinators. Using these parsers, we'll implement a compile time parser for a real world domain specific language, [Apple's auto format visual layout language][visual-format] .


[src]: https://github.com/mattbierner/stt-parser-combinators
[template-string]: http://www.comeaucomputing.com/techtalk/templates/#stringliteral
[bf]: /stupid-template-tricks-brainfuck-compile-time-evaluator/

[life]: /stupid-template-tricks-the-life-comonadic/
[nibbler]: /stupid-template-tricks-snake/


[visual-format]: https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/AutolayoutPG/VisualFormatLanguage/VisualFormatLanguage.html

[parsercomb]: https://en.wikipedia.org/wiki/Parser_combinator
[bennu]: http://bennu-js.com
[parsec]: https://hackage.haskell.org/package/parsec
