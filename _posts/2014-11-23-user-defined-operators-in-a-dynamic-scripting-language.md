---
layout: post
title: Parsing User Defined Operator Expressions in a Scripting Language
date: '2014-11-23'
---
One thing that's always bugged me about Javascript is the language's treatment of operators. Javascript operators, like their C and Java ancestors, are hardcoded into the language. The `*` operator always multiplies two numbers and is always parsed the same way.

Javascript operators are special too. They get to use cool symbols with punctuator characters, can be used in infix notation, and have attached parsing properties, such as precedence and associatively. So why can't I access this aspect of the language, or use any of these neat expressive powers?

{% include image.html file="Screen_Shot_2014_11_19_at_10_11_08_PM.png" %}

Many *script languages I've studied add new operators to Javascript, and this is what I originally did with [Khepri][khepri]. But that sucks. Just adding more operators doesn't fix the core problem. If anything, is only made me want user defined operators even more. So with [Khepri][khepri] V1.0 in May 2014, I extended the language with user defined operators.

Implementing user defined operators in a scripting languages presents some interesting design challenges that I hope to summarize in this post. Specifically, I'll take a look at parsing operator expressions with user defined operators. Building a good parser for a language with user defined operators turns out to be the biggest implementation challenge, since, once the evaluator is set to work on an AST, user defined ops can be treated almost exactly like function calls.

I'll lay out some ideal goals and demonstrate why building a parser that meets these ideals is a challenge by presenting the failings of a few potential solutions, before detailing the somewhat more scaled back approach I settled on in Khepri. 

# Javascript
{% include image.html file="Screen_Shot_2014_11_19_at_10_11_49_PM.png" %}

Let's start by reviewing operators in vanilla Javascript. A Javascript operator has two components:

* Grammatical rules that describe how expressions with the operator are parsed.
* Semantics that determines how operator expressions are evaluated.

Operator syntax and semantics are hardcoded by the [Javascript specification][ecma5]. Javascript has no facility to define new operators, or even change the behavior of existing operators like you can in C++ or Python, a failing I find both inconsistent and unnecessary.


## Javascript Operator Semantics
Javascript operators can be semantically grouped into three classes:

* Arithmetic operators (`+`, `<`, ...) - Functions that map input to output.
* Logical operators (`&&`, `?`, ...) - Arithmetic operators that also effect the evaluation of their input. These are more like macros, function that operate on expression themselves instead of values. 
* State operators (`=`, `++`, `*=`, ...) - Operations that alter program state.

Of these three classes, arithmetic operators are perhaps the most interesting, as they directly correspond to regular function calls. And functions and function calls are already a programmer customizable behavior in Javascript. Also, a proper language wouldn't even have the other two classes.

So for simplicity, I will only really consider arithmetic operators in the post and assume that programers specify the behavior of operators much as they do when defining a function.

```js
// Specifying the behavior of a normal identifier
var concat := \x y -> x.concat(y);

// And of an operator
var (+|+) := \x y -> x.concat(y);


// Arithmetic operators are basically function call sugar
[1] +|+ [2, 3]

// translates to:
concat([1], [2, 3]);
```

## Javascript Operator Syntax
But Javascript operators are in one important way more than just sugary function calls. Operators have special grammatical rules that determine how operator expressions parsed and the order of evaluation of their terms.

All three classes of Javascript pperators follow two grammatical guidelines:

* Unary operators use prefix notation and are right associative: `!a`, `void ~ a` (the exception being the postfix `++` and `--` ops). All unary operators have the same precedence, with lower precedence than function calls.
* Binary operators use infix notation: `a + b`, `a + b * c`. Like in mathematics, Javascript evaluates infix operator expressions according to operator associativity and precedence rules.

#### Precedence
Infix operator [precedence][precedence] determines the grouping of subexpressions, and therefore their order of evaluation, in an expression consisting of multiple terms connected by multiple operators.

Precedence is a relative property. To parse an expression of three terms connected by two operators, such as `a + b * c`, the relative precedences of `*` and `+` determines grouping and order of evaluation. Lower precedence operator expressions are evaluated first: 

```js
// Given the input
a + b * c

// Parsing if precedence `*` < precedence `+`
a + (b * c)

// Parsing if precedence `+` < precedence `*`
(a + b) * c
```

#### Associativity
Infix operator [associativity][associativity] determines how terms connected by operators of uniform precedence are grouped. An expression with three terms connected by a single operator, such as `a + b + c`, has two potential parsings depending on the associativity of the `+` operator:

```js
// Given the input
a + b + c

// Parsing if `+` is left-associative
(a + b) + c     

// Parsing if `+` is right-associative
a + (b + b)
```

Associativity applies even if the operators connecting the terms differ, so long as they all have the same precedence.

```js
// `+` and `-` have the same precedence and are both left-associative
(a + b) + c
```

Together, precedence and associativity are the important factors that distinguish Javascript's arithmetic operators from simple function call syntactic sugar. The expression `add(mul(a, b), c)` will always parsed and evaluated the same way. But `a * b + c` has two valid parsing depending on the properties of the operators. 

It is also important to note that precedence and associativity are compile time properties that are fully separate from the semantics of an operator. A parser must be able to convert an operator expression into a valid AST that encodes the order of evaluation of its terms. After parsing, precedence and associativity no longer matter.

# Infix Operator Parsing Challenges

{% include image.html file="Screen_Shot_2014_11_19_at_9_59_55_PM.png" %}

Now that we've seen what Javascript offers, let's consider the ideal solution. For me, an ideal scripting language would combine the best of regular identifiers and Javascript style hardcoded operators by:

1. Making operators first class citizens of language.
2. Having operators follow the same rules as other symbols, such as scoping.
3. Allowing full control of infix operator precedence and associativity.

It turns out that implementing such flexible user defined operator support is difficult to accomplish elegantly. Specifically, building a parser that supports fully configurable precedence while also fulfilling the other goals is hard.

So before covering Khepri's somewhat scaled back approach to user defined operators, let's look at two attempts to implement the above goals and the problems we run into.

# Pushing Infix Operator Semantics into the Parser
{% include image.html file="Screen_Shot_2014_11_19_at_10_01_18_PM.png" %}

Let's start by designing a parser for an example scripting language that supports full control over operator precedence. For such as language, a parser must be able to determine the proper grouping of *n* terms connected by *n - 1* operators. And to do this, all it needs to know are the relative precedences and the associativities of each operator it encounters while parsing an expression.

That all sounds easy enough. But we also want to write a clean language implementation. The language parser should be as simple as possible to support tooling, and the parser and evaluator should be separate from one another. 

## Parsing
Like many well established languages, our example scripting language (pseudo Khepri) uses a preprocessor / parsing directive to attach precedence and associativity metadata to an operator. 

```js
// Tell the parser the precedence of the `+|+` operator
INFIX 8 (+|+);

// Define the `+|+` operator
var (+|+) = \a b -> [a, b];

1 + 2 +|+ 3 + 4; // ((1 + 2) +|+ (3 + 4))
```

A vanilla [Javascript parser][parse-ecma-expr] hard codes all the operator metadata information. But now it is dynamic. Dynamic in the sense that two identical expressions in different locations may be parsed differently, depending on the local operator properties.  Lexical scoping of operator metadata lets us determine the correct parsing entirely by static code analysis.

The most simple way to implement dynamic operator precedence is to include an operator table in the parse state. This table stores valid operators and their metadata. And because it is part of the parse state instead of encoded in the grammatical rules themselves, we can update the table during parsing.

The `INFIX` keyword update the operator table. This pseudo code using [Bennu][bennu] parsers should give the general idea:

```js
var infixKeywordParser := next(
    keyword 'INFIX',
    binds(
        enumeration(
            integer,
            between(punctuator '(', punctuator ')',
                identifier)),
        \precedence id ->
            modifyState \ table ->
                table.set(id, precedence)));
```

Then when an operator expression is encountered, the parser consults its metadata table to determine the grouping of operations.

```
var binaryExpressionParser :=
    getState \ table ->
        sepByPairs(table.operators, term) // Get both term and op
            .chain \ terms ->
                group(terms, table); // `group` terms according to preceded table. 
```

In this case, the `group` operation can be a simple [shunting-yard algorithm](http://en.wikipedia.org/wiki/Shunting-yard_algorithm). Encoding the shunting yard logic in the grammar rules is also possible.  

## Scoping
Things are looking pretty good! With just a few simple additions we've got custom operators and grouping using custom precedence data. But closer examination reveals that we've failed goals one and two. 

If an operator is just a symbol, it should follow the same rules as regular identifier symbols. This includes scoping:

```js
// A more complex expression with local redefinition 
INFIX 8 (+|+);
var (+|+) = ...;
{
    INFIX 0 (+|+),
    1 + 2 +|+ 3 + 4; // (1 + (2 +|+ 3)) + 4
}
1 + 2 +|+ 3 + 4; // ((1 + 2) +|+ (3 + 4))
```

The operator table as currently defined is a flat, global list of all operators encountered up to the current statement. So for the above program, the parser as currently defined enters the block, updates the local precedence entry for `+|+`, exits the block, and proceeds to parse all further instances of `+|+` as having precedence 0.

So what if we turn our operator table into a stack of operator tables, one for each scope? That will allow parsing the above program correctly. Let's teach our parser about scope:

```js
var pushScope := modifyState \ table ->
    cons(emptyTable, table);
    
var popScope := modifyState \ table ->
    cdr(table);
    
var modifyScope := \k v ->
    modifyState \ table ->
        table.set(k, v);
```

The parser must know that blocks, functions, let expression, and many more elements all introduce new scopes:

```js
var block := seq(
    puctuator '{',
    pushScope,
    bodyParser,
    popScope,
    puctuator '}');
```

But scope is something a parser shouldn't have to know about. Scope is semantics. With this approach, we end up duplicating the semantics in both the parser and the evaluator, which means duplicated testing and a less flexible language implementation. Not to mention how much more complicated it makes the parser implementation itself.


# Extending Semantics With Order of Evaluation
{% include image.html file="Screen_Shot_2014_11_19_at_10_03_57_PM.png" %}

It's clear that we can't extend the parser with semantics cleanly. But what if we could somehow instead make the order of evaluation decision for an operator expression in the evaluator itself?

## Parsing and Evaluation
One way that this can be accomplished is by deferring aspects of expression parsing until evaluation, and extending the semantics of operator expressions to also understand order of evaluation.

For this approach, we need a dumber parser. Instead of trying to group terms together and build a nice AST, the parser will just output a flat list of terms and operators. No grouping information required!

```js
var binaryExpressionParser :=
    sepByPairs(operator, term); // Get both term and op as list
```

Then in the evaluator, operator expression semantics now also must determine the order of evaluation of the expression's constituent terms. But unlike the previous example, we can reuse the evaluator's existing semantic logic for scope and other language features to help us.

```js
var operatorExpressionSemantics := \terms ->
    getOperatorTable // get op metadata table from state
        .chain \ table -> 
            evaluate(group(table, terms)); // group terms using table
```


## More Problems
This is a definite improvement over the first approach yet, once again, there are clearly major problems.

By moving syntax rules into the evaluator, the language ASTs fail to  capture the semantics of operator expressions, instead producing flat lists of operators and terms that can only be understood by the evaluator. With this approach, the proper parsing of an expression can only be determined by understanding the semantics of the program where it appears. It's the same basic problem as in the first approach.  

The inability to produce a clean AST is a big downside for tooling and language extension. Consider a static type or value checking system layered on a language. Such a tool would not be able to deduce how an expression will be evaluated, and therefore what the argument types to the operators will be, unless it knows all the semantics of the language. Even simple things like syntax highlighting or symbol definition lookup require tools to know a lot about the semantics of the language. 


# Deriving Precedence From Symbols During Parsing
{% include image.html file="Screen_Shot_2014_11_19_at_10_06_18_PM.png" %}

The main failing of these two approaches is that both blur the line between parser and evaluator. And if we hope to meet the three original goals, at least in their most general interpretations, I'm not sure there is a better way than versions of these.

But if we are willing to restrict the form of user defined operators , and  derive operator properties from the operator symbols themselves instead of the context in which they appear, we can easily meet the other two goals.

## Prefix Precedence

A vanilla Javascript parser knows the precedences of all Javascript operators. Essentially, it can lookup operator metadata in a table with the operator symbol as the key. To add support for user defined operators, instead of a direct key lookup, we simply extend the parser to use a mapping function, one that maps user defined operator symbols to some a standardized set of operator metadata entries defined by the language specification.

[OCaml][ocaml] is one language that uses this mapping approach. The language specifies precedence and associativity metadata for a small set of builtin symbols, and determines the precedence and associativity of user defined operator by matching the prefix of the custom operator against the set of builtin operator symbols. [F#][f#] takes a similar approach, as does Khepri.

```js
// Define a new operator `+>`.
// Since the prefix of this is the addition operator `+`,
// `+>` has the precedence and associativity of the `+` operator.
var (+>) = ...;

a +> b +> c * 2; // (a +> b) + (c * 2)
```

Mapping schemes like prefix precedence allow us to correctly and easily parse user define operator expressions without having to consider elements like scope that are part of the semantics of the language. Even better, implementating this scheme is fairly easy.

The downside is that operators in a prefix precedence scheme must start with a builtin operator and cannot fully control their properties (On this latter point, restricting precedence may actually be a positive for program clarify).


# User Defined Operator In Khepri
{% include image.html file="Screen_Shot_2014_11_19_at_10_08_41_PM.png" %}

[User defined operators in Khepri][khepri-udo] were designed with the following goals:

* To behave much the same as builtin operators, including having different associativities and precedences. You can curry, flip, and convert user operators to functions using the standard Khepri syntax.
* Not be special. Khepri operators can appear almost anywhere an identifier can, including package imports and exports, deeply nested unpacks, and function parameter lists.
* Follow the same semantics rules as identifiers. Khepri user defined operators are nothing more than function call sugar. Like identifiers, user operators are lexically scoped, and the compiler performs the same sanity checks and optimizations (including inlining) on user operators as on identifiers.


## Base Operators
Khepri user defined operators use prefix precedence based on the vanilla Javascript operators. Both infix and prefix Khepri user defined operator symbols must start with one of the builtin Khepri operators, from which infix operators derive their precedence and associativity (prefix operators all have the same precedence).

Unfortunately, unlike F# and OCaml, Khepri is built on top of an existing language, Javascript. This results in some inconstancies around operators, such as the `<` and `<<` operators having different precedences despite sharing the `<` prefix. 

A user defined prefix operator must start with one of: `~`, `!`, `++`, `--`, followed by zero or more of the characters: `?+-*/%|&^<>=!~@`

A user defined infix operator must start with a builtin Khepri infix [operator](Symbols-and-Operators), followed by zero or more of the characters: `?+-*/%|&^<>=!~@`.

A user defined infix operator may not be: `->`, `-|`, `|-` which have a special meaning in the language. But you can use ops like `->-` or `-|+`.

The following builtin operators may be extended:
* `+`
* `-`
* `*`
* `/`
* `%`
* `&&` // user ops cannot short circuit 
* `||`
* `??`
* `<<`
* `>>`
* `>>>`
* `<=`
* `<`
* `>=`
* `>`
* `===`
* `!==`
* `==`
* `!=`
* `&`
* `|`
* `^`
* `|>`
* `<|`
* `\>`
* `\>>`
* `<\`
* `<<\`

## Parser implementation

The main change required to parse user defined operators in a [Khepri parser](https://github.com/mattbierner/khepri-parse/blob/master/lib/parse/expression_parser.kep) compared with a [vinilla Javascript Parser][parse-ecma-expr] is that the lexer produces operator tokens with an additional `base` property that denotes which operator the user defined operator is derived from. All precedence computations in the parser are based on the `base` of the operator instead of its actual symbol.


# Conclusion

User defined operators are a powerful, expressive feature that I wish Javascript supported. While implementing total flexibility in how operators are parsed quickly runs into trouble, with a few smart restrictions on user defined operators, they turn out to be surprisingly easy to implement, while retaining most of their expressive power.

{% include image.html file="Screen_Shot_2014_11_19_at_10_10_52_PM.png" %}


[associativity]: https://en.wikipedia.org/wiki/Operator_associativity
[precedence]: https://en.wikipedia.org/wiki/Order_of_operations

[parse-ecma-expr]: https://github.com/mattbierner/parse-ecma/blob/master/lib/parse/expression_parser.kep

[ocaml]: http://caml.inria.fr/pub/docs/manual-ocaml/expr.html#sec138
[f#]: http://msdn.microsoft.com/en-us/library/dd233228.aspx
[ecma5]: http://www.ecma-international.org/publications/standards/Ecma-262.htm

[khepri]: http://khepri-lang.com
[khepri-udo]: https://github.com/mattbierner/khepri/wiki/User-Defined-Operators
[bennu]: https://github.com/mattbierner/bennu