---
layout: post
title: The Delimited Continuation Monad in Javascript
date: '2014-02-02'
---
[Atum][atum] expresses control flow using continuations, and at the heart of Atum is the delimited continuation monad. This post overviews continuations in Atum and covers the implementation of the delimited continuation monad in Javascript.

# Continuations and The Continuation Monad
Most programming languages have some concept of control flow, and the continuation is a useful abstraction to model this program control flow. Simplified, a continuation is a value that captures the remainder of a computation. Languages like [Scheme][scheme-callcc] even give the programmer access to a program's current continuation. 

But the [ECMAScript 5.1][ecma51] language spec never mentions continuations. So why use them in Atum? All other common control flow elements, such as iteration and conditionals, can be built from the continuation primitive. Furthermore, continuations allow the control flow of a program to be captured and modified, a very useful feature for debugging and tooling.

## Continuation Passing Style
It is still possible to program using continuation control flow in languages like Javascript that lack first class continuations. Continuation passing style (CPS) programming threads explicit continuations through computations. 

A CPS factorial function in Javascript is easy to implement:
 
```js
var fac = function(n, k) {
    return (n === 0 ?
        k(1) :
        fac(n - 1, function(x) {
            return k(n * x);
        }));
};

fac(10, function(x) { return x; });
```

Javascript programmers usually encode their continuations using the language's first class functions. However, the continuation is just an abstract representation. It is possible to implement continuations in languages without first class functions, as demonstrated by this example using [defunctionalized continuations][defun] : 

```js
var appk = function(k, x) {
    switch (k[0]) {
    case 'done':    return x;
    case 'fac':     return appk(k[2], k[1] * x);
    }
}

var fac = function(n, k) {
    return (n === 0 ?
        appk(k, 1) :
        fac(n - 1, ['fac', n, k]));
};

fac(10, ['done']);
```

## CPS Interpreter
A simple interpreter using CPS may look something like this:

```js
var eval = function(node, k) {
    switch (node.type) {
    case 'Number': 
        return k(node.value); 
        
    case 'Add':
        return eval(node.left, function(l) {
            return eval(node.right, function(r) {
                return k(l + r);
            });
        });
    
    /* ...snip... */
    }
};

eval({
    'type': "Add",
    'left': { 'type': "Number", 'value': 10},
    'right': {
        'type': "Add",
        'left': { 'type': "Number", 'value': 2},
        'right': { 'type': "Number", 'value': 4},
    },
}, function(x) { return x; });
```

## Continuation Monad
Direct CPS interpreters hardcode many assumptions and are difficult to modify. Continuations are also too low level and verbose for many applications. The [continuation monad][cont-monad] provides an interface to express continuation based computations while hiding the implementation details.

The continuation monad is defined by two functions: `just` injects a value into the monadic context and `bind` sequences two computations, where the second computation depends on the output of the first. 

```js
/// Pass value `x` though the continuation.
var just = function(x) {
    return function(k) {
        return k(x);
    };
};

/// Take a computation `c`, and function `f`. Pass results of
/// computation `c` to `f` and run the computation `f` returns. 
var bind = function(c, f) {
    return function(k) {
        return c(function(x) {
            return f(x)(k);
        });
    };
};
```

Two other monad interface functions are also useful. `abrupt` aborts a computation with a value by not calling the continuation.

```js
var abrupt = function(x) {
    return function(/*k*/) {
        return x;
    };
};
```

`callcc` behaves like its [Scheme counterpart][scheme-callcc], reifying the current continuation to a first class function and externalizing control flow by passing the reified continuation to a function `f`. `f` can return a computation or call the continuation.

```js
var reify = function(k) {
    return function(x) {
        return function(/*k*/) { return k(x); };
    };
};

var callcc = function(f) {
    return function(k) {
        return f(reify(k))(k);
    };
};
```

Rewriting the interpreter to use the continuation monad:

```js
var run = function(c, k) {
    return c(k);
};

var map = function(node) {
    switch (node.type) {
    case 'Number': 
        return just(node.value); 
        
    case 'Add':
        return bind(map(node.left), function(l) {
            return bind(map(node.right), function(r) {
                return just(l + r);
            });
        });
    
    /* ...snip... */
    }
};

run(map({
    'type': "Add",
    'left': { 'type': "Number", 'value': 10},
    'right': {
        'type': "Add",
        'left': { 'type': "Number", 'value': 2},
        'right': { 'type': "Number", 'value': 4},
    },
}), function(x) { return x; });
```

## What The Continuation Monad Gets Us
The continuation monad standardizes an interface on which more complex combinators can be constructed:

```js
var binary = function(left, right, f) {
    return bind(left, function(l) {
        return bind(right, function(r) {
            return f(l, r);
        });
    });
};

var add = function(left, right) {
    return binary(
        left,
        right,
        function(l, r) { return just(l + r); });
};
```

It also keeps the details of how continuations are implemented out of the abstract program control flow logic. Defunctionalizing the continuations would only require updating the continuation monad, not replacing every instance of `k(...)` like in the CPS interpreter. 


# Delimited Continuations

Regular continuations are powerful enough to implement most programming languages, but they have some importantly limitations.

The regular continuation represents the remainder of a computation in its entirety, evaluation is all or nothing. True first class continuations (but not CPS) cannot even return values. How could they? Evaluating the continuation evaluates the rest of the program, so where would the value be returned? This greatly restricts the usefulness of continuations. 

## Delimited Continuations Overview
Smart people in the eighties and nineties solved this problem with delimited continuations. Delimited continuations capture the continuation of a subcomputation, breaking a program's monolithic `callcc` type continuation into a stack of delimited continuations. Delimited continuations can return values and can be composed.

The [Scheme wiki][scheme-wiki] has a good introduction to delimited continuation control flow. 

# The Delimited Continuation Monad

Atum uses delimited computations with a monadic interface for control flow. The Atum code and examples given here are based on *[A Monadic Framework for Delimited Continuations][monadic-framework]*.

This implementation uses prompts to delimit computations in a control stack. Four basic operation define the delimitated continuation API.

## The Control Stack
The control stack is a ordered list of control segments and prompts that delimit the stack. 

```js
/// Control segment
var Seg = function(f) {
    this.frame = f;
};

/// Control stack delimter
var P = function(t) {
    this.prompt = t;
};
```

The stack itself is represented using a [Nu][nu] stream, with the top of the stack as the first element. The basic control stack operations are:

```js
/// Push a prompt identified by `t` onto control stack `k`.
var pushP = function(t, k) {
    return stream.cons(new P(t), k);
};

/// Push a segment for function `f` onto control stack `k`.
var pushSeg = function(f, k) {
    return stream.cons(new Seg(f), k);
};

/// Join a slice of a control stack `sub` onto control stack `k`.
var pushSeq = stream.append;
```

`splitSeq` is what gives deliminated continuations their power. It takes a control stack `k` and some prompt `t`, and splits the stack around prompt `t`. The result is two control stacks: that occurring before `t` and that occurring after.

```js
var empty = stream.NIL;

var splitSeq = function(t, k) {
    if (stream.isEmpty(k)) return [empty, empty];
    
    var top = stream.first(k),
        rest = stream.rest(k);
        
    // See if we found the split point.
    if (top instanceof P && top.prompt === t)
        return [empty, rest];
    
    // Otherwise continue search on rest of stack
    var sub = splitSeq(t, rest);
    return [stream.cons(top, sub[0]), sub[1]];
}; 
```

## Applying Delimited Continuations 

The continuation (control stack) is no longer a function. `appk` evaluates a continuation `k` with some value `x`:

```js
var appk = function(k, x) {
    do {
        // This is not required. It allows the top level
        // continuation passed in to the Atum interpreter
        // to be a regular function
        if (typeof k === 'function')
            return k(x);
        
        // Find and apply the next frame from the stack.
        var top = stream.first(k);
        if (top instanceof Seg)
            // Actual frame evaluation
            return top.frame(x)(stream.rest(k));
        else if (top instanceof P) 
            k = stream.rest(k);
        else
            k = top;
    } while(true);
};
```

`just` from the continuation monad is updated to use `appk` to apply its continuation:

```js
var just = function(x) {
    return function(k) {
        return appk(k, x);
    };
};
```

And `bind` is updated to push control segments onto the stack:

```js
var bind = function(c, f) {
    return function(k) {
        return c(pushSeg(f, k));
    };
};
```

## Running
Delimited continuations calculations are run by passing in the initial delimited control stack. `run` runs a calculation `c` with a Javascript function `k` as the top level continuation:

```js
var run = function(c, k) {
    return c(cons(k, NIL));
};
```

```js
run(
    bind(just(2), function(x) {
        return just([x, x]);
    }),
    function(x){ return x; }); // [2, 2]
```


## Delimited Continuation Monad API

The delimited continuation monad uses four primitive functions to delimit computations.

`newPrompt` creates a new, unique prompt. The Atum implementation gets this from the computation state, but since I have not discussed state yet, I omitted that part of the implementation here.

```js
var newPrompt = function(k) {
    return appk(
        k,
        /* get unique prompt from state */);
};
```

`pushPrompt` delimites the stack. It pushes `prompt` onto the stack and evaluates computation `c` with the new stack.

```js
var pushPrompt = function(prompt, c) {
    return function(k) {
        return c(pushP(prompt, k));
    };
};
```

`withSubCont` captures a continuation delimited by `prompt`. This captured continuation is passed to function `f`, similar to `callcc`. The result of function `f` is evaluated in the remainder of the control stack.

```js
var withSubCont = function(prompt, f) {
    return function(k) {
        var sub = splitSeq(prompt, k);
        return f(sub[0])(sub[1]);
    };
};
```

Finally, `pushSubCont` pushs an entire sub continuation `subk` onto the stack and evaluates computation `c` with this new stack.

```js
var pushSubCont = function(subk, c) {
    return function(ctx, k) {
        return c(ctx, pushSeq(subk, k));
    };
};
```

## Shift and Reset

Many delimited continuations implementations do not use prompts, but the `shift` and `reset` control operators. `shift` is broadly similar to `pushPrompt`  while `reset` is like `withSubCont`, but `shift` and `reset` use implicit prompts defined by where these operators appear in a program. 

Atum does not entirely support implicit prompts, but does provide a passable `shift` and `reset` implementation. 

`reset` delimits a continuation, passing function `f` the name of the prompt doing the delimiting. This creates an enclosed computation.

```js
var reset = function(f) {
    return bind(newPrompt, function(p) {
        return pushPrompt(p, f(p));
    });
};
```

`shift` captures the continuation delimited by prompt `p`. `p` is usually a value passed to the `f` from `reset`.

```js
var shift = function(p, f) {
    return withSubCont(p, function(k) {
        return pushPrompt(p, f(function(c) {
            return pushPrompt(p, pushSubCont(k, c));
        }));
    });
};
```

## Callcc from Delimited Continuation

Finally, the semantics of `callcc` are useful, even when working with delimited continuations. Here is `callcc` from the continuation monad implemented for delimited continuations:

```js
var callcc = (function(){
    // Passes `f` the top level continuation.
    var withCont = function(f) {
        return withSubCont(0, function(k) {
            return pushPrompt(0, f(k));
        });
    };
    
    // Abort a computation by not calling any continuation
    var abort = function(e) {
        return withCont(function(k) { return e; });
    };
    
    // Reify continuation `k` to a first class function
    var reify = function(k) {
        return function(x) {
            return abort(pushSubCont(k, just(x)))(k);
        };
    };
    
    return function(f) {
        return withCont(function(k) {
            return pushSubCont(k, f(reify(k)));
        });
    };
}());
```



[atum]: https://github.com/mattbierner/atum
[nu]: https://github.com/mattbierner/nu
[scheme-callcc]: http://community.schemewiki.org/?call-with-current-continuation
[ecma51]: http://www.ecma-international.org/ecma-262/5.1/
[defun]: http://www.ii.uni.wroc.pl/~dabi/publications/LOPSTR03/biernacki-danvy-lopstr03.pdf
[cont-monad]: http://hackage.haskell.org/package/mtl-1.1.0.2/docs/Control-Monad-Cont.html
[scheme-wiki]: http://community.schemewiki.org/?composable-continuations-tutorial
[monadic-framework]: http://www.cs.indiana.edu/~dyb/pubs/monadicDC.pdf
