---
layout: post
title: Persistent Object References Using the State Monad
date: '2014-02-19'
---
ECMAScript requires highly interconnected and mutable objects, but [Atum][atum] uses [persistent data structures][persistent] exclusively. Indirection and the state monad allow implementation of references and updatable values without mutating the underlying data structures.

This post discusses the problem with host ECMAScript references, overviews the design of a simple persistent memory system, and implements memory and references using the [interpreter monad previously defined][state-monad]. 


## The problem
ECMAScript doesn't directly expose a C++ style reference type but, like Java, passes all objects by reference. Unfortunately, ECMAScript object references will not work properly for persistent data structures.

Persistent data structure updates create new objects instead of mutating existing ones. This means that an ECMAScript reference to a persistent object will always point to the same instance, even when the referenced persistent object is conceptually updated.

```js
var Node = record.declare(null, ['value', 'next']);

var t = Node.create(2, null);
var h = Node.create(1, t);

// Changing `t` does not update the value stored
// on the `t` instance in `h`.
t.setValue(10);
h.next.value; // 2
```

ECMAScript environments and hosted objects are highly interconnected and mutable. We need to be able to easily change the value stored at a reference, and have this change be reflected across every data structure that holds this reference. Essentially, we need to implement mutation without mutation.

```js
// If only things were this easy
t.value = 10;
h.next.value; // 10
```

# Indirection to the Rescue
Implementing a memory system for the interpreter requires solving two problems: how to represent references and how to implement a memory system to dereference and update referenced values.

## Handles
The first step to separate the reference from the referenced value. The reference itself will be a [handle][handle], an immutable and opaque structure that uniquely identifies a referenced object (two equivalent handles always refer to the same object).

Using handles in data structures is straightforward; every ECMAScript object reference to an updatable object is replaced by a handle that referes to the updatable object. We also need a mechanism to allocate unique handles.

```js
//pseudo-code of handles applied to list
var t = Node.create(2, null);

var ref = createUniqueHandleTo(t)

var h = Node.create(1, ref);
```

## Memory
The memory system maps handles to values. Memory is stateful and, like all the other data structures, the memory state is persistent. The entire state is captured in a single map data structure.

```js
// pseudo-code of memory
var m = new Memory();

var t = Node.create(2, null);

var [m1, ref] = createUniqueHandleTo(m, t);
var h = Node.create(1, ref);

var m2 = set(m1, ref, 10);

get(m2, h.next).value; //  10
get(m1, h.next).value; //  2
```

Instead of worrying about storing and updating persistent objects all over the place, we only have to solve the more manageable problem of storing and updating a single object, the memory state. And the computation state already provides everything we need.


# Adding Memory to the Compute Context
Atum's memory state is a [hash trie][hashtrie] stored on the `ComputeContext` as `'values'`.

```js
var ComputeContext = record.declare(null, [
    'userData',
    'unique',
    'values']);

ComputeContext.empty = ComputeContext.create(null, 1, hashtrie.empty);
```

The standard extract and update operations are defined for accessing and updating the memory state:

```js
var modifyValues = function(f) {
    return modifyComputeContext(function(ctx) {
        return ctx.setValues(f(ctx.values));
    });
};

var setValues = fun.compose(modifyValues, fun.constant);

var values = extract(function(ctx) {
    return ctx.values;
});
```

## Getting and Settings Values
`getValue` gets the stored memory value for handle `key`. In this case, handles are simply strings.

```js
var getValue = function(key) {
    return bind(values, function(values) {
        return just(hashtrie.get(key, values));
    });
};
```

`setValue` stores a value in memory for handle `key`. The hash trie is persistent, and `set` returns a copy of the hashtrie with the value for `key` set to `x`.

```js
var setValue = function(key, x) {
    return modifyValues(function(values) {
        return hashtrie.set('key', x, values));
    });
};
```

## Simple Computation Using References
The linked list example can be rewritten to used handles and the memory. More powerful computations combinators can be also be written using `getValue` and `setValue`.

```js
var dereference = function(key, f) {
    return bind(getValue(k), f);
};

var update = function(key, f) {
    return dereference(key, function(x) {
        return setValue(key, f(x));
    });
};

run(
    sequence(
        // Create updatable objects
        setValue('tail', Node.create(2, null)),
        setValue('head', Node.create(1, 'tail')),

        // Mutate 'tail'
        update('tail', function(tail) {
            return tail.setValue(10);
        }),

        // Get the value of 'head'.next.value
        dereference('head', function(head) {
            return dereference(head.next, function(tail) {
                return just(tail.value);
            });
        })));
```

# References
Atum does not use handles directly, instead handles are hidden behind another layer of abstraction. Many referenced objects are not stored directly in the memory, so the `Reference` interface hides the different refernce implementations. There are a few classes of references that implement this interface, but I'm going to focus on references to objects stored in the memory for now.

## The Reference Interface
```js
var Reference = function() { };

/// Get the referenced value.
Reference.prototype.getValue = null;

/// Set the referenced value.
Reference.prototype.setValue = null;
```

`getValue` returns a computation that returns the value the reference points to.

`setValue` takes an input value and returns a computation that sets the value that the reference points to. Most importantly, this does not mutate the reference object. The result of the `setValue` computation  returns the reference object `setValue` was called on.

## Reference Types
Atum splits references into two classes: internal references for implementing ECMAScript, and value references for references that are semi-exposed in ECMAScript (object references). `InternalReference` and `ValueReference` are marker classes for these two types of references. 

```js
var InternalReference = function() { };
InternalReference.prototype = new Reference;

var ValueReference = function() { };
ValueReference.prototype = new Reference;
```

I'll cover both types of references in detail later, but the reason for the division is that many operations need to dereference internal references but not value references.

# Irefs
Irefs are internal references to a value in the compute context memory. They are used to store environments and other linked objects that need to be updated in computations.

Each Iref holds a handle `key` to a value in the memory.

```js
var Iref = record.declare(new InternalReference, [
    'key']);
```

## Iref Get and Set
`getValue` and `setValue` use the key to create computations that get and set the value for `key` in the memory.

```js
Iref.prototype.getValue = function() {
    return getValue(this.key);
};
```

`setValue` updates the memory map and returns the immutable Iref object is was called on.

```js
Iref.prototype.setValue = function(x) {
    return next(
        setValue(this.key, x),
        just(this));
};
```


## Creating Unique Irefs
Unique Irefs are created using `createIref`, which gets a unique key from the compute context.

```js
var createIref = function(initialValue) {
    return bind(
        unique,
        function(key) {
            return Iref.create(key).setValue(initialValue);
        });
};
```

# Next
Next, I put references to use to implement basic ECMAScript environments with closures.

[atum]: https://github.com/mattbierner/atum
[hashtrie]: https://github.com/mattbierner/hashtrie

[state-monad]: /adding-state/

[handle]: http://en.wikipedia.org/wiki/Handle_(computing)
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure