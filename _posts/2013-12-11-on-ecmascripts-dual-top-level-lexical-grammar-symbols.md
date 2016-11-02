---
layout: post
title: On ECMAScript’s Dual Top Level Lexical Grammar Symbols
date: '2013-12-11'
---
ECMAScript defines two top level grammar symbols, one for division operators and one for regular expression literals. This choice has a few major consequences, and makes implementing the language more difficult than it should be.

Based on my work developing [Parse-ECMA][parse-ecma], ECMAScript 5.1 parser combinators in Javascript, I overview three possible ways to handle these dual lexical symbols, along with the benefits and drawbacks of each solution.

# The ‘/‘ Symbol and ECMAScript

ECMAScript uses the `/` symbol in four ways:

* Comments: `// TEXT` and `/*TEXT*/`.
* Division operator: `a / b`.
* Division assignment operator: `a /= b`.
* Regular expression delimiters: `/REGEXP/`. Empty regular expression literals are not allowed, `//` is lexed to a single line comment.  

Context sensitive productions are common in programming language grammars and usually cause no problem. They can make the language more consistent, simplify the grammar, and make life easier for programmers.

Indeed, ECMAScript lexers can unambiguously distinguish comments from division operators or regular expression literals by peeking at the next symbol. If it is either `/` or `*`, the current token must be a comment. But a lexer cannot distinguish division expressions from regular expression literals the same way. 

Consider the program: `a / b / g`. Should this be tokenized: `[Id(‘a’), Div, Id(‘b’), Div, Id(‘g’)]` or `[Id(‘a’), RegExp(‘b’, ‘g’)]`? Both tokenizations are valid lexically, but the second is invalid ECMAScript. Even an infinite lookahead lexer can’t distinguish the two.

## InputElementDiv and InputElementRegExp
[ECMAScript 5.1][ecmascript-spec] determines meaning of a `/` symbol by its grammatical context:

> There are two goal symbols for the lexical grammar. The InputElementDiv symbol is used in those syntactic grammar contexts where a leading division (/) or division-assignment (/=) operator is permitted. The InputElementRegExp symbol is used in other syntactic grammar contexts.
>
> -ECMAScript 5.1 spec, Section 7

These two top-level symbols are:

```
InputElementDiv ::
    WhiteSpace
    LineTerminator
    Comment
    Token
    DivPunctuator

InputElementRegExp ::
    WhiteSpace
    LineTerminator
    Comment
    Token
    RegularExpressionLiteral
```

Some of the rational behind this bizarre decision is touched on in an old [Mozilla Javascript 2 design document][mozilla-rational].

## No Single Valid Top Level Lexing
In consequence, the tokenization of ECMAScript code can only be determined by parsing the code to detect the context of `/` symbols. This unnecessarily complicates the language implementer’s work. The lexer and parser must be tightly integrated or, at the very least, the lexer must use additional logic to guess the context when it encounters `/` symbols.

Further complicating the problem, both `InputElementDiv` and `InputElementRegExp` may be used in the same expression, such as `/a/g / /c/g` which is correctly tokenized to: `[RegExp(‘a’, ‘g'), DIV, 'RegExp(‘c’, ‘g’)]`. Thankfully, there are no contexts where both `InputElementDiv` and `InputElementRegExp` are valid:

> There are no syntactic grammar contexts where both a leading division or division-assignment, and a leading RegularExpressionLiteral are permitted. This is not affected by semicolon insertion
>
> -ECMAScript 5.1 spec, Section 7

Attempting to parse with one tokenization and then the other will always find the single valid tokenization if one exists. 

# Solutions

My initial thought was to always lex using `InputElementDiv` and create a parser production to recognize regular expressions. This does not work. Consider: `/“/`. This is a perfectly valid regular expression literal but lexing using `InputElementDiv` will always fail. The lexer matches the start of the string `”/` and expects to find a `“`.

## Check Previous Token
By far the most simple solution is to embed additional logic in the lexer that guesses the context when `/` is encountered. Checking the previous token is a good approximation.

There are a lot of cases to cover and elements like whitespace, line terminators, and multiline comments have to be considered. [Thom Blake’s stackoverflow solution][stackoverflow-solution] should work for almost all sane programs, and even JSLint’s check against `(,=:[!&|?{};` will work for the most common cases.

## Composed Parser and Lexer
Working with parser combinators, instead of building separate parsers for the lexer and parser, we can compose the lexer parsers to build the parser parsers. The resulting parsers take a stream of characters and output an AST. 

This composition is easy for simple languages. Take an example languages consisting of three elements: single letter identifiers, division expressions, and regular expressions literals with optional flags. The composed parsers are:

```js
// Complete code available:
// https://gist.github.com/mattbierner/7896721

// Tokenizers
var idToken = letter;

var divToken = character('/');

var regularExpressionToken = binds(
    enumeration(
        between(character('/'), character('/'),
            eager <| many1(letter)),
        optional('', letter)),
    \body, flag -> always('/' + body +'/' + flag));

// Parser
expr = rec <| \expr -> {
    var id = idToken;
    
    var regExp = bind(
        regularExpressionToken,
        \r -> always( ‘[‘ + r + ‘]’ ));
    
    var primaryExpression = either(regExp, id);
    
    var div = binds(
        enumeration(
            attempt <| then(
                primaryExpression,
                divToken),
            expr),
        \l, r -> always( ‘[‘ + l + ' / ' + r + ‘]’ ));
    
    return either(
        div,
        primaryExpression);
};
```

The token stream can be recovered by modifying the parsers to save tokens into the parser state.

Correctly and efficiently composing the lexers and parsers is challenging. Whitespace and line terminators must be handled, and it is more difficult to generate meaningful error messages. A naive implementation backtracks excessively. 

One small example is discriminating between keyword `true`, keyword `try`, and identifier `try2`. `true` and `try` require lexing `tr` twice, and without additional checks, the try statement parser may match `try` in `try2` and then fail, even though statements like `try2 + 2;` are valid. It is much easier to identify and handle these cases with separate lexers operating on characters and parses operating on tokens.

## Lazily Generated Streams of Tokens 
[Parse-ECMA][parse-ecma] solves the problem by running parsers against a lazily constructed token stream. Parsers take a character stream and use a custom `ParserState` to retrieve tokens on demand. Parsing assumes a division context, and the context can be manually switched for specific productions.

#### Tokenization
The `tokenizer` parser takes a character stream and outputs the first useful token resulting from parser `token`. Whitespace, line terminators, and comments are striped: 

```js
var tokenizer = \token -> let
    followLineTerminator = \x ->
        always(!x ? null : Object.create(x, {
            'loc': { 'value': x.loc },
            'value': { 'value': x.value },
            'lineTerminator': { 'value': true }
        }))
in  
    rec(\self -> let
        onLineTerminator = bind(
            next(many(lexer.lineTerminator), self),
            followLineTerminator)
    in
        choice(
            eof,
            bind(lexer.comment, \x ->
                (x.value.indexOf('\n') !== -1 ?
                    onLineTerminator :
                    self)),
            next(lexer.whitespace, self),
            next(lexer.lineTerminator, onLineTerminator),
            token));

```

Since line terminators are sometimes significant in ECMAScript, tokens following line terminators are marked.

Lexers for the top-level two productions are defined:

```js
var inputElementDiv = tokenizer(lexer.tokenDiv);

var inputElementRegExp = tokenizer(lexer.tokenRegExp);
```

#### ParserState
`ParserState` manages the token stream. It takes a character stream and calculates the first token of the stream using a div lexing (this assumption is safe since the start of a regular expression literal can be lexed to a div). `ParserState.prototype.asRegExp` retokenizes the character stream using the regular expression tokenizer.

```js
var ParserState = function(input, pos, first, rest) {
    // input is the character stream
    parse.ParserState.call(this, input, pos);

    this._first = first; // first token
    this._rest = rest; // rest of character stream after first token
};
ParserState.prototype = new parse.ParserState;
```

To handle failed lexings, such as running against input like `”unclosed string`, the ParserState must always know the first token in the stream:

```js
ParserState.prototype.first = \() -> this._first;
```

`ParserState.prototype.next` advances the token stream. It is wired so that lex errors are returned into the parser using `parse.never`.

```js
ParserState.prototype.next = \tok -> {
    var self = this;
    
    return parse.parseState(
        inputElementDiv,
        new parse.ParserState(self._rest, end),
        \x, state -> let
            s = new ParserState(
                (x === null ? stream.end : self._rest),
                state.position,
                x,
                state.input)
            in \_, m, cok, _, _, _ -> cok(tok, s, m),
        parse.never);
};
```

Finally, the `ParserState.prototype.asRegExpState` method switches to a regular expression token stream:

```js
ParserState.prototype.asRegExp = \tok -> {
    var self = this;
    return parse.parseState(
        inputElementRegExp,
        new parse.ParserState(self.input, self._prevEnd),
        \x, state ->
            parse.setParserState(
                new ParserState(
                    (x === null ? stream.end : self.input),
                    state.position,
                    x,
                    state.input)),
        parse.never);
};
```

#### Regular Expression Parser
The regular expression literal parser manually switches into the regular expression context. When parser fails, the old state is safely restored.

```js
var regularExpressionLiteral = next(
    bind(getParserState, \state -> state.asRegExp()), 
    token.regularExpressionLiteral);
```

# Closing Thoughts
Building a parser by composing the lexer parsers seems to be the best solution to the problem, although it introduces its own complications. The logic used by Parse-ECMA feels overly complex, although it handles most edge cases correctly. In the future, I probably will rewrite Parse-ECMA to use the previous token check which, although only an approximate solution, seems to handle all common cases correctly. 


[ecmascript-spec]: http://www.ecma-international.org/publications/standards/Ecma-262.htm
[parse-ecma]: https://github.com/mattbierner/parse-ecma
[mozilla-rational]: http://www-archive.mozilla.org/js/language/js20-2002-04/rationale/syntax.html
[stackoverflow-solution]: http://stackoverflow.com/a/11766233/306149 
