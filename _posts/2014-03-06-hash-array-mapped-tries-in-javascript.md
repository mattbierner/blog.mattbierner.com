---
layout: post
title: Hash Array Mapped Tries in Javascript
date: '2014-03-06'
---
The [hash array mapped trie (HAMT)][wiki-hamt] is a [hash trie][mb-hashtrie] storage optimization that uses less space and performs better than a regular hash trie. Building on my coverage of a [Javascript hash trie][mb-hashtrie], I overview hash array mapped tries and cover a basic Javascript HAMT implementation.

The example code is written in [Khepri][khepri] and taken from the [hamt][hamt] library. HAMT is based on [Clojure's PersistentHashMap](https://github.com/clojure/clojure/blob/master/src/jvm/clojure/lang/PersistentHashMap.java).

# Overview
A HAMT is a [hash trie][mb-hashtrie] where internal node store dense child arrays. A *h* bit hash is the trie key, and each hash is split into sections of *m* bits. Internal nodes contain at most *2^m* entries for a section of the hash, and the trie has at most *h/m* levels.

## Hash Trie Storage Inefficiency
An internal node may have up to *2^m* children, but they usually are only partially full. In a regular hash trie, internal nodes get their children by offset in a *2^m* array. Every internal node, even those with a single entry, must maintain this *2^m* children array.

```
// h=4, m=2
// insert 0000 and 1100
{root
    {00 entry:0000}
    {01 empty}
    {10 empty}
    {11 entry:1100}}
```

Hash tries may be optimized to allocate only real child nodes and expand paths when only needed.

But `root` in this example would still need an internal array of size 4 to store 2 children. In languages like C++, this storage scheme is a major problem. Every internal node will allocate an array of size *2^m \* sizeof(NODE_TYPE)*.

Javascript does not have the same allocation problem since its arrays are conceptually dynamic objects with index keys. We can treat Javascript arrays as  sparse arrays, but most Javascript implementations are optimized for dense arrays and operations like `reduce` will perform poorly on sparsely populated arrays.

## HAMTs
Hash array mapped tries solve the sparsely populated array storage problem. HAMT internal nodes maintain a dense array of children, along with fixed size data for mapping an index in the conceptual *2^m* child array to an index in the actual dense child array.

HAMT indexed internal nodes use a  *2^m* bitmap to track which children exist. The dense child array is kept sorted.

```
// same as before, but we dont need empty nodes
{root bitmap:1001
    {00 entry:0000}
    {11 entry:1100}}
```

## Lookup
Lookups are performed the same as with hash tries. Sections of a hash are progressively matched against internal nodes until the entire hash has been matched. This checks at most `h / m` nodes.

Indexed node lookup is a bit more complicated than with a hash trie because internal nodes have to convert an index in a *2^m* child array to an index in their dense array of children.

We can check if a child at an index exists by checking if the node's bitmap is set at that index.

```
// pseudo code
var exists = \node_mask, hash_fragment ->
    node_mask & (1 << hash_fragment);

exists(0b1001, 0); // 0b1001 & 0b0001 // true
exists(0b1001, 1); // 0b1001 & 0b0010 // false
exists(0b1001, 2); // 0b1001 & 0b0100 // false
exists(0b1001, 3); // 0b1001 & 0b1000 // true
```

If a child exists, we need to determine its position in the dense children array. For a given index, the number of bits set in the bitmap below that index (the population count) is the number of children before the target child. This becomes the index of the target child in the dense array.

```
// pseudo code
// assume `exists` was trie
var getChild = \node, hash_fragment ->
    node.dense_children.(
        get_count_before(node.mask, hash_fragment));
```

## Updates
Updates rebuild at most `h/m` internal nodes on a path, with the cost of rebuilding an internal node being at most the cost to rebuild an array of size `2^m`. 

Indexed node updates use the same lookup logic to see if a child exists. If it does, the dense child array is rebuilt with the new child replacing the existing one. If the child does not exist, an entry is inserted in order into the dense array and the bitmap is set at the index.
 
 
 
# Javascript Implementation
In Javascript, we will use a 32 bit hash, split into 5 bit sections. 
```js
var HASH_SIZE = 32;

var SIZE = 5;

var BUCKET_SIZE = Math.pow(2, SIZE); // 32
```

Once indexed node reaches a set capacity, they will be converted to an array. An array node  is a [hash trie][mb-hashtrie] style internal node with a sparse child array. Our indexed nodes will contain at most 16 entries and use a 32 bit bitmap. Array Nodes will contain at most 32 entries.

```
// Size when we convert an indexed node to an array node
var MAX_INDEX_NODE = BUCKET_SIZE / 2; // 16

// Size when we convert an array node to an indexed node
var MIN_ARRAY_NODE = BUCKET_SIZE / 4; // 8
```

## Hash Fragments
The `hash` function from [hash trie][mb-hashtrie] converts a string key to a hash. 

`hashFragment` gets the part of a hash we are interested in at a given level.  It takes a hash `h` and a `shift` (which is a multiple of SIZE), and returns only the `SIZE` bit section of the hash we are interested in.

```js
var MASK = BUCKET_SIZE - 1; // 0b11111

var hashFragment = \shift h ->
    (h >>> shift) & MASK;
```

## Bit operations
HAMTs use two additional bit operations.

`toBitmap` converts a hash fragment (true child index) to a 32bit bitmap with the bit at index `frag` set.

```
var toBitmap = \frag -> 1 << frag;
```

`fromBitmap` converts a hash fragment (true child index) to an index in a dense child array with a given bitmap. `fromBitmap` gets the bit population count using `popcount`. 

```
/// Taken from: http://jsperf.com/hamming-weight
var popcount = let
    m1 = 0x55555555,
    m2 = 0x33333333,
    m4 = 0x0f0f0f0f
in
    \x -> let
        x = x - ((x >> 1) & m1),
        x = (x & m2) + ((x >> 2) & m2),
        x = (x + (x >> 4)) & m4,
        x = x + (x >> 8),
        x = x + (x >> 16)
    in
        (x & 0x7f);


var fromBitmap = \bitmap, frag ->
    popcount(bitmap & (toBitmap(frag) - 1));
```

## Node Structures
The leaf nodes types are the same as in a [hash trie][mb-hashtrie].

```js
var LeafNode = function \hash key value =self-> {
    self.hash = hash;   // Complete hash of the key
    self.key = key;     // Key of the leaf
    self.value = value; // Value stored for key.
};

var CollisionNode = function \hash children =self-> {
    // Complete hash of the leaf
    self.hash = hash;           
    
     // List of `LeafNode` with same hash but different keys
    self.children = children;  
};
```

The empty leaf node `empty`, is used in the implementation and to represent an empty trie.

```js
empty = null;
```

`IndexedNode` stores a dense array of children and a bitmap of which children in a *2^m* array exist.

```js
var InternalNode = function \mask children =self-> {
    // bitmap of which children exist in the real child array.
    self.mask = count;
    
    // Dense array of children
    self.children = children;
};
```

`ArrayNode` is the same as the [hash trie][mb-hashtrie] `InternalNode`. It manages an array children, addressable by hash fragment offsets into a sparsely populated array. Only children that actual exist are set in the array.

```js
var ArrayNode = function \count children =self-> {
    self.count = count; // Number of real children
    self.children = children; // Array mapping hash fragment to child.
};
```

# Lookups
Looking up an entry is the same process as with a [hash trie][mb-hashtrie]; simply descend a path of internal nodes using progressive hash fragments until a leaf is found. The same `nothing` values will also be used in HAMT

`lookup` takes a node `n`, the current `shift` (level * SIZE), the complete lookup hash `h`, and the lookup key `k`

```js
var isEmpty = (!);

var lookup = \shift h k n ->
    ?isEmpty n
        :nothing
        :n.lookup(shift, h, k);
```

Lookup operations are specialized for each node type.

#### LeafNode::get
Leaf nodes return nothing if the lookup key is not equal to the node's key.

```js
LeafNode.prototype.get = \_ _ k =self->
    ?k === self.key
        :self.value
        :nothing;
```

#### CollisionNode::get
Collision nodes return the first matching value in their collision list, or nothing.

```js
CollisionNode.prototype.get = \_ _ k ={children}-> {
    for (var i = 0, len = children.length; i < len; i = i + 1)
    with {key value} = children.(i) in {
        if (k === key)
            return value;
    }
    return nothing;
};
```

#### IndexedNode::get
IndexedNodes use `shift` to calculate a hash fragment and check if the target child exists using their `mask`. If the child does exist, its index in the dense array `children` is computed using `fromBitmap`. Lookup continues on the child. Since the child lookup happens at the next level of the tree, the shift is incremented. When the child does not exist, `lookup` returns nothing. 

```js
IndexedNode.prototype.lookup = \shift h k =self-> let
    frag = hashFragment(shift, h),
    bit = toBitmap frag,
    exists = self.mask & bit
in
    ?exists
        :lookup(
            self.children.(fromBitmap(self.mask, frag)),
            shift + SIZE,
            h,
            k)
        :nothing;
```

#### ArrayNode::get
Array nodes use `shift` to calculate a hash fragment, get a child from `children` using the hash fragment, and perform a lookup on this child. When the child is `undefined`, `lookup` returns nothing. 

```js
ArrayNode.prototype.lookup = \shift h k =self-> let
    frag = hashFragment(shift, h),
    child = self.children.(frag)
in
    lookup(child, shift + SIZE, h, k);  
```

## API
```
/// Get value for `k` or return `alt`.
tryGet = \alt k m  ->
    maybe(
        lookup(m, 0, hash k, k),
        alt);

/// Get the value for `k` or return `null`
getHash = tryGet @ null;

/// Does an entry for `k` exist?
has = \k m ->
    !isNothing lookup(m, 0, hash k, k);
```

# Updates
Updates take a hash trie and return a new hash trie with the update applied. Like lookup, updates walk a path of internal nodes until finding a leaf. But instead of returning a value, updates edit the leaf and then reconstruct all nodes on the path back to the root in reverse order.

HAMT update logic is much the same as [hash trie][mb-hashtrie]. A single `alter` function handles updates, deletes, and modifications. `alter` takes a node `n`, `shift`, function `f` which maps the current node value to a new node value, target hash `h`, traget key `k`.

```js
var alter = \n shift f h k ->
    ?isEmpty n
        :alterEmpty(shift, f, h, k)
        :n.modify(shift, f, h, k);
```

Deletes occur when `f` returns `nothing`, while inserts occur when an empty node is edited and `f` does not return `nothing`. Otherwise the edit is a modification.

#### empty::modify
Editing an empty node calls the modify function `f` with zero arguments. If `f` does not return `nothing`, a new node is inserted.

```js
var alterEmpty = \_ f h k ->
    v = f()
in
    ?isNothing v
        :empty // noop
        :new Leaf(h, k, v); // insert node
```

#### LeafNode::modify
Leaf nodes are handled the much same as with [hashtrie][hashtrie]. There are two cases: the leaf itself is being modified, or the leaf is the last element of a path and may be expanded to an `IndexedNode`.

Leaves are edited if their key matches the target key. In this case, the edit function may either delete the node by returning `nothing`, or edit the node by returning a new value.

When modify is called on a leaf node and the target key does not match the node, instead of editing the leaf, a new node may be inserted. If a new leaf is inserted, the current leaf and new leaf nodes are merged to become descendants of a new internal node.

```js
LeafNode.prototype.modify = \shift f h k =self->
    ?k === self.key
        // Editing leaf
        :let v = f(self.value) in
            ?isNothing v
                :empty  // delete
                :new LeafNode(h, k, v) // edit
        
    // Potential expansion
    :let v = f() in
    ?isNothing v
        :self // noop
        :mergeLeaves(shift, self, new LeafNode(h, k, v)); // insertion
```

Two leaf nodes are merged recursively. Internal node levels are inserted until the two nodes no longer have conflicting hash fragments. Collisions occur when nodes have the same hash.

```js
var mergeLeaves = \shift n1 n2 -> let
    h1 = n1.hash,
    h2 = n2.hash
in
    ?h1 === h2
        :new CollisionNode(h1, [n2, n1])
    
    :let
        subH1 = hashFragment(shift, h1),
        subH2 = hashFragment(shift, h2)
    in new IndexedNode(toBitmap subH1 | toBitmap subH2,
        ?subH1 === subH2
            // recursively merge next level
            :[mergeLeaves(shift + SIZE, n1, n2)]
            
            // Found lowest level, insert both children in order.
            :?subH1 < subH2 :[n1, n2] :[n2, n1]);
```

#### CollisionNode::modify
Collision nodes modify the matching leaf in their collision list. Deleted nodes are removed from the collision list. If a deletion results in a collision with one entry, the list is collapsed into a leaf node.

```js
CollisionNode.prototype.modify = \_ f h k =self-> let
    list = updateCollisionList(self.children, f, k)
in
    ?list.length > 1
        :new CollisionNode(self.hash, list)
        
        // collapse collision to leaf
        :list.(0); 
```

`updateCollisionList` takes a list of leaf nodes and returns a new list with the leaf with key `k` updated. If `f` returns nothing, 

```js
var updateCollisionList = \list f k ->
    ? !list.length
        :[]
    
    :let first = list.(0), rest = list.slice(1) in
    ?first.key === k
        // found node to edit
        :let v = f(first.value) in
            ?isNothing v
                :rest // deletion
                :[v].concat(rest) // edit
                
        // continue search on rest of list.
        :[first].concat(updateCollisionList(rest, f, k));
```

#### IndexedNode::modify
Modifying an indexed node is the most complicated operation. Child modification may either edit an existing child, insert a new child, or delete an existing child. Empty internal nodes are collapsed, while large indexed nodes are expanded to `ArrayNode`.

The child is edited with `alter`, increasing the shift by `SIZE` since the child is at the next level of the trie.

```js
IndexedNode.prototype.modify = \shift f h k =self-> let
    frag = hashFragment(shift, h),
    bit = toBitmap frag,
    indx = fromBitmap(self.mask, frag),
    exists = self.mask & bit,
    
    // New child
    child = alter(
        ?exists
            :self.children.(indx)
            :empty,
        shift + size,
        f,
        h,
        k),
    
    // What type of edit was this
    removed = exists && isEmpty child,
    added = !exists && !isEmpty child,
    
    // Number of children after edit.
    bound = ?removed
        :self.children.length - 1
        :?added
            :self.children.length + 1
            :self.children.length,
    
    // New dense array of children
    subNodes = ?removed
        :arraySpliceOut(indx, self.children)
        :?added
            :arraySpliceIn(indx, child, self.children)
            :arrayUpdate(indx, child, self.children),
    
    // New bitmap
    bitmap = ?removed
        :self.mask & ~bit // Unset index bit
        :?added
            :self.mask | bit // Set index bit
            :self.mask
in
    ?!bitmap
        // The node has no children. Collapse to empty
        :empty
        
    :?bound <= 0 && isLeaf(self.children.(0))
        // We have a single, leaf child. Collapse to it
        :self.children.(0)
        
    :?bound >= MAX_INDEX_NODE
        // Build ArrayNode for this node
        :expand(bitmap, subNodes)
    
    // Rebuild node
    :new IndexedNode(bitmap, subNodes);
```

The child array update operations copy the array, then update it. This copies at most 16 elements.

```js
var arrayUpdate = \at v arr -> {
    var out = arr.slice(); // copy
    out.(at) = v;
    return out;
};

var arraySpliceIn = \at v arr -> {
    var out = arr.slice(); // copy
    out.splice(at, 0, v);
    return out;
};

var arrayRemove = \at arr -> {
    var out = arr.slice(); // copy
    delete out.(at);
    return out;
};
```

`expand` take `IndexedNode` data and expands it to an `ArrayNode`. This iterates though the bitmap, inserting children that exist into a new sparse array.

```js
var expand = \bitmap subNodes -> {
    var arr = [],
        count = 0;
    for (var bit = bitmap; bit; bit = bit >>> 1) {
        if (bit & 1) {
            arr.(i) = subNodes.(count);
            count = count + 1;
        }
    }
    return new ArrayNode(count, arr);
};
```

#### ArrayNode::modify
Modifying an `ArrayNode` is much the same as with a [hash trie][mb-hashtrie]. A (potentially empty) child is edited and the `children` array is rebuilt with the modified child.

Once an array node drops below a set occupancy, it is collapsed back to an `IndexedNode` with `pack`.

```
ArrayNode.prototype.modify = \shift f h k =self-> let
    frag = hashFragment(shift, h),
    child = self.children.(frag), // may be empty
    newChild = alter(child, shift + size, f, h, k)
in
    ?isEmpty child && !isEmpty newChild
        // add
        :new ArrayNode(
            self.count + 1,
            arrayUpdate(frag, newChild, self.children))
        
    :?!isEmpty child && isEmpty newChild
        // remove
        :?self.count - 1 <= minArrayNode
            // Collapse
            :pack(frag, self.children)
            :new ArrayNode(
                self.count - 1,
                arrayRemove(frag, self.children))
        
    // Modify
    :new ArrayNode(
        self.count,
        arrayUpdate(frag, newChild, self.children));
```

`pack` takes `ArrayNode` children and builds a dense array and bitmap for a new `IndexedNode`.

```js
var pack = \removed elements -> {
    var children = [],
        bitmap = 0;
    
    for (var i = 0, len = elements.length; i < len; i = i + 1)
    with elem = elements.(i) in {
        if (i !== removed && !isEmpty elem) {
            children.push(elem);
            bitmap = bitmap | (1 << i);
        }
    }
    
    return new IndexedNode(bitmap, children);
};
```

## Update API

```js
var constant = \x -> \() -> x;

/// Edit entry for `k` with `f`.
/// `f` maps the current value to a new value.
/// `f` may create a new node if the target does not exist
modify = \k f m ->
    alter(m, 0, f, hash k, k);

// Set entry for `k` to `v`.
setHash = \k v m ->
    modify(m, k, constant v);

/// Remove entry for `k`.
/// Noop if entry does not exist
removeHash = let del = constant nothing in
    \h k m ->
        modify(k, del, m);
```


```js
var h = set(‘a’, ‘x’,
    set(‘b’, ‘y’,
        empty);

// Edit node
var h1 = modify(‘b’, \x -> x.charCodeAt(0), h);
get(‘b’, h1); // 121
get(‘b’, h); // ‘y’

// Insert Node
var h2 = set(‘c’, ‘z’, h);
get(‘c’, h2); // ‘z’
get(‘c’, h); // null

// Set Node
var h3 = set(‘b’, ‘n’, h);
get(‘b’, h3); // ‘n’
get(‘b’, h); // ‘y’

// Remove Node
var h4 = remove(‘b’, h);
get(‘b’, h4); // null
get(‘b’, h); // ‘y’
```

# Folds
Fold aggregates information about every entry in the trie. HAMTs are unordered, so only order independent operations can be used. 

Fold operations are one area where HAMT offers a significant performance boost over a regular hash trie. `Array.prototype.reduce` unfortunately is [not optimized for sparse arrays](http://jsperf.com/sparse-array-reduce-overhead/2), so dense arrays can be folded much quicker. 

`fold` takes a function `f`, initial value `z`, and trie `m`. `f` is called with the previous result and the current key and value as in a object:

```js
fold = \f z m ->
    ?isEmpty m
        :z
        :m.fold(f, z);
```

The specialization for the nodes:

```js
Leaf.prototype.fold = \f z =self->
    f(z, self);

Collision.prototype.fold = \f z ={children}->
    children.reduce(f, z);

IndexedNode.prototype.fold = \f z =self->
    self.children.reduce(fold@f, z);

ArrayNode.prototype.fold = \f z =self->
    self.children.reduce(fold@f, z);
```


# Summary
HAMTs are the fastest persistent hash trie implementation I could find. They perform well, even as the size of the trie grows very large. Fold operations are often up to `10x` on HAMTs than on regular [hash tries][hashtrie].

The [hamt][hamt] library provides functionality beyond what I have covered here.

## Benchmarks
The more optimized [hamt][hamt] library performs very well, and is the fastest persistent hash trie Javascript library that I could find overall, although [hash trie][hashtrie] is faster in a few cases. 

The complete comparison results and the benchmarks are [available here][benchmarks].

```
# Get nth
hamt(10)                      :      5267300.20 +/- 0.18% op/s
hamt(100)                     :      4954966.94 +/- 0.08% op/s
hamt(1000)                    :      4407368.85 +/- 0.23% op/s
hamt(10000)                   :      3695337.18 +/- 0.58% op/s
hamt(100000)                  :      1243284.12 +/- 1.88% op/s


# put nth
hamt(10)                      :      2411455.82 +/- 1.09% op/s
hamt(100)                     :      1207404.50 +/- 3.22% op/s
hamt(1000)                    :      1412272.94 +/- 3.77% op/s
hamt(10000)                   :       910400.84 +/- 1.43% op/s
hamt(100000)                  :       763270.93 +/- 0.87% op/s

# Put n elements
hamt(10)                      :       207869.60 +/- 1.26% op/s
hamt(100)                     :        13720.51 +/- 1.38% op/s
hamt(1000)                    :         1137.66 +/- 1.00% op/s
hamt(10000)                   :           83.73 +/- 4.31% op/s

# remove nth
hamt(10)                      :      1852861.00 +/- 0.99% op/s
hamt(100)                     :      1351888.10 +/- 2.15% op/s
hamt(1000)                    :      1112764.10 +/- 0.90% op/s
hamt(10000)                   :       837521.94 +/- 1.85% op/s
hamt(100000)                  :       515390.29 +/- 1.16% op/s

# Remove n elements
hamt(10)                      :       213287.68 +/- 1.09% op/s
hamt(100)                     :        15783.71 +/- 1.19% op/s
hamt(1000)                    :         1171.56 +/- 0.97% op/s
hamt(10000)                   :           81.63 +/- 5.49% op/s

# Sum with fold
hamt(10)                      :      3381904.03 +/- 0.49% op/s
hamt(100)                     :       329751.18 +/- 0.50% op/s
hamt(1000)                    :        15326.25 +/- 5.44% op/s
hamt(10000)                   :         3322.86 +/- 0.88% op/s

# Keys with fold
hamt(10)                      :      2099750.38 +/- 3.12% op/s
hamt(100)                     :       229922.38 +/- 3.80% op/s
hamt(1000)                    :        14014.31 +/- 1.39% op/s
hamt(10000)                   :         2429.46 +/- 3.07% op/s

```

## Other Notes
#### Allocation
In languages like C++, HAMT node allocation is more difficult to optimize than with a regular hash trie. HAMT indexed node child arrays may contain between 1 and `MAX_INDEX_NODE` children, while hash trie children arrays are a fixed size and can be easily allocated from a pool. 


#### popcount
In lower level languages with a small *h* `popcount` is a single instruction.


[tries]: http://en.wikipedia.org/wiki/Trie
[wiki-hamt]: http://en.wikipedia.org/wiki/Hash_array_mapped_trie
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure

[khepri]: https://github.com/mattbierner/khepri
[hamt]: https://github.com/mattbierner/hamt
[hashtrie]: https://github.com/mattbierner/hashtrie
[benchmarks]: https://github.com/mattbierner/js-hashtrie-benchmark

[mb-hashtrie]: /persistent-hash-tries-in-javavascript
