---
layout: post
title: Atum Primitive Language Values
date: '2014-02-05'
---
Here I cover the primitive language values and operations used in [Atum][atum]. Although not too exciting, there are a few important points about property descriptors and how Atum handles objects.

Atum minimizes the interface between the host and hosted languages. Implementing ECMAScript in ECMAScript, this design choice results in some unnecessary code, but it also allows the the behavior of the hosted language to be easily modified.

# Basic Language Values
[Section 8 of ECMAScript 5.1][ecma51] defines the basic ECMAScript language values types.

## Types
ECMAScript language values may be one of six types: `Undefined`, `Null`, `Boolean`, `String`, `Number`, or `Object`.

Atum defines an enum of for these six types in `atum::value::type`. All primitive value objects have a `type` property set to one of these values

```js
define("atum/value/type", ['exports'], function(exports) {

exports.UNDEFINED = 'undefined';
exports.NULL = 'null';
exports.BOOLEAN = 'boolean';
exports.STRING = 'string';
exports.NUMBER = 'number';
exports.OBJECT = 'object';

});
```

## Base Value 
All hosted language values extend `Value`. Atum uses [Bes][bes] heavily to automate record definition.

```js
define("atum/value/value", [
    'bes/record'],
function(
    exports
    record) {

exports.Value = record.declare(null, []);
});
```

## Undefined
The undefined type is used for uninitialized values and has a single instance: `UNDEFINED`. 

```js
define("atum/value/undef", [
    'bes/record',
    'atum/value/type',
    'atum/value/value'],
function(
    exports,
    record,
    type,
    value) {

var Undefined = record.extend(value.Value, []);
Undefined.prototype.type = type.UNDEFINED;

exports.UNDEFINED = Undefined.create();
});
```


## Null
The null type has a single instance: `NULL`.

```js
define("atum/value/nil", [
    'bes/record',
    'atum/value/type',
    'atum/value/value'],
function(
    exports,
    record,
    type,
    value) {

var Null = record.extend(value.Value, []);
Null.prototype.type = type.NULL;

exports.NULL = Null.create();
});
```

## Boolean
The boolean type has two values: `TRUE` and `FALSE`. `create` converts a host language boolean to a hosted boolean, while its inverse `isTrue` converts a hosted boolean to a host boolean.

Boolean values support a single operation, `logicalNot`.

```js
define("atum/value/boolean", [
    'bes/record',
    'atum/value/type',
    'atum/value/value'],
function(
    exports,
    record,
    type,
    value) {

var Boolean = record.extend(value.Value, [
    'value']);    
Boolean.prototype.type = type.BOOLEAN;

/// Constants
exports.TRUE = Boolean.create(true);
exports.FALSE = Boolean.create(false);

/// Host Operations
exports.create = function(x) {
    reutrn (x ? TRUE : FALSE);
};

exports.isTrue = function(x) {
    return (value.isBoolean(x) && x.value);
};

/// Operations
exports.logicalNot = function(a) { 
    return create(!a.value);
};

});
```

## Number
ECMAScript numbers are represented using the [IEEE 754][ieee754] floating point arithmetic standard. Unlike `Null`, `Undefined`, and `Boolean`, Atum creates a distinct value instance for every number value. Number instances store a host Javascript number and perform calculations using this number.
 
```js
var HostNumber = Number;

define("atum/value/number", [
    'bes/record',
    'atum/value/type',
    'atum/value/value'],
function(
    exports,
    record,
    type,
    value) {

var Number = record.extend(value.Value, [
    'value']);
Number.prototype.type = type.NUMBER;

exports.Number = Number;
```

A few useful numeric constants and special values are also defined from the host language's number.

```js
exports.ZERO = Number.create(0);
exports.MAX_VALUE = Number.create(HostNumber.MAX_VALUE);
exports.MIN_VALUE = Number.create(HostNumber.MIN_VALUE);
exports.NaN = Number.create(HostNumber.NaN);
exports.NEGATIVE_INFINITY = Number.create(HostNumber.NEGATIVE_INFINITY);
exports.POSITIVE_INFINITY = Number.create(HostNumber.POSITIVE_INFINITY);
```

And a set of hosted number operation functions are defined:

```js
/// Unary Operations
exports.negate = function(a) { return Number.create(-a.value); };
exports.bitwiseNot = function(a) { return Number.create(~a.value); };

/// Binary Numeric Operations
exports.add = function(l, r) { return Number.create(l.value + r.value); };
exports.subtract = function(l, r) { return Number.create(l.value - r.value); };
exports.multiply = function(l, r) { return Number.create(l.value * r.value); };
exports.divide = function(l, r) { return Number.create(l.value / r.value); };
exports.remainder = function(l, r) { return Number.create(l.value % r.value); };

/// Binary Bitwise Operations
exports.leftShift = function(l, r) { return Number.create(l.value << r.value); };
exports.signedRightShift = function(l, r) { return Number.create(l.value >> r.value); };
exports.unsignedRightShift = function(l, r) { return Number.create(l.value >>> r.value); };
exports.bitwiseAnd = function(l, r) { return Number.create(l.value & r.value); };
exports.bitwiseOr = function(l, r) { return Number.create(l.value | r.value); };
exports.bitwiseXor = function(l, r) { return Number.create(l.value ^ r.value); };

/// Binary Relational Operations
exports.lt = function(l, r) { return boolean.create(l.value < r.value); };
exports.lte = function(l, r) { return boolean.create(l.value <= r.value); };
exports.gt = function(l, r) { return boolean.create(l.value > r.value); };
exports.gte = function(l, r) { return boolean.create(l.value >= r.value); };
});
```

## String
String values are also stored in distinct instances based on the host string:

```js
define(['exports',
        'bes/record',
        'atum/value/number',
        'atum/value/type',
        'atum/value/value'],
function(exports,
        record,
        number,
        type,
        value) {

var String = record.extend(value.Value, [
    'value']);

String.prototype.type = type.STRING;

exports.String = String;

exports.EMPTY = String.create('');
```

String values are immutable so all string operations return copies of the string:

```js
/// Joins two strings into a new string.
exports.concat = function(l, r) {
    return String.create(l.value + r.value);
};

/// Get the length of a string.
exports.length = function(s) {
    return number.Number.create(s.value.length);
};

/// Get the character at `index` in string `s`
exports.charAt = function(s, index) {
    return String.create(s.value.charAt(index));
};

/// Get the character code of the character at `index` in string `s`
exports.charCodeAt = function(s, index) {
    return number.Number.create(s.value.charCodeAt(index));
};

});
```

# Objects

Objects are a special case in Atum. Internally, ECMAScript objects consist of:
* A meta object that defines the object's behavior.
* A reference to a prototype object.
* An extensible flag.
* A map of properties.

Atum meta object are simply subclasses of `Object` that implement the required interface. The properties are stored in a map of host strings to property descriptors. 

## Object Value
The base Atum Object record contains fairly little logic.

```js
var getOwnPropertyNames = Object.getOwnPropertyNames; 

define("atum/value/Object", [
    'exports',
    'bes/record',
    'atum/value/type',
    'atum/value/value'],
function(
    exports,
    record,
    type,
    value) {

var Object = record.extend(value.Value, [
    'proto',
    'properties',
    'extensible']);
Object.prototype.type = type.OBJECT;

exports.Object = Object;
```

In order to keep all reference related computation logic out of the primitive value implementation, `atum::value::Object` only defines operations for its own properties and does not touch the prototype. A meta object, which will be detailed in a later post, provides the complete ECMAScript Object implementation.

```js
/// Get a list of names for all properties this object has.
Object.prototype.getOwnPropertyNames = function(propertyName) {
    return getOwnPropertyNames(this.properties);
};

/// Does this object have own property `name`?
Object.prototype.hasOwnProperty = function(name) {
    return (this.getOwnPropertyNames().indexOf(name) >= 0);
};

/// Returns the property descriptor for property 'name'.
Object.prototype.getOwnProperty = function(propertyName) {
    return (this.hasOwnProperty(propertyName) ?
        this.properties[propertyName] :
        null);
};

/// Get a list of all enumerable property names for this object.
Object.prototype.getEnumerableProperties = function() {
    var self = this;
    return this.getOwnPropertyNames().filter(function(x) {
        return self.getOwnProperty(x).enumerable;
    });
};
});
```

## Property Descriptors
ECMAScript objects store their properties using property descriptors ([ECMAScript5.1 8.10][ecma51]). A property descriptor may hold a property's value, but it also manages property metadata and can can define accessors that decouple a property from a memory value .  

```js
define("atum/value/property", [
    'exports',
    'bes/record'],
function(
    exports
    record) {

var Property = record.declare(null, [
    'enumerable',   // bool, is this property listed during enumeration
    'configurable', // bool, can the property's descriptor be changed.
    'value',        // value, hosted value stored
    'writable',     // bool, can `value` be changed
    'get',          // value, hosted function to get property value
    'set']);        // value, hosted function to set property value
    
exports.Property = Property;
```

There are two general categories of property descriptors: data descriptors directly hold a value, while accessor descriptors uses getter and setter functions to access a value. Both types have `enumerable` and `configurable` flags.

```
var createValueProperty = function(value, enumerable, writable, configurable) {
    return Property.create(
        !!enumerable,
        !!configurable,
        value,
        !!writable,
        undefined,
        undefined);
};
var createAccessorProperty = function(getter, setter, enumerable, configurable) {
    return Property.create(
        !!enumerable,
        !!configurable,
        undefined,
        undefined,
        getter,
        setter);
};
```

A property descriptor instance can be a data descriptor or accessor descriptor, or it can be both, or it can be neither. The effective type of a property descriptor is determined by the flags and values it has:

```js
var hasProperty = function(x, name) {
    return x[name] !== undefined;
};

var isAccessorDescriptor = function(desc) {
    return desc && (hasProperty(desc, 'get') || hasProperty(desc, 'set'));
};

var isDataDescriptor = function(desc) {
    return desc && (hasProperty(desc, 'value') || hasProperty(desc, 'writable'));
};

var isGenericDescriptor = function(desc) {
    return desc && !isAccessorDescriptor(desc) && !isDataDescriptor(desc);
};

exports.isAccessorDescriptor = isAccessorDescriptor;
exports.isDataDescriptor = isDataDescriptor;
exports.isGenericDescriptor = isGenericDescriptor;
};
```

# Value Type Conversion
[Section 9][ecma51] defines the ECMAScript type conversions. `atum::value::type_conversion` only handles primitive values and not objects, since objects may need to call their member functions as part of their type conversion.

```js
define("atum/value/type_conversion", [
    'atum/value/boolean',
    'atum/value/number',
    'atum/value/object',
    'atum/value/string',
    'atum/value/type'],
function(
    boolean,
    number,
    object,
    string,
    type) {
```

`toBoolean` converts to a boolean value. The number to boolean conversion uses C's logic and is true for all values except `0` and `NaN`. The empty string is `false` but all other strings are `true`.

```js
exports.toBoolean = function(input) {
    switch (input.type) {
    case type.BOOLEAN:
        return input;
    case type.NUMBER:
        return boolean.create(input.value !== 0 && input.value !== number.NaN.value);
    case type.STRING:
        return boolean.create(input.value.length > 0);
    case type.UNDEFINED:
    case type.NULL:
    default:
        return boolean.FALSE;
    }
};
```

`toString` converts to a string:

```js
exports.toString = function(input) {
    switch (input.type) {
    case type.UNDEFINED:   return string.String.create("undefined");
    case type.NULL:        return string.String.create("null");
    case type.BOOLEAN:     return string.String.create(boolean.isTrue(input) ? 'true' : 'false');
    case type.NUMBER:      return string.String.create("" + input.value);
    case type.STRING:      return input;
    default:               return string.EMPTY;
    }
};
```

`toNumber` attempts a number conversation. The string to number conversion attempts to parse the string as a number, and will be `NaN` if the parsing fails.

```js
exports.toNumber = function(input) {
    switch (input.type) {
    case type.NUMBER:      return input;
    case type.UNDEFINED:   return number.NaN;
    case type.BOOLEAN:     return number.Number.create(input.value ? 1 : 0);
    case type.STRING:      return number.Number.create(+input.value);
    case type.NULL:
    default:               return number.ZERO;
    }
};
```

Finally, ECMAScript defines a set of number precision operations that are used internally.

```js
var sign = function(num) {
    return (num ?
        (num < 0 ? -1 : 1):
        0);
};

var toInteger = function(input) {
    var val = input.value;
    switch (val) {
    case number.NaN.value:
        return number.ZERO;
    case number.ZERO.value:
    case number.POSITIVE_INFINITY.value:
    case number.NEGATIVE_INFINITY.value:
        return input;
    default:
        return number.Number.create(sign(val) * Math.floor(Math.abs(val)));
    }
};

var toInt32 = function(num) {
    var val = num.value;
    switch (val) {
    case number.NaN.value:
    case number.ZERO.value:
    case number.POSITIVE_INFINITY.value:
    case number.NEGATIVE_INFINITY.value:
        return number.ZERO;
    default:
        var int32bit = (sign(val) * Math.floor(Math.abs(val))) % Math.pow(2, 32);
        return number.Number.create(int32bit >= Math.pow(2, 31) ?
            int32bit - Math.pow(2, 32) :
            int32bit);
    }
};

exports.toUint32 = function(num) {
    var val = num.value;
    switch (val) {
    case number.NaN.value:
    case number.ZERO.value:
    case number.POSITIVE_INFINITY.value:
    case number.NEGATIVE_INFINITY.value:
        return number.ZERO;
    default:
        return number.Number.create(
            (sign(val) * Math.floor(Math.abs(val))) % Math.pow(2, 32));
    }
};

});
```

# Value Equality
The last important module is `atum::value::compare` for comparing primitive values.

```js
define("atum/value/compare", [
    'exports',
    'atum/value/type',
    'atum/value/type_conversion'],
function(
    exports,
    type,
    type_conversion) {
```

One point that often trips up new Javascript programmers is the difference between ECMAScript's strict equality `===` and standard equality `==` tests. Strict equality performs no type conversion, so the compared values must be of the same type.

```js
var strictEqual = function(x, y) {
    if (x.type !== y.type)
        return false;
    
    switch (x.type) {
    case type.UNDEFINED:
    case type.NULL:
        return true;
    default:
        return (x.value === y.value);
    }
};

exports.strictEqual = strictEqual;
```

Regular equality will attempt type conversions during comparison:

```js
var equal = function(x, y) {
    if (x.type === y.type)
        return strictEqual(x, y);
    
    if ((x.type === type.NULL && y.type === type.UNDEFINED) ||
      (x.type === type.UNDEFINED && y.type === type.NULL))
    {
        return true;
    }
    else if (x.type === type.NUMBER && y.type === type.STRING)
    {
        return equal(x, type_conversion.toNumber(y));
    }
    else if (x.type === type.STRING && y.type === type.NUMBER)
    {
        return equal(type_conversion.toNumber(x), y);
    }
    else if (x.type === type.BOOLEAN)
    {
        return equal(type_conversion.toNumber(x), y);
    }
    else if (y.type === type.BOOLEAN)
    {
        return equal(x, type_conversion.toNumber(y));
    }
    
    return false;
};
exports.equal = equal;

});
```





[ecma51]: http://www.ecma-international.org/ecma-262/5.1/
[iee754]: http://grouper.ieee.org/groups/754/

[atum]: https://github.com/mattbierner/atum
[bes]: https://github.com/mattbierner/bes
