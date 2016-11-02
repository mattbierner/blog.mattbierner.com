---
layout: post
title: Using Records for Persistent Objects in Javascript
date: '2013-12-13'
---
Javascript objects are mutable, and mutable objects are greatly overrated. Immutable objects are necessary for functional-style Javascript but can require a lot of boilerplate code.

Records are a simple, [Clojure inspired][clojure] way to specify persistent objects declaratively. They interface with existing Javascript inheritance hierarchies and can automatically generate methods for working with immutable data.

This post details the advantages and implementation of records. The code is drawn from [Amulet][amulet], a small Javascript library that protects programmers from mutation.
 
## Motivating Example

[Atum][atum] is a Javascript interpreter written in functional style Javascript.  All objects in Atum are immutable, but mutation is simulated using transform operations. A setter transform for example takes an input object and a value, and returns a copy of the input object with the property set.

As more object types were added to Atum, the code to define these immutable objects started to take up significant space. `ExecutionContext` was the worst offender:

```js
var ExecutionContext = function(
    type,
    settings,
    strict,
    lexicalEnvironment,
    variableEnvironment,
    thisBinding,
    global,
    metadata)
{
    this.type = type;
    this.settings = settings;
    this.strict = !!strict;
    this.lexicalEnvironment = lexicalEnvironment;
    this.variableEnvironment = variableEnvironment;
    this.thisBinding = thisBinding;
    this.global = global;
    this.metadata = metadata;
};

// Setter transforms

ExecutionContext.setType = function(ctx, type) {
    return new ExecutionContext(
        type,
        ctx.settings,
        ctx.strict,
        ctx.lexicalEnvironment,
        ctx.variableEnvironment,
        ctx.thisBinding,
        ctx.global,
        ctx.metadata);
};

... 60+ lines
```

Besides being unwieldy, this code was not maintainable. Changing a property name required changing eight names across the file and adding a new property required another eight changes, plus a copy and pasted transform setter.

The same code using a record:

```js
var ExecutionContext = record.declare(null, [
    'type',
    'settings',
    'strict',
    'lexicalEnvironment',
    'variableEnvironment',
    'thisBinding',
    'global',
    'metadata']);
```

These two implementations are eqivilent for most purposes. Across the entire Atum codebase, switching to records eliminated well over 500 lines of code. 

## Caveat
These are not going to be truly immutable objects. Immutability is guaranteed using the supported interfaces, including object accessors and the generated transform operations, but the objects can be mutated easily intentionally or by mistake.

The generated interfaces enable working with immutable objects and leave enforcement to the programmer.

# Record Implementation

A record is just a Javascript constructor with some metadata and additional properties. Records are specified declaratively and create instances of the data they specify. Records and record instances support the standard Javascript operations, such as `new` and `instanceof`. They can even subclass and be inherited from regular objects. 

## Basic Records
A record is declared from an optional prototype object, array of keys, and optional custom constructor. The custom constructor is a regular Javascript object constructor, allowing custom logic to be run when creating an instance. If no constructor is provided, one is generated. 

```js
var declare = let
    defaultConstructor = \keys{length} ->
        function \args(...) -> {
            for (var i = 0; i < length; i = i + 1)
                this[keys[i]] = args[i];
        }
in
    \proto, keys, ctor -> {
        var construct = (ctor || defaultConstructor(keys));
        construct.__keys = keys;
        construct.prototype = Object.create(proto || new Object);
        construct.prototype.constructor = construct;
        
        return construct;
    };
```

For performance reasons, the implementation modifies `ctor` and `proto`. A custom ctor is usually a new function, and the prototype a new instance of an object, in which case this is not an issue.

Defining Record `R` with three data members (`a`, `b`, `c`) and creating an instance with `new`:

```js
    var R = declare(null, ['a', 'b', 'c']);
                
    var x = new R(1, 2, 3);       
    x instanceof R; // true
    x.a; // 1
    x.b; // 2
    x.c; // 3
    Object.keys(x); // ['a', 'b', 'c']
```

Using a custom construtor:

```js
var R = declare(null, ['a', 'b', 'c'], function\a, b, c =self-> {
    self.a = a * 1;
    self.b = b * 2;
    self.c = c * 3;
});
            
var x = new R(1, 2, 3);
x instanceof R; // true
x.a; // 1
x.b; // 4
x.c; // 6
```

Inheriting from a existing class:

```js
var A = function() { };
A.prototype.a = 30;
A.prototype.x = 40;

var R = declare(new A, ['a', 'b', 'c']);
            
var x = new R(1, 2, 3);
x instanceof A; // true
x instanceof R; // true
x.a; // 1
x.b; // 2
x.c; // 3
x.x; // 40
```

## Record.create

Javascript constructors are weird. Some people even [consider them harmful][new-harmful]. Constructor in Javascript are regular functions that, when invoked using `new`, create a new object. But treating constructors like functions can lead to some interesting bugs:

```js
var R = record.declare(null, ['a']);
var x = R(1); // undefined
a; // 1

// Passing a constructor

// Bad
[1, 2, 3].map(R); // [undefined, undefined, undefined]
a; // 3

// Have to write
[1, 2, 3].map(\x -> new R(x)); // [R(1), R(2), R(3)]
```

Rather than create a function every time we want to use a constructor as a function, records automate this.

A property `create` is set on all Records. `create` is a function that behaves like calling `new R(...)` and returns the new record instance (unless your constructor returns an object, in which case that object is returned).

```js
var declare = let
    defaultConstructor = \keys{length} ->
        function \args(...) -> {
            for (var i = 0; i < length; i = i + 1)
                this[keys[i]] = args[i];
        }
in
    \proto, keys, ctor -> {
        var construct = (ctor || defaultConstructor(keys));
        construct.__keys = keys;
        construct.prototype = Object.create(proto || new Object);
        construct.prototype.constructor = construct;
        
        // create
        var Fwd = function \args ->
            construct.apply(this, args);
        Fwd.prototype = construct.prototype;
        construct.create = \args(...) -> new Fwd(args);
        
        return construct;
    };
```

Since there is no way to forward arguments to a function invoked by `new`, a proxy constructor `Fwd` is used to forward arguments to the real constructor.  `create` then creates a new instance of the proxy constructor.

```js
var R = declare(null, ['a']);
            
var x = R.create(1, 2);
x instanceof R; // true
x.a; // 1

[1, 2, 3].map(R.create); // [R(1), R(2), R(3)]
```

## Auto Generating Transforms

The greatest value of records is automatically generating methods for transforming immutable objects. As the Atum motivating example demonstrates, this eliminates a lot of boilerplate code. Setter transforms demonstrated here, but other transforms are easy to add.

Two helper methods for safely "setting" properties on an immutable object are defined. `setProperty` takes on object `obj`, property name `name`, and value `value` and returns a copy of that object with property `name` set to `value`
 
```js
var copyProps = \obj -> {
    with names{length} = Object.getOwnPropertyNames(obj) in {
        var props = {};
        for (var i = 0; i < length; i = i + 1) {
            var key = names[i];
            props[key] = Object.getOwnPropertyDescriptor(obj, key);
        }
        return props;
    }
};

var setProperty = \obj, name, value, enumerable -> {
    var props = copyProps(obj);
    var current = props[name];
    props[name] = {
        'value': value,
        'enumerable': (!current || enumerable !== undefined ?
            enumerable :
            current.enumerable)
    };
    return Object.create(Object.getPrototypeOf(obj), props);
};
```

`propertyCase` transforms a property name to Pascal case:

```js
var propertyCase = \name ->
    (name + '')
        .match(`\w\S*`g)
        .map(\str[first] -> first.toUpperCase() + str.slice(1))
        .join('');
```

Finally, declare is updated to automatically generate setters on both the instances and the Record. Instances setters take a single value while Record setters take an object and a value: 

```
var declare = let
    defaultConstructor = \keys{length} ->
        function \args(...) =self-> {
            for (var i = 0; i < length; i = i + 1)
                self[keys[i]] = args[i];
        },

    makeSetter = \key ->
        \x =self-> setProperty(self, key, x),

    makeCtorSetter = \key ->
        Function.prototype.call.bind(makeSetter(key))
in
    \proto, keys, ctor -> {
        var construct = (ctor || defaultConstructor(keys));
        construct.__keys = keys;
        construct.prototype = Object.create(proto || new Object);
        construct.prototype.constructor = construct;
        
        // setters
        keys.forEach <|\ key -> {
            var setterName = 'set' + propertyCase(key + '');
            construct[setterName] = makeCtorSetter(key);
            construct.prototype[setterName] = makeSetter(key);
        };
        
        // create
        var Fwd = function \args =self->
            construct.apply(self, args);
        Fwd.prototype = construct.prototype;
        construct.create = \args(...) -> new Fwd(args);
        
        return construct;
    };
```

```js
var R = declare(null, ['a', 'b', 'c']);
                
var x = R.create(1, 2, 3);
var y = x.setA(100).setC(4);
var z = R.setB(x, 15);

x.a; // 1
x.b; // 2
x.c; // 3

y.a; // 100
y.b; // 2
y.c; // 4

z.a; // 1
z.b; // 15
z.c; // 3
```

# Further Possibilities 

## Extend
Using record metadata, extending an existing record with additional properties is trivial:

```js
var extend = \base, keys, ctor ->
    declare(
        new base,
        base.__keys.concat(keys),
        ctor);
``` 

```js
var R = declare(null, ['a', 'b']);
var R2 = extend(R, ['x', 'y']);

var x = R2.create(1, 2, 3, 4);

x.a; // 1
x.b; // 2;
x.d; // 4;
x instanceof R; // true;
x instanceof R2; // true;
```

## Enforcing Immutability
ECMAScript's 5.1 meta object methods can enforce immutability. 

Wrapping the constructor in a call to `Object.freeze` will prevent setting and deleting properties on this instance:

```js
var declare = let
    wrap = \ctor ->
        \args(...) =self-> {
            var r = ctor.apply(self, args);
            Object.freeze(self);
            return r;
        },
    
    defaultConstructor = \keys{length} =self->
        function \args(...) -> {
            for (var i = 0; i < length; i = i + 1)
                self[keys[i]] = args[i];
        }
in
    \proto, keys, ctor -> {
        var construct = wrap(ctor || defaultConstructor(keys));
        construct.__keys = keys;
        construct.prototype = Object.create(proto || new Object);
        construct.prototype.constructor = construct;
        return construct;
    };
```

Attempts to mutate a record instance will now either do nothing or throw an error in strict mode.
  
  
# Performance

Records unfortunately do perform worse than plain objects. A [JSperf ][overhead-test] comparing creating simple instances shows around a 10x performance hit in the worst case.

Records using custom ctors perform the same as regular objects while auto generated ctor is more than 5x slower. This is disappointing because all the information to generate an efficient ctor implementation exists, but I don't see a way to unpack the keys into a constructor besides putting that unpack logic in the constructor itself (C++'s unpack operator would be helpful).

`create` has further overhead as it introduces two additional function calls.



# Closing Thoughts

Working with immutable objects in Atum, I found the value of using records far outweighs the performance hit. Records allow code to be written and updated code faster, and are much easier to maintain.

 

[amulet]: https://github.com/mattbierner/amulet
[atum]: https://github.com/mattbierner/atum
[new-harmful]: http://stackoverflow.com/questions/383402/is-javascript-s-new-keyword-considered-harmful
[overhead-test]: http://jsperf.com/amulet-small-object-overhead-test
[clojure]: http://clojure.org/datatypes