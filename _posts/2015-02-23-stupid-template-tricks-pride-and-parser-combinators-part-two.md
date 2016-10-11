---
layout: post
title: Pride and Parser Combinators, Part Two
series: stupid_template_tricks
date: '2015-02-23 07:55:27'
---
[Previously][part1], we started work on a small C++ template compiletime, parser combinator library. We covered compile time strings, parser data structures, a few basic combinators, and parsers that consume input.

This time around, we'll continue to create a more complete library of compile time parser combinators. We'll take a look at some choice, sequencing, and iteration combinators. Using these combinators, we will implement a basic compile time validator for Apple's [visual format][visual-format] domain specific language. 

{% include image.html file="dance.jpg" description="You got some choice moves Darcy. Shit, a bitch usually gotta drop a whole fuckin' pile of King Georges to get a show that good!" %} 

The complete source can be found on [Github][src]. Let's get started.

## Choice
Try to describe any structured language and chances are that you will use the word 'or' at least a few times. But 'or' is not something our current parser library understands. Every parser currently has (with the exception of character level behavior) a single valid path, there is no way to express choice.

{% include image.html file="250px-Thompson-PP-Wickham.jpg" description="Have you seen the new addition to the Guggenheim? I did that. And it didn't take very long either - George Wickham" %}

### Either
`either` is the choice primitive combinator. Given two parsers, `p` and `q`, it attempts to parse `p` first and, if `p` fails, it runs `q`. The result is either the success result of `p` or the (success or failure) result of `q`.

``` cpp
template <typename p, typename q>
struct either {
    template <typename s>
    struct apply {
        using result = parse<p, s>;
        
        using type = call<
            std::conditional_t<result::success == ResultType::Failure,
                q,
                constant<result>>,
            s>;
    };
};
```

Remember back in part one we defined the `ResultType` enumeration with three states: `Success`, `Failure`, and `Error`. It is important to note here that the `either` combinator only runs `q` if `p` fails with a `ResultType::Failure`, not with a `ResultType::Error`. `ResultType::Error` is effectively an unhandleable  error that halts parsing, something we'll use later to implement better error messaging.

``` cpp
using p = either<
    character<'a'>,
    character<'b'>>;
    
run_parser<p, decltype("a"_stream)>; // a
run_parser<p, decltype("b"_stream)>; // b
run_parser<p, decltype("c"_stream)>; // Error: expected 'b' found 'c'
```

The error message in the third example could be improved. A more complete library would check if both `p` and `q` fail, and intelligently combine the error messages into something more meaningful. It could be as simple as joining the two messages together or more complex such as looking at which parser consumed the most before failing.

### Optional
Another common application of parser choice is optional parsing. An integer parser for example would parse an optional minus sign before parsing the whole number.

The `optional` parser tries to run parer `p`, or returns a constant value `def`.

``` cpp
template <typename p, typename def = None>
struct optional : either< p, always<def>> { };
```

### Choice
Nesting `either` parsers creates a choice between more than two parsers. But nesting decreases code readability and makes code harder to maintain.

``` cpp
using letter = either<
    character<'a'>,
    either<
        character<'b'>,
        either<
            character<'c'>,
            ...>>>;
```
    
We'll use the `choice` combinator to build this nesting for us by folding a parameter list with `either`.

The `fold` metafunction applies template function `f` to a list of parameters. The base case is when a single parameter of the list remains.

``` cpp
template <typename f, typename z, typename...>
struct fold {
    using type = z;
};
```

When two or more parameters are in the list, `fold` applies `f` to the first two (`z` and `x`) to produce a new accumulated value. This is fed back into `fold`, along with the rest of the parmeter list `xs`.

``` cpp
template <typename f, typename z, typename x, typename... xs>
struct fold<f, z, x, xs...> {
    using type = typename fold<f, call<f, z, x>, xs...>::type;
};
```

Now, to implement `choice`, we might first try writing something like `fold<either, ...>`. Compiler error. `fold` expects `f` to be a function with an apply member, not a template.

`mfunc` converts a template to a template function with an `apply` member. 

``` cpp
template <template <typename...> class f>
struct mfunc {
    template <typename... args>
    using apply = identity<f<args...>>;
};
```

Bringing this all together, `choice` is simply a `fold` of `mfunc<either>` over a list of one or more parser parameters.

``` cpp
template <typename option, typename... options>
struct choice :
    fold<mfunc<either>, option, options...>::type { };
```

And all that complex nesting becomes a flat list of choices.

``` cpp
using letter = choice<
    character<'a'>,
    character<'b'>,
    character<'c'>,
    ...>;
```

### Backtracking and Commitment
[Bennu][] and [Parsec][] both use an attempt based parsing model. This means that if a parser consumes any input, it commits and cannot [backtrack][backtracking] if parsing later fails. The lack of default backtracking is somewhat unintuitive behavior for many new programmers.

Consider a simple `either` parser that parses the string `'ab'` or `'ac'`. In an attempt based model without backtracking by default, if `p` consumes any input `q` will never be run.

```js
// Bennu either behavior
var abOrAc = either(
    next(character 'a', character 'b'),
    next(character 'a', character 'c'));

run(abOrAc, 'ab'); // ok    
run(abOrAc, 'ac'); // fail, consumes 'a' then fails matching 'b'
                         // with no backtracking.
``` 

Instead, backtracking is handled explicitly by wrapping parsers in an `attempt`. 

```js
// Bennu backtracking either
var abOrAc = either(
    attempt(
        next(character 'a', character 'b')),
    next(character 'a', character 'c'));

run(abOrAc, 'ab'); // ok    
run(abOrAc, 'ac'); // ok
``` 

Determining where a complex parser should backtrack can be difficult.

So for this small library, we'll use a different commitment model based on explicit commits. In this model, all parsers backtrack unless we tell them not to with an explicit commit. This can make writing parsers significantly easier and can also simplify error messaging.

The `commit` primitive wraps a parser `p`. If `p` fails, it transforms the result into an `ResultType::Error`. 

``` cpp
template <typename p>
struct commit {
    template <typename s>
    struct apply {
        using result = parse<p, s>;
        
        using type = Result<
            (result::success == ResultType::Failure
                ? ResultType::Error
                : result::success),
            typename result::value,
            typename result::state>;
    };
};
```

`ResultType::Error` results are not handled by the `either` combinator, or any of the other combinators we will use, so it effectively halts parsing. 

Explicit commits are easier than attempts to understand in my opinion, and very useful for generating more meaningful error messages.


## Iterative Parsers
Try writing an integer parser using our current library of combinators. Sure, the `anyDigit` parser can match individual digits of the number and we can even chain together optional `anyDigit` parsers with `next`.

``` cpp
using numberParser = next<
    anyDigit,
    optional<None, next<
        anyDigit,
        optional<None, next<
            anyDigit,
            ....>>>>; 
```

But no. That doesn't look quite right. We could use a recursive parser definition, but that's a bit more than we really need here. We just want an ordered list of the numbers that make up the integer. Here's where iterative combinators come into play. 
 
{% include image.html file="pnpcebrockbw22.jpg" description="Submit to the biomass Elisabeth, and your suffering will end - Mr. Darcy's proposition" %}

### Cons
The `many` combinator applies a parser zero or more times until it fails, building the results into a list. Consider the operation of `many` step by step.

First, `many` tries running the input parser `p`. If `p` fails, that's all well and good, `many` just returns an empty list. But if `p` succeeds, we now have the first element of the result list. Back to step one. It's a simple recursive call.

We repeat this process, constructing the list from front to back, until `p` eventually does fail. Now, we don't actually have a list at the moment, only the elements of that list, and we are currently deeply inside some recursive call where we've effectively found the end of the list.

So as we step out of each recursive call to `many`, we cons elements onto the result list, back to front, to build the final result list. If we can implement a parser that conses elements together, implementing `many` will be easy.

The cons parser takes two parsers, `p` and `q`. It runs parser `p` first to get the head of the list and stores this off somewhere. Then it run parser `q` to get the rest of the list. After both the results of `p` and `q` are available, the head from `p` is consed onto the rest of the list from `q` to build the result list.

`liftM2` generalizes the combinator of two parsers using a function such as cons. It combines the results of parsers `p` and `q` with binary metafunction `f` by nesting `bind` parsers to create closures. 

``` cpp
template <typename p, typename q, typename f>
struct liftM2 {
    struct inner1 {
        template <typename x>
        struct apply {
            struct inner2 {
                template <typename y>
                using apply = identity<always<typename call<f, x, y>::type>>;
            };
            using type = bind<q, inner2>;
        };
    };

    template <typename s>
    using apply = identity<parse<bind<p, inner1>, s>>;
};
```

The `cons` parser itself is just a lifted version of the `cons` operation.

``` cpp
template <typename a, typename b>
struct consParser : liftM2<a, b, mfunc<cons>> { };
```

### Many
Using `consParser`, many is extremely simple to implement and exactly follows the above description of its behavior.

```cpp
template <typename p>
struct many :
    either<
        consParser<p, many<p>>,
        always<List<>>> { };
```

``` cpp
using p = many<character<'a'>>;
    
run_parser<p, decltype("a"_stream)>; // List of: 'a'
run_parser<p, decltype(""_stream)>; // Empty list
run_parser<p, decltype("x"_stream)>; // Empty list
run_parser<p, decltype("aaa"_stream)>; // List of: 'a', 'a', 'a'
run_parser<p, decltype("aaxa"_stream)>; // List of: 'a', 'a'
```

### Many1
Perhaps we want to ensure that `p` is run at least once. `many1` runs `p` one or more times until it fails.

```cpp
template <typename p>
struct many1 : consParser<p, many<p>> { };
```

``` cpp
using p = many<character<'a'>>;
    
run_parser<p, decltype("a"_stream)>; // List of: 'a'
run_parser<p, decltype(""_stream)>; // Error, expected 'a' found eof
run_parser<p, decltype("x"_stream)>; // Error, expected 'a' found 'x'
run_parser<p, decltype("aaa"_stream)>; // List of: 'a', 'a', 'a'
run_parser<p, decltype("aaxa"_stream)>; // List of: 'a', 'a'
```

### Sep
`many` is useful on its own and also allows us to build new, more declarative combinators. The `sepBy` combinators are useful for parsing things like comma separated lists where each value is separated by some token.  

``` cpp
template <typename sep, typename p>
struct sepBy1 : consParser<p, many<next<sep, p>>> { };
```

`sepBy1` expects at least one value.

``` cpp
using p = sepBy1<character<','>, character<'a'>>;
    
run_parser<p, decltype("a"_stream)>; // List of: 'a'
run_parser<p, decltype(""_stream)>; // Error, expected 'a' found eof
run_parser<p, decltype(","_stream)>; // Error, expected 'a' found ','
run_parser<p, decltype("a,aa"_stream)>; // List of: 'a', 'a'
run_parser<p, decltype("a,x"_stream)>; // List of: 'a'
```

`sepBy` expect at zero or more values.

``` cpp
template <typename sep, typename p>
struct sepBy :
    either<
        sepBy1<sep, p>,
        always<List<>>> { };
```

``` cpp
using p = sepBy<character<','>, character<'a'>>;
    
run_parser<p, decltype("a"_stream)>; // List of: 'a'
run_parser<p, decltype(""_stream)>; // Empty list
run_parser<p, decltype(","_stream)>; // Empty list 
run_parser<p, decltype("x"_stream)>; //  Empty list 
run_parser<p, decltype("a,aa"_stream)>; // List of: 'a', 'a'
```

## Sequencing
Let's now revisit basic parser sequencing and use what we have learned to build a few more useful combinators.

{% include image.html file="wickham-5.jpg" description="Yes, two solariums! Quite a find.... And, I... have horses, too. - George Wickham " %}

### Seq
Much like how `choice` applies `either` to a list of parsers, `seq` applies `next` to a list of parsers. The resulting parser runs the list of input parsers in order until one fails or all succeed.

```cpp
template <typename option, typename... options>
struct seq :
    fold<mfunc<next>, option, options...>::type { };
```

### String
`seq` lets us parse strings of characters more easily. The `string` parser matches zero or more characters in order, and produces the entire string as a result if parsing succeeded. 

``` cpp
template <char... elements>
struct string : seq<
    character<elements>...,
    always<stream<elements...>>> { };
```

`string` will backtrack if parsing fails partway though a string.

``` cpp
using abOrAc = either<
    string<'a', 'b'>,
    string<'a', 'c'>>;
    
run_parser<abOrAc, decltype("ab"_stream)>; // ab
run_parser<abOrAc, decltype("ac"_stream)>; // ac
```

While this is usually the expected behavior, sometimes we want parsing to fail if the string is not matched fully. The `commitedString` combinator will produce an error if the first character of a string is matched and then matching any further character fails.

``` cpp
template <char first, char... state>
struct commitedString : seq<
    character<first>,
    commit<character<state>>...,
    always<stream<first, state...>>> { };
```

``` cpp
using abOrAc = either<
    commitedString<'a', 'b'>,
    commitedString<'a', 'c'>>;
    
run_parser<abOrAc, decltype("ab"_stream)>; // ab
run_parser<abOrAc, decltype("ac"_stream)>; // Error, expected 'b' found 'c'
```

### Then
The `then` combinator is the inverse of the `next` combinator. It also runs two parsers `p` and `q` in order, but it returns the result from the first parser `p` and discards the result from `q`.

``` cpp
template <typename p, typename q>
struct then {
    struct andThen {
        template <typename result>
        using apply = identity<next<q, always<result>>>;
    };
    
    template <typename input>
    using apply = identity<parse<bind<p, andThen>, input>>;
};
```

### Between
We can use `then` to construct the `between` parser. `between` takes three parsers `open`, `close`, and `body` and runs them in the order: `open`, `body`, `close`. It returns the result from `body`.

``` cpp
template <typename open, typename close, typename body>
struct between : next<open, then<body, close>> { };
```

``` cpp
using numberArray = between<character<'['>, character<']'>,
    many<anyDigit>>;

run_parser<numberArray, decltype("[]"_stream)>; // Empty list
run_parser<numberArray, decltype("[1]"_stream)>; // List of: 1
run_parser<numberArray, decltype("[1330]"_stream)>; // List of: 1, 3, 3, 0
```


## Parsing Visual Format Strings
Apple's visual format language is a small domain specific language that specifies constraints that are used to position and size views. The visual format language allows multiple constraints to be specified clearly and concisely. But there's one big problem with the Objective-C implementation Apple uses, it's evaluated at runtime.

```objectivec
[NSLayoutConstraint
        constraintsWithVisualFormat:@"H:|[list(==200][content(>=300)]|"
        options:0
        metrics:nil
        views:views]
```

The closing paren on the `list` size constraint is missing.

Compile. Everything checks out. After all, our visual format specification is just a string. The compiler has no clue what the visual format language is.

Run. An exception is thrown when `NSLayoutConstraint` attempts to parse the visual format string.

Runtime evaluation of visual format strings is inconvenient for programmers and wastes runtime cycles performing a static computation.

### The Parser
With just standard C++ language features and our small library of parser combinators, we can declaratively express a parser for visual format stings.

The actual implementation is an almost direct translation of the [visual format grammar][visual-format].

``` cpp
namespace VisualFormat {

struct orientation : choice<character<'H'>, character<'V'>> { };

struct superview : character<'|'> { };

struct relation : choice<
    commitedString<'=', '='>,
    commitedString<'<', '='>,
    commitedString<'>', '='>> { };

struct positiveNumber : many1<anyDigit> { };

struct number :
    consParser<
        optional<character<'-'>>,
        positiveNumber>  { };

struct name : many1<anyLetter> { };

struct priority : choice<name, number> { };

struct constant : choice<name, number> { };

struct objectOfPredicate : choice<constant, name> { };

struct predicate : seq<
    optional<relation>,
    objectOfPredicate,
    optional<next<character<'@'>, commit<priority>>>> { };

struct predicateListWithParens :
    between<character<'('>, commit<character<')'>>,
        commit<sepBy1<character<','>, predicate>>> { };

struct simplePredicate : choice<
    name,
    positiveNumber> { };

struct predicateList : choice<
    simplePredicate,
    predicateListWithParens> { };

struct connection : choice<
    between<character<'-'>, commit<character<'-'>>,
        predicateList>,
    character<'-'>,
    always<None>> { };

struct view :
    between<character<'['>, commit<character<']'>>,
        commit<next<
            name,
            optional<predicateListWithParens, List<>>>>> { };

struct visualFormatString : seq<
    optional<then<orientation, commit<character<':'>>>>,
    optional<next<superview, connection>>,
    view,
    many<next<connection, view>>,
    optional<then<connection, superview>>,
    eof,
    always<decltype("Format string is valid"_stream)>> { };

} // VisualFormat
```

### Test
Let's run test our parser against that invalid format string.  

```
int main(int argc, const char* argv[])
{
    using x = run_parser<
        VisualFormat::visualFormatString,         
        decltype("H:|[list(==200][content(>=300)]|"_stream)>;
    
    Printer<x>::Print(std::cout);

    return 0;
}
```

As expected, the result is the clear and concise error message: `'At:Position:14 Expected:) Found:]'`.

Add the missing paren and the result is, `'Format string is valid'`.


## Limitations and Further Work
This post only outlines a basic parser combinator library. Many important simplications have been made, including two key ones relevant to validating visual format strings.

### Compile Time Error Messaging.
In the above program, the parsing and validation of the visual format string all happens at compiletime, but printing the error message happens at runtime. Obviously, this is not the desired behavior.

We could easily add a `static_assert` that checks that if a parser completed successfully. But that still leaves outputting our meaningful error message. For some reason entirely beyond my comprehension, `static_assert` only takes string literals. We can't even pass in a `constexpr`.

A more complete implementation would check that the the visual format parser completed successfully or print an error message at compile time indicating why parsing failed. We would basically implement another specialization similar to `Printer` that constructs compile time strings and then output these strings somehow. I'm still not sure what the most readable approach to outputting the error message as a compiler error would be.  

### Representation Construction
Another big simplification is that we only check if the format string is valid. No representations of the contents of the format string are constructed.

For the visual format language, it is easy to imagine a compile time parser that translates visual format strings into template data structures. These visual format structures could then be translated into very efficient runtime data structures and operations.

[src]: https://github.com/mattbierner/stt-parser-combinators
[template-string]: http://www.comeaucomputing.com/techtalk/templates/#stringliteral
[bf]: /stupid-template-tricks-brainfuck-compile-time-evaluator/

[life]: /stupid-template-tricks-the-life-comonadic/
[nibbler]: /stupid-template-tricks-snake/


[visual-format]: https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/AutolayoutPG/VisualFormatLanguage/VisualFormatLanguage.html

[parsercomb]: http://en.wikipedia.org/wiki/Parser_combinator
[bennu]: http://bennu-js.com
[parsec]: https://hackage.haskell.org/package/parsec
[backtracking]: http://en.wikipedia.org/wiki/Backtracking

[part1]: /stupid-template-tricks-pride-and-parser-combinators-part-one/
