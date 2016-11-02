---
layout: post
title: Declarative Environments
date: '2014-03-01'
---
The ECMAScript5.1 interpreter I have detailed so far is little more than a calculator. Now, using the [state monad][state] and [references][references], we will add basic support for environments to the interpreter. 

I overview ECMAScript 5.1 environments before discussing [Atum's][atum] declarative environment implementation. This covers a lot of code, but I've tried to simplify and break code into manageable pieces.

The result is an interpreter with basic environment support, allowing variables to be bound and mutated. Support for scopes is also added, but will not be used until functions are implemented.


# Overview
ECMAScript defines two classes of environments. Declarative environments (10.2.1.1) store bindings in an environment record. This is the standard type of environment found in many programming languages, and I'm only going to cover declarative environments in this post. Object environments (10.2.1.2) store bindings on a hosted object. I'll cover object environments later, as they are used by `with` statements and for the global environment.

Environments bind/map identifiers to values. Most programming languages also have some concept of scope, which defines the subset of valid bindings at a given point in a program. Scoping often stores multiple environments in a stack or linked list, with language elements like curly brackets pushing and popping environments onto and off of the stack.

## Immutable Binding Environment
In simple languages with only immutable bindings, all bindings can be stored in the current environment. When a new scope is entered, a new environment is pushed onto the environment stack and we copy all of the old bindings into the new environment. Likewise, exiting a scope pops an environment off the stack, restoring the previous environment and all of its bindings.

```js
// Top level environment, block scope JS
// Annotated to show top level env

var a = 1       // [(a, 1)]
var b = 2       // [(b, 2), (a, 1)]
{
    var c = 10  // [(c, 10), (b, 2), (a, 1)]
    var b = 3   // [(b, 3), (c, 10), (b, 2), (a, 1)]
    a = b * c   // [(b, 3), (c, 10), (b, 2), (a, 30)]
}
a // 1          // [(b, 2), (a, 1)]
b // 2          // [(b, 2), (a, 1)]
c // undefined  // [(b, 2), (a, 1)]
```

Without additional logic however, this will not work properly with mutable bindings. Since bindings are copied, the `a` mutation inside the block would not be seen once the block is exited. 

## Dynamic Scoping
A refined approach is to maintain a single copy of each unique binding. We still use an environment stack, but instead of coping bindings, environment operations like lookups delegate to lower environments in the stack until finding their target.

An environment operation may change any environment in the stack. Mutating `a` for example, skips past the top environment and updates the `a` binding in the outer environment.

```js
// Basic Env Stack, block scope JS
// Annotated to show stack

var a = 1       // [[(a, 1)]]
var b = 2       // [[(b, 2), (a, 1)]]
{
    var c = 10  // [[(c, 10)], [(b, 2), (a, 1)]]
    var b = 3   // [[(b, 3), (c, 10)], [(b, 2), (a, 1)]]
    a = b * c   // [[[(b, 3), (c, 10)], [(b, 2), (a, 30)]]
}
a // 30         // [(b, 2), (a, 30)]
b // 2          // [(b, 2), (a, 30)]
c // undefined  // [(b, 2), (a, 30)]
```

This mutates `a` correctly, but it doesn't do what we want for function calls.

A function call pushes a new environment onto the stack. And since the stack is used to delegate lookups from higher levels, the calling environment of the function will be visible in the function body. This is a rough version of [dynamic scoping][dynamic].

```js
// Env stack, block scope JS 

function f() { return a; };

{
    var a = 1;
    f() // 1
}
{
    var a = 2;
    f() // 2
}
```

## Lexical Scoping
A lexical scoping binding is determined by where it appears in the program source, instead of where it is evaluated. The current environment still holds a set of active bindings, but it delegates to the environment in which it was defined. This may or may not be the previous environment in the execution environment stack. Though it does not have block scoping, this is how ECMAScript environments work.

```js
// lexical scope, block scope JS 

var a = 10
function f() { return a; };

{
    var a = 1;
    f() // 10
}
{
    a = 2;
    f() // 2
}
```

Each ECMAScript environment holds a reference to a parent/enclosing environment. Multiple chains of environment may exist in a program, creating a [spaghetti stack][spaghetti]. 

Function calls push an environment onto the environment stack, but the new environment delegates to the environment in which the function was defined. We can create closures by allowing functions to capture their defining environment. 

## Atum Environment Overview
Both declarative and object environments in Atum implement the `Environment` interface. Environments hold a set of binding and a reference to a parent/outer environment, creating chains of environments. Environment chains are [persistent data structures][persistent] and, since any environment in a chain may be mutated and a single environment may be a member of multiple chains, [references][references] must be used.

ECMAScript identifiers resolve to environment references, which are [internal references][references] to values stored in environments. The [arithmetic operations][lifting] must be updated to handle internal references correctly.

The current environment is held in the ECMAScript computation context. A library of computation to query and update environments will be defined. The semantics of ECMAScript will be expressed using the environment operations.


# Environment Interface
Declarative and object environments both extend and implement the `Environment` interface ([source](https://github.com/mattbierner/atum/blob/master/lib/context/environment.js)).

```js
var Environment = record.declare(null, [
    'outer',    // Nullable reference to enclosing environment.
    'record']); // Bindings.
```

Environments are stored using references, so all environment operations must map to computations instead of direct values.

## Queries
Environment objects themselves only have methods to query and update their own bindings. The environment operations for chains of environments will be defined later using these methods.

```js
/// Computation returning does this environment have binding for `name`.
Environment.prototype.hasOwnBinding = function(name) { };

/// Computation that returns the bound value for `name`.
Environment.prototype.getBindingValue = function(name) { };
```

## Updates
Mutation operations change an environment. This updates the value stored in memory for the reference to the environment. The `ref` parameter is the reference to the environment that the operation is called on.

```js
/// Computation to set a binding for `name` in this environment.
Environment.prototype.setMutableBinding = function(ref, name, value) { };

/// Computation to create a new immutable binding for `name` in the environment.
Environment.prototype.putImmutableBinding = function(ref, name, value) { };

/// Computation to delete the binding for `name` in the environment.
Environment.prototype.deleteBinding = function(ref, name) { };
```


# Declarative Bindings and Environment Records
Declarative environments store their bindings in an environment record object (ECMA 10.2.1). Environment records map (string) identifiers to values ([source](https://github.com/mattbierner/atum/blob/master/lib/context/environment_record.js)).

## Binding
Atum environment record bindings are stored in a `Binding` object. For immutable values like strings and numbers, the binding will be the value object. A bindings to a mutable value, like an object, stores a reference to the object.

```js
var Binding = record.declare(null,[
    'value',        // Value held.
    'mutable']);    // Is the environment binding mutable?
```

## Environment Record
Atum uses a [hashtrie][hashtrie] as its environment record. Hashtries are persistent data structures, with good lookup and update performance.

```js
var emptyEnvironmentRecord = hashtrie.empty;
```

Query operations:

```js
var getBinding = hashtrie.get;

var hasBinding = hashtrie.has;

var deleteBinding = hashtrie.remove;
```

```js
var hasMutableBinding = function(name, record) {
    return (hasBinding(name, record) && getBinding(name, record).mutable);
};

var getBindingValue = function(name, record) {
    return getBinding(name, record).value;
};
```

Update operations:

```js
var setMutableBinding = function(name, v, record) {
    return hashtrie.set(name, Binding.create(v, true), record);
};

var putImmutableBinding = function(name, v, record) { 
    return hashtrie.set(name, Binding.create(v, false), record);
};
```


# Declarative Environment
`DeclarativeEnvironment` holds a set of bindings in an environment record ([source](https://github.com/mattbierner/atum/blob/master/lib/context/environment.js)).

```js
var DeclarativeEnvironment = record.extend(Environment,
    [],
    function(outer, record) {
        this.outer = outer;
        this.record = (record || emptyEnvironmentRecord);
    });
```

## Queries
Atum's declarative environment queries do need to be computations, but queries on object environments do. It is simpler to use a common interface.

```js
DeclarativeEnvironment.prototype.hasBinding = function(name) {
    return compute.just(
        hasBinding(name, this.record));
};

DeclarativeEnvironment.prototype.getBindingValue = function(name) {
    return compute.just(
        getBindingValue(name, this.record));
};
```

## Updates
The update operations create new environment records and change the value stored for `ref` to a new `DeclarativeEnvironment` with the updated record. Both the `DeclarativeEnvironment` and environment record are persistent.

```js
DeclarativeEnvironment.prototype.setMutableBinding = function(ref, name, value) {
    return ref.setValue(
        this.setRecord(
            setMutableBinding(name, value, this.record)));
};

DeclarativeEnvironment.prototype.putImmutableBinding = function(ref, name, value) {
    return ref.setValue(
        this.setRecord(
            putImmutableBinding(name, value, this.record)));
};

DeclarativeEnvironment.prototype.deleteBinding = function(ref, name) {
    return ref.setValue(
        this.setRecord(
            deleteBinding(name, this.record)));
};
```

## Creation
Declarative environments are stored in the computation context memory with [iref references][references]. All references to environments must go though the iref indirection. Otherwise, you end up in a situation like the immutable binding environment demonstrated before, where an inner environment can not change the value of a binding in an outer environment.

```js
var createDeclativeEnvironment = function(outer) {
    return iref.create(
        DeclarativeLexicalEnvironment.create(outer));
};
```


# Adding Environments to the State
Now we can start using declarative environments in the interpreter. The `DeclarativeEnvironment` operations covered so far only work with a single environment, so a set of operations for working with the entire environment chain will be covered as well. 

## Execution Context
We added state to the interpreter [in a previous post][state] using a `ComputeContext` object. But `ComputeContext` only holds general computation state. 

Atum stores ECMAScript specific state in a `ExecutionContext` (ECMA 10.3), stored in the `ComputeContext` `userData` field.  The `ExecutionContext` holds all state information required to evaluate ECMAScript source, and the initial execution context will be very basic ([source](https://github.com/mattbierner/atum/blob/master/lib/context/execution_context.js)).

```js
var ExecutionContext = record.declare(null, [
    'strict',                   // Is the executing code strict?
    'lexicalEnvironment']);     // Reference to current environment.

ExecutionContext.empty = ExecutionContext.create(
    false,
    null);
```

## Changing Execution Environment
The `lexicalEnvironment` field holds a reference to the current environment. A small set of operations get and changes the current environment.

```js
var getEnvironment = compute.extract(function(ctx) {
    return ctx.lexicalEnvironment;
});

var modifyEnvironment = function(f) {
    return compute.modifyContext(function(ctx) {
        return ctx.setLexicalEnvironment(f(ctx.lexicalEnvironment));
    });
};

var setEnvironment = compose(
    modifyEnvironment,
    constant);
```

## Internal Reference Operations
Environments in Atum are stored with `Iref`. Both `Iref` and `EnvironmentReference` are internal reference types used to implement the interpreter.

A few helper computations simplify work with Atum internal references ([source](https://github.com/mattbierner/atum/blob/master/lib/operations/internal_reference.js)).

```js
/// Get the value stored for ref.
var getValue = function(ref) {
    return (ref instanceof InternalReference ? 
        ref.getValue() :
        compute.just(ref));
};

/// Get the value stored from the result of c.
var getFrom = function(c) {
    return compute.bind(c, getValue);
};
```

`dereference` combines `bind` and `getValue`:

```js
/// Attempt to dereference an internal reference,
/// continuing execution with the result of `f`.
var dereference = function(ref, f) {
    return compute.bind(getValue(ref), function(o) {
        return f(o, ref);
    });
};

/// Attempt to dereference the result of computation `c`.
var dereferenceFrom = function(c, f) {
    return compute.bind(c, function(ref) {
        return dereference(ref, f);
    });
};
```


# Environment References
An `EnvironmentReference` is an internal reference to a value held in an environment ([source](https://github.com/mattbierner/atum/blob/master/lib/context/environment_reference.js)).

During interpretation, when an identifier is encountered, it is not deference to a value immediately. Instead, an `EnvironmentReference` is created for the identifier, with the identifier name referencing a binding in the current environment. This binding may not actually exist, but we won't know this until the `EnvironmentReference` is dereferenced.

An unresolvable reference is created when no binding exists for `name` in any environment. This creates an `EnvironmentReference` without a `base`.

```js
var EnvironmentReference = record.declare(new InternalReference, [
    'name',     // Identifier name
    'base',     // Internal reference to environment
    'strict'],  // Is the binding in strict mode?
    function(name, base, strict) {
        this.name = name + '';
        this.base = base;
        this.strict = !!strict;
        
        // Can the binding be resolved?
        this.isUnresolvable = !base;
    });
```

## Lookups
Dereferencing an environment reference attempts to resolve the binding for `name` on the base environment. 

In strict mode, dereferencing an unresolvable `EnvironmentReference` is a runtime error (ECMA Annex C). But regular mode environment reference may be unresolvable, and dereferencing an unresolvable environment reference returns `undefined`.

```js
/// Dereference the base environment.
EnvironmentReference.prototype.getBase = function() {
    if (this.isUnresolvable)
        throw 'Reference error'; // Replaced by hosted throw later 
        
    return internal_reference.getValue(this.base);
};

/// Get the value stored for this reference
EnvironmentReference.prototype.getValue = function() {
    var name = this.name,
        strict = this.strict;
    return compute.bind(this.getBase(), function(env) {
        return compute.bind(env.hasOwnBinding(name, strict), funciton(has) {
            if (has)
                return env.getBindingValue(name, strict);
            
            // Regular mode unresolvable reference
            return undef.UNDEFINED;
        });
    });
};
```

## Updates
`setValue` updates the binding for `name` in environment `base`.
 
Setting a strict unresolvable environment reference is a runtime error. Setting an unresolvable regular mode reference creates new global binding (I'll cover globals later).

```js
EnvironmentReference.prototype.setValue = function(value) {
    if (this.isUnresolvable && this.strict)
        throw 'Reference error'; // Replaced by hosted throw later 
    
    if (this.isUnresolvable)
        throw 'Reference error'; // Replaced by global set later 

    
    var name = this.name,
        strict = this.strict;
    
    return compute.next(
        compute.bind(this.getBase(), function(env) {
            return environment.setEnvironmentMutableBinding(
                env,
                strict,
                name,
                value);
        }),
        compute.just(this));
};
```

Delete is similar to `setValue`. Deleting a strict environment reference is always a runtime error, even when the reference is resolvable. Deleting a unresolvable reference in normal mode does nothing.

```js
EnvironmentReference.prototype.deleteReference = function() {
    if (this.strict)
        throw 'Reference error'; // Replaced by hosted throw later 
    
    if (this.isUnresolvable)
        return compute.yes;
    
    return environment.deleteEnvironmentBinding(this.base, this.name);
};
```

# Environment Operations
The environment operations operate on chains of environments and bring everything together ([source](https://github.com/mattbierner/atum/blob/master/lib/operations/environment.js)). 

## Lookups
Environment lookups are used to implement identifiers. A lookup creates an environment reference, while actually resolving `name` to a value is handled in `EnvironmentReference.prototype.getValue`. 

`getEnvironmentBinding` starts by checking the top level environment for the reference `env` using `hasOwnBinding`. If `hasOwnBinding` evaluates to true, an environment reference to the environment referenced by `env` is created.

Otherwise, the search continues on the `outer` environment of `env`. If no binding has been found and no more environments remain, an unresolvable reference is returned.

```js
var getEnvironmentBinding = function(env, strict, name) {
    return internal_reference.dereference(env, function(lex, ref) {
        return compute.bind(lex.hasOwnBinding(name), function(hasBinding) {
            if (hasBinding)
                return environment_reference.create(name, ref, strict);
            
            // Check outer
            if (lex.outer)
                return getStrictnessEnvironmentBinding(lex.outer, strict, name);
            
            // unresolvable reference
            return environment_reference.create(name, null, strict);
        });
    });
};
```

## Puts
Puts create a new binding in an environment. This may overwrite an existing binding in the target environment, or hide a binding the outer environments. Put operations are used for variable and function declarations.

```js
var putEnvironmentMutableBinding = function(env, strict, name, value) {
    return internal_reference.dereference(env, function(lex, ref) {
        return lex.setMutableBinding(ref, name, value);
    });
};
```

## Sets
Sets are used by environment references to update an existing binding in an environment.

Like lookups, sets walk the chain of environments until finding the first one with the target binding. But unlike lookups, sets always succeed. If we reach the outermost environment and have not found the target binding yet, we simply create a new binding in it.

```js
var setEnvironmentMutableBinding = function(env, strict, name, value) {
    return internal_reference.dereference(env, function(lex, ref) {
        // If we have no more environments to check, just create a binding
        // in the current environment.
        if (!lex.outer)
            return putEnvironmentMutableBinding(env, strict, name, value);
            
        return compute.bind(lex.hasOwnBinding(name), function(found) {
            if (found)
                return lex.setMutableBinding(ref, name, value);
            
            // Check outer
            return setEnvironmentMutableBinding(lex.outer, name, value);
        });
    });
};
```

## Delete
Finally, delete operates much like `setEnvironmentMutableBinding`.

```js
var deleteEnvironmentBinding = function(env, name) {
    return internal_reference.dereference(env, function(lex, ref) {
        // If we have no more environments to check, just delete the binding
        // in the current environment. This binding more not actually
        // exist.
        if (!lex.outer)
            return lex.deleteBinding(ref, name);
            
        return compute.bind(lex.hasOwnBinding(name), function(found) {
            if (found)
                return lex.deleteBinding(ref, name);
                
            // Check outer
            return deleteEnvironmentBinding(lex.outer, name);
        });
    });
};
```


# Environments in the Interpreter
All that remains is to hook up the environment operations to the interpreter ([source](https://github.com/mattbierner/atum/blob/master/lib/semantics/semantics.js)). 

## Identifiers
During interpretation, identifiers are mapped to `EnvironmentReference` in the current environment using `getEnvironmentBinding` ([source](https://github.com/mattbierner/atum/blob/master/lib/semantics/value.js)). 

```js
var identifierSemantics = function(name) {
    return compute.binary(
        execution_context.strict,       // get current strictness
        getEnvironment,                 // get current env
        function(strict, env) {
            return getEnvironmentBinding(env, strict, name);
        });
};
```

## Expression Statements and Programs
By supporting identifiers, any expression may evaluate to an internal reference. But we don't actually want internal references to leak out of the interrupter. 

```js
// This code should return `3` when run by the interpreter,
// not an internal reference to `a`. 
var a = 3;
a;
```

Expressions statements must therefore evaluate their expression and deference any resulting internal references to values.

```
var expressionStatement = internal_reference.getFrom;
```

Since our programs may contain multiple statements, we also have to add a new production for a program made up of zero of more statements. 

```js
var program = function(stmts) {
    return foldl(
        compute.next,
        compute.empty,
        stmts);
};
```

## Variable Declarations
The variable declaration is the primary element that creates new bindings (ECMA 12.2). Every variable declarations contains one or more variable declarators ([source](https://github.com/mattbierner/atum/blob/master/lib/semantics/declaration.js)).

```
/// Evaluator array of declarators left to right.
var variableDeclaration = function(decls) {
    return foldl(
        compute.next,
        compute.empty,
        decls);
};
```

The ECMAScript variable declaration initialization specification is fairly complex (ECMA 10.5), so I'm going to use simplified logic for now.

When a variable declarator is evaluated, it creates and initializes a new binding in the current environment. Declarators without initial values are initialized to `undefined`.

The initializer may evaluate to an internal reference:

```js
// `b` should reference `10`, not the internal reference to `a`.
// Otherwise, changing `a` would change `b` as well.
var a = 10;
var b = a;
```

All declarators must therefore dereference their initial value. 

```js
var variableDeclarator = function(id, init) {
    return internal_reference.dereferenceFrom(
        init || undefined.UNDEFINED,
        function(value) {
            return compute.bind(
                execution_context.strict,   // Current strictness
                getEnvironment,             // Current environment
                function(strict, env) {
                    return putEnvironmentMutableBinding(
                        env,
                        strict,
                        name,
                        value);
                });
            });
    });
};
```

## Assignment
Assignment takes a lefthand side computation that evaluates to an internal reference, such as an identifier, and a right hand subexpression for the new value.

Assignment updates the value stored for the LHS, and returns the result of the RHS. It is a runtime error if the LHS is not an internal reference.

```js
/// Error if `ref` is not a reference/
var _dereference = function(ref) {
    return compute.bind(ref, function(x) {
        if (!(x instanceof internal_reference_value.InternalReference))
            throw 'Reference Error'; // Replaced by hosted error later
        
        return compute.just(x);
    });
};

var assignment = function(left, right) {
    return compute.binary(
        _dereference(left),
        internal_reference.getFrom(right),
        function(l, r) {
            return compute.next(
                l.setValue(r),
                compute.just(r));
        });
};
```

## Updating Expressions
Finally, subexpressions like `a` in `3 + a` may also evaluate to internal references. None of the lifted operations [defined previously][lifting] handle internal references, so we have to add another level of computations to deference internal references and pass the values to the arithmetic operations.

`binaryOperator` takes some binary computation `op` and returns a binary computation that deferences the result of two computations resulting in internal references, and forwards the dereferenced values `op`

```js
var binaryOperator = function(op) {
    return function(left, right) {
        return compute.binary(
            internal_reference.getFrom(left),
            internal_reference.getFrom(right),
            op);
    };
};
```

Versions of all the `arithmetic operations` using `binaryOperator` on the [lifted operations][lifting] form the top level mapping of the interpreter.

```js
var subtractOperator = binaryOperator(number.subtract);

var multiplyOperator = binaryOperator(number.multiply);

...

var equalOperator = binaryOperator(compare.equal);

```
 
# Conclusions
The resulting interpreter supports variable declarations, basic mutations, and lookups. It only uses a single environment, but adding multiple environments and closures will be fairly trivial.

```js
var a = 3;
var b = 4;

a; // 3
a = b * 2;
a; // 8
b; // 4

var a = 6; // rebind a
a; // 8
```

## Running a Program

Running a program requires that an environment be initialized before the program body is evaluated:

```js
/// Running computation `c` with completion `k`.
var evaluate = function(c, k) { 
    // Set empty environment before running `c`
    var prog = compute.next(
        compute.bind(
            createDeclativeEnvironment(null),
            setEnvironment),
        c);
    return c(
        ComputeContext.empty.setUserData(ExecutionContext.empty),
        cons(k, NIL));
};

require([  
    'parse-ecma/lex/lexer',
    'parse-ecma/parse/parser'],
function(  
    parser,
    lexer){

var evaluateText = function(input, k) {  
    var prog = mapSemantics(parser.parse(lexer.lex(input)));
    return evaluate(prog, k);
};

})
```

## Next
I'll start discussing objects and meta objects before moving on to functions.



[atum]: https://github.com/mattbierner/atum
[hashtrie]: https://github.com/mattbierner/hashtrie

[references]: /persistent-object-references-using-the-state-monad/
[lifting]: /primitive-operations-as-computations/
[state]: /adding-state/

[dynamic]: http://msujaws.wordpress.com/2011/05/03/static-vs-dynamic-scoping/
[spaghetti]: http://en.wikipedia.org/wiki/Spaghetti_stack
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure