---
layout: post
title: 'Template Assembler'
date: '2015-09-21'
description:
series: stupid_template_tricks
---
The Graybeards tell us that all of C++ rests on the back of templating, to which the skeptic responds, "Then what supports the templating?" For a true metaprogrammer like myself, the answer is obvious: "It's templates all the way down." Templates of templates compiling templates and begetting more templates, or at least that's what I used to believe... 

In this post, we'll build a simple x86 assembler C++ template metaprogram. The assembler will run at compiletime and generate machine code that can be run in as part of the compiled program, similar to [inline assembly](http://en.cppreference.com/w/cpp/language/asm). We'll define a simple embedded domain specific language directly in C++ to express our assembly programs. By building the language directly in C++, we get a lot for free, such as powerful type checking and macro-like operations, and the syntax is not as horrific as you may imagine.

```cpp
Asm<int>(
    MOV(ecx, 5_d),
    MOV(eax, 0_d),
"start"_label,
    CMP(ecx, 0_d),
    JE("done"_rel8),
    ADD(eax, 6_d),
    DEC(ecx),
    JMP("start"_rel8),
"done"_label,
    RET()
);
```

Feel free to checkout the complete source [on Github][src]. It's far from complete, but it supports many basic operations. 

{% include image.html file="BigBroadcast_attackdog.jpg" description="I hear it's gonna be a good time yo, and you're gonna like it." %}

# Overview
Assemblers are conceptually pretty simple: they map [assembly mnemonics](https://en.wikipedia.org/wiki/Assembly_language#Opcode_mnemonics_and_extended_mnemonics) to machine code. More advanced assemblers may support symbols and macros, but, if anything, implementing a basic assembler is more tedious than challenging. At least, that is the case when targeting a RISC assembly language, the kind covered in your typical CS class and most books on the subject. When it comes to x86 assembly, that most CISCy of CISCers, all bets are off.

## x86
The x86 instruction set architecture is expansive: around one thousand top level instructions by my rough estimate, with about 3500 instruction forms (overloads) among the lot. That right off is one challenge, but a manageable one. While it would be impractical to write the encoding of each instruction by hand, we can write scripts to generate code for each instruction from a specification. Instructions follow a common format, so, if we do things correctly, we'll only have to implement something like memory address encoding once.

But there's more to x86 assembly's complexity than operation breadth. Take addressing modes. There are so many goddamn addressing modes that the [`mov` operator itself is Turing-complete](http://www.cl.cam.ac.uk/~sd601/papers/mov.pdf). And a whole lot of complexity comes from x86's legendary backwards compatibility (fossil records indicate that T.Rex cut his teeth, so to speak, programming x86 assembly in the Cretaceous Period, and that was 70 million years ago). 

{% include image.html file="me-grimlock-sharkticons-transformers-animated-movie.jpg" description="Crushing that code - Charles R. Knight, 1897" %}

It's impressive just how much engineers have been able to cram into the instruction set over the years, including the transitions from 16 to 32bits and from 32 to 64bits, but, at the machine code level at least, the consequence of such augmentation is clear.

All this to say, writing an x86 assembler is considerably more complicated than writing a MIPS assembler. That does not mean the task is unmanageable though, the assembler is still basically just a big mapping function after all, but it's gonna be one hell of a function.

## Pseudo Inline Assembly
Our compiletime assembler will take an assembly program, written in C++ as a small embedded domain specific language, and output machine code. And because the compiled program itself will be run on an x86 machine, we can evaluate the generated machine code directly within the compiled program. 

For [this year's underhanded C contest](/underhanded-c-2015/), I also looked at embedding machine code in a C program, albeit in a much simpler manner. To summarize the approach: a C style function pointer is just a pointer to code and, through the magic of casting, there is nothing to stop us from converting any byte array into a function pointer. Call the resulting function and the byte array is evaluated as raw machine code.

```cpp
using fptr = int(*)();
const char* return4 = "\xB8\x04\x00\x00\x00\xC3";
auto func = (fptr)return4;
func(); // 4
```

We'll use the same basic approach to write the machine code our assembler generates back into the program, and to invoke this machine code at runtime. This does limit the assembly program to being a function, but that's no so bad. Functions even let us pass in arbitrary data in as arguments.

## Embedded Language
Most previous *Stupid Template Tricks* have been run your of the mill template metaprogramming, so what do we gain by writing an *embedded* domain specific language to express the assembly? Well consider the following:

```cpp
// What a pure template approach may look like.
ASM<
    MOV<ecx, add<dword<5>, dword<2>>>,
    Label<'s', 't', 'a', 'r', 't'>,
    ...>;

// Using an embedded domain specific language instead.
ASM(
    MOV(ecx, 5_d + 2_d),
    "start"_label,
    ...);
```

Both approches are forms of a domain specific language and produce the exact same compiletime result. But whereas the pure template approach uses templates exclusively to built up a computation, the metaprogram built with the embedded domain specific language can use C++ language syntax, such operators and operator overloading. Values are only used to shuttle around the types. Using C++ language features makes the language more familiar and more expressive. 

As the syntax of the targeted language becomes more complicated, the benefits of the embedded language become much more clear. Trying to write good looking memory addressing in pure template code for example is a bit of a nightmare, but it's easy when we can overload the subscript operator and the `+` and `*` operators. 

# Byte String
Our template assembler will take assembly code and output a byte array of machine code. We've worked with compiletime byte arrays before, using them as strings for [parsing][stt-parsing] and playing [Tetris][stt-tetris]. The only new requirement this time around is that our compiletime string must have a static memory data address that we can treat as a function pointer later.

`ByteString` encodes an array of bytes, exposing the complete byte array as the static `data` member.  

```cpp
template <char... chars>
struct ByteString {
    static constexpr size_t size = sizeof...(chars);
    static const char data[sizeof...(chars)];
};

template <char... chars>
const char ByteString<chars...>::data[] = { chars... };
```

The `ToBytes` interface converts a type into a byte string. We'll use it to encode immediate values and other simple types.

```cpp
template <typename>
struct ToBytes;

template <char... characters>
struct ToBytes<ByteString<characters...>> {
    using type = ByteString<characters...>;
};

template <typename x>
using to_bytes = typename ToBytes<x>::type;
```

## Combing Byte Strings
Machine code is made up of individual instructions, and each instruction is made up of a number of [components](http://www.c-jump.com/CIS77/CPU/x86/lecture.html#X77_0020_encoding_overview): prefixes, the operator, and operand data. Each of these components may be further broken into bit level meanings, but all of our encoding logic will operate on bytes. 

`bytes_add` is the base function that combines two byte strings.

```cpp
template <typename l, typename r>
struct BytesAdd;

template <char... ls, char... rs>
struct BytesAdd<ByteString<ls...>, ByteString<rs...>> {
    using type = ByteString<ls..., rs...>;
};

template <typename l, typename r>
using bytes_add = typename BytesAdd<to_bytes<l>, to_bytes<r>>::type;
```

`bytes_join` does the same, but for one or more arguments.

```cpp
template <typename...>
struct BytesJoin {
    using type = ByteString<>;
};

template <typename x, typename... xs>
struct BytesJoin<x, xs...> {
    using type = bytes_add<x, typename BytesJoin<xs...>::type>;
};

template <typename... args>
using bytes_join = typename BytesJoin<args...>::type;
```

## Integers to Bytes
One final useful opperation is converting an integer to it's byte string representation. `IntToBytes` takes an integer`x` and the number of bytes to generate, and returns a byte string

```cpp
template <size_t bytes, long long x>
struct IntToBytes {
    using type = bytes_add<
        ByteString<static_cast<char>(x & 0xff)>,
        typename IntToBytes<bytes - 1, (x >> 8)>::type>;
};

template <long long x>
struct IntToBytes<0, x> {
    using type = ByteString<>;
};
```

# Operands
Each x86 operator takes between zero and three operands. At the machine code level, an operand can be a register, immediate, or memory address, the assembler having replaced symbols within the program with their values. Our assembler will target [NASM syntax][nasm], which orders operands `mov DEST, SRC`. 

## General Purpose Registers
[General purpose registers](https://en.wikibooks.org/wiki/X86_Assembly/X86_Architecture#x86_Architecture) are fixed size registers. For each size, an index uniquely identifies the register when encoding instructions.

```cpp
template <size_t s, size_t i>
struct GeneralPurposeRegister {
    static constexpr size_t size = s;
    static constexpr size_t index = i;
};
```

On a 32bit machine, here's the eight top level general purpose registers. 

```cpp
constexpr auto eax = GeneralPurposeRegister<4, 0>{};
constexpr auto ecx = GeneralPurposeRegister<4, 1>{};
constexpr auto edx = GeneralPurposeRegister<4, 2>{};
constexpr auto ebx = GeneralPurposeRegister<4, 3>{};
constexpr auto esp = GeneralPurposeRegister<4, 4>{};
constexpr auto ebp = GeneralPurposeRegister<4, 5>{};
constexpr auto esi = GeneralPurposeRegister<4, 6>{};
constexpr auto edi = GeneralPurposeRegister<4, 7>{};
```

The complete source also defines 16bit, 8bit, and 64 bit registers. Segment registers and SIMD regiters are currently not supported. 

# Immediates
Immediates are constant values, such as `0` or `-42`. We'll only worry about integer immediate values for now. All the actual instruction encoding will be implemented using templates, so we have to find a way to encode a value like `-42` as a type.

`Immediate` handles this encoding for us. It's similar to `std::integral_constant`, but stores additional metadata about the value (`size`) and provides some common operator overloads.

```cpp
template <typename T, T x>
struct Immediate {
    using type = T;
    static constexpr T value = x;
    static constexpr size_t size = sizeof(T);
    
    constexpr auto operator-() const {
        return Immediate<T, static_cast<T>(-x)>{};
    }
};
```

We can borrow the much of the compiler's arithmetic logic by overloading operators on `Immediate`.

```cpp
template <typename L, L lx, typename R, R rx>
constexpr auto operator+(Immediate<L, lx>, Immediate<R, rx>) {
    return Immediate<L, static_cast<L>(lx + rx)>{};
}

template <typename L, L lx, typename R, R rx>
constexpr auto operator-(Immediate<L, lx>, Immediate<R, rx>) {
    return Immediate<L, static_cast<L>(lx - rx)>{};
}
```

Note that while all of these operator overloads take values, we only care about the types of the values and the type of the result. This allows us to use normal C++ syntax, such as operators in our embedded language, instead of writing everything with lispy looking pure template code. 

## Bytes and Words and DWords! Oh My!
Our assembler will support four sizes of immediates: 8bit (byte), 16bit (word), 32bit (dword), and 64bit (qword). Instead of writing `byte<4>`, we can abuse C++ user defined operators for our mini assembly language. The full implementation for constructing value types from C++ literals was [previously covered](/stupid-template-tricks-stdintegral_constant-user-defined-literal/) and simply referenced here as `ImmediateFromString`. `4_b` creates a byte, `4_w` creates a word, `4_d` creates a dword, and `4_q` creates a qword.

```cpp
template <int8_t x>
using byte = Immediate<int8_t, x>;

template <char... values>
constexpr auto operator ""_b() {
    return typename ImmediateFromString<typename byte<0>::type, values...>::type{};
}

template <int16_t x>
using word = Immediate<int16_t, x>;

template <char... values>
constexpr auto operator ""_w() {
    return typename ImmediateFromString<typename word<0>::type, values...>::type{};
}

template <int32_t x>
using dword = Immediate<int32_t, x>;

template <char... values>
constexpr auto operator ""_d() {
    return typename ImmediateFromString<typename dword<0>::type, values...>::type{};
}

template <int64_t x>
using qword = Immediate<int64_t, x>;

template <char... values>
constexpr auto operator ""_q() {
    return typename ImmediateFromString<typename qword<0>::type, values...>::type{};
}
```


# Memory
x86 memory addressing is complex, both in range of addressing modes the instruction set supports as well as how these addressing modes are encoding. Let's start by considering a few valid forms of memory addressing:

* `[0x1234]` - Direct
* `[esi]` - Base 
* `[ebx + 8]` - Base + displacement
* `[esi + ebx]` - Base + index 
* `[esi + ebx + 8]` - Base + index plus displacement
* `[esi + ebx * 2]` - Base + scaled index
* `[esi + ebx * 2 + 8]` - Base + scaled index + displacement
* `[ebx * 2]` - Scaled only
* `[ebx * 2 + 8]` - Scaled only + displacement

## Base Only
{% include image.html file="9.JPG" description="Heap corruption, Oh yeah!" %}

The form `[esi + ebx * 2 + 8]` is the most complex of the lot, with all other modes being a subset of it. Breaking it down, its components are:

* Base register (`esi`).
* Index register (`ebx`).
* Scaling factor literal (`2`).
* Displacement literal (`8`).

All of these components are optional and may appear in any combination. The scale is limited to either 1, 2, 4, or 8 (the default is 1 if not specified), while the displacement may be a signed 8, 32, or 64 bit number.

Since memory addresses are all subsets of a single form, we'll use a single type, `Memory`, to encode all memory address. Differences in type of address will be handled during encoding.

The additional `size` parameter of `Memory` is the size in bytes of the memory targeted (typically 1, 2, 4, or 8) and is used to select the correct overload for certain instructions.

```cpp
using Displacement = int32_t;

template <
    size_t size,
    typename reg1,
    typename reg2,
    size_t scale,
    Displacement disp>
struct Memory {
    static_assert(
        scale == 0 || scale == 1 || scale == 2 || scale == 4 || scale == 8,
        "Invalid scale.");
};
```

`scale` 0 indicates default scaling, and will later be encoded as 1. This project does not support all features of x86 memory addressing, such as 64 bit displacements.

## Sugar
In [NASM assembly syntax][nasm], `[...]` creates a memory address while `+` adds a displacement. Scaling factors are created with `*` and may also be added to a base.

We can emulate much of this syntax by overloading subscript `[]` operator, but in C++ the subscript operator must be defined on something, so let's use the most understated identifier possible: `_`

```cpp
struct None { };

constexpr struct {
    template <size_t size, size_t index>
    constexpr auto operator[](GeneralPurposeRegister<size, index> r) const {
        return Memory<size, decltype(r), None, 0, 0>{};
    }
    
    template <size_t size, typename reg, typename reg2, size_t mult, Displacement disp>
    constexpr auto operator[](Memory<size, reg, reg2, mult, disp> mem) const {
        return mem;
    }
} _ { };
```

`_` allows writing `_[eax]` to create a memory address from a register, the special `None` type being used to indicate the lack of a register value for the index register. The second subscript overload of `_` will allow us to more easily support the other memory addressing forms with a consistent syntax.

## Displacement
Displacement is a signed number added to the base memory address. The binary `+` and `-` operators are overloaded for a memory address and an `Immediate` displacement value.

```cpp
template <size_t size, typename reg1, typename reg2, size_t scale, Displacement disp, typename T, T x>
constexpr auto operator+(
    Memory<size, reg1, reg2, scale, disp>,
    Immediate<T, x>)
{
    return Memory<size, reg1, reg2, mult, disp + x>{};
}

template <size_t size, typename reg1, typename reg2, size_t mult, Displacement disp, typename T, T x>
constexpr auto operator-(
    Memory<size, reg1, reg2, mult, disp>,
    Immediate<T, x>)
{
    return Memory<size, reg1, reg2, mult, disp - x>{};
}
```

The above enables forms such as: `_[ebx] + 8_b`. Any number of displacements can be added to a memory address, with the compiler automatically combining all the displacements before the code is assembled. 

To support the more NASM-like syntax `_[ebx + 8_b]`, we'll also overload the binary `+` and `-` operators for a register plus an `Immediate`.

```cpp
template <size_t size, size_t index, typename T, T x>
constexpr auto operator+(
    GeneralPurposeRegister<size, index> r,
    Immediate<T, x> disp)
{
    return _[r] + disp;
}

template <size_t size, size_t index, typename T, T x>
constexpr auto operator-(
    GeneralPurposeRegister<size, index> r,
    Immediate<T, x> disp)
{
    return _[r] - disp;
}
```

The [source][src] also includes flipped versions of all these overloads, so you can write addresses like: `_[2_b + ebx - 8_b]`.

## Scaling
[Scaled index](https://courses.engr.illinois.edu/ece390/books/artofasm/CH04/CH04-3.html#HEADING3-49) part of a memory address consists of a index register and a scaling factor. The scaling factor is just a constant value, either 1, 2, 4, or 8. Scaling factors are created with `*` in NASM assembly syntax, so we'll overload the `*` operator in C++ on a register and an `Immediate` scaling factor

```cpp
template <size_t size, size_t index, typename T, T x>
constexpr auto operator*(
    GeneralPurposeRegister<size, index> r,
    Immediate<T, x>)
{
    return Memory<size, None, decltype(r), x, 0>{};
}
```

Further overloads of the `+` operator add a base register to a scaled index memory address. There are a few cases to handle, depending on whether the base and index were previously converted to `Memory` types or not.

```cpp
template <size_t size, size_t index, typename reg2, Displacement disp, size_t scaling>
constexpr auto operator+(
    GeneralPurposeRegister<size, index> reg1, 
    Memory<size, None, reg2, scaling, disp>)
{
    return Memory<size, decltype(reg1), reg2, scaling, disp>{};
}

template <size_t size, typename reg1, typename reg2, Displacement disp1, Displacement disp2, size_t scaling>
constexpr auto operator+(
    Memory<size, reg1, None, 0, disp1>,
    Memory<size, None, reg2, scaling, disp2>)
{
    return Memory<size, reg1, reg2, scaling, disp1 + disp2>{};
}

template <size_t size, typename reg1, Displacement disp, size_t reg2Size, size_t reg2Index>
constexpr auto operator+(
    Memory<size, reg1, None, 0, disp> m,
    GeneralPurposeRegister<reg2Size, reg2Index> r)
{
    return m + r * 1_d;
}
```

These overload allow us to write forms like `_[esi + ebx]`, `_[esi + ebx * 2_b]`, and `_[esi + 8_b + ebx * 2_b]` while also producing compiler error for invalid memory addresses like `_[eax + ebx + ebp]` or `_[eax * 2 + eax * 4]`.


# Double Assembled for Twice the Assembly


Consider this simple assembly fragment:

```
    jmp a
    mov eax, 4
.a
    mov eax, 3
```

Clearly the `a` in `jmp a` should refers to the label below, but how can our poor computer reading the assembly sequentially know this? Perhaps `a` is never defined or perhaps it is defined so far away that a different `jmp` instruction overload has to be used. Checking all this in a single pass is not practical, so we'll instead use a two pass assembler: pass one to generate the symbol table and pass two to generate the machine code. 

## Symbol Table
The symbol table maps symbols to program values. We'll only use our symbol table to map labels to code indicies at the moment, but many assemblers support more advanced uses of symbols (being embedded in C++ gets us a lot of this for free).

We don't need anything fancy, in fact, pretty much the most simple symbol table possible will work for our assembler: the symbol table as a list of key value pairs.

```cpp
template <typename key, typename value>
struct SymbolTableEntry { };

template <typename... elements>
using SymbolTable = List<elements...>;

using empty_symbol_table = List<>;
```

A more comprehensive symbol table implementation might support [forward and backward symbol lookup](http://docs.oracle.com/cd/E18752_01/html/817-5477/eqbsx.html), but let's just keep thinks super simple and disallow redefining symbols all together. `symbol_table_add` inserts a new entry into the symbol table, explicitly checking that no entry currently exists.

```cpp
template <typename name>
struct duplicate_symbols_not_allowed;

template <typename key, typename value, typename table>
using symbol_table_add = typename std::conditional_t<
    std::is_same<
        None,
        symbol_table_lookup<None, key, table>>::value,
    identity<cons<SymbolTableEntry<key, value>, table>>,
    duplicate_symbols_not_allowed<key>>::type;
```

`duplicate_symbols_not_allowed` is intentionally left undefined so that if the compiler attempts to access `duplicate_symbols_not_allowed<key>::type`, it generates a meaningful error message:

```
Implicit instantiation of undefined template 'duplicate_symbols_not_allowed<Label<'b', 'a', 'd', 'l', 'a', 'b', 'e', 'l'> >'
```

`symbol_table_lookup` looks up a symbol's value in the symbol table, returning a default value if the symbol is undefined:

```cpp
template <typename def, typename key, typename map>
struct SymbolTableLookup {
    using type = typename SymbolTableLookup<def, key, cdr<map>>::type;
};

template <typename def, typename key, typename value, typename... xs>
struct SymbolTableLookup<def, key, SymbolTable<SymbolTableEntry<key, value>, xs...>> {
    using type = value;
};

template <typename def, typename key>
struct SymbolTableLookup<def, key, empty_symbol_table> {
    using type = def;
};

template <typename def, typename key, typename map>
using symbol_table_lookup = typename SymbolTableLookup<def, key, map>::type;
```

## State
The symbol table is one part of the assembler's state, the other component being the address of the current instruction (relative to the first instruction in our assembler). 

To keep things as simple as possible, both pass one and pass two of our assembler will operate on essentially the same assembly program data. The differences in behavior between the two passes will come from different implementations of the state object each pass takes.

Both pass one and pass two specialize the `BaseState` for common functionality.

```cpp
template <template <size_t, typename> class self, size_t ic, typename _labels>
struct BaseState {
    /// Location of current instruction.
    static constexpr size_t index = ic;
    
    /// List of valid labels in the program.
    using labels = _labels;
    
    /// Increment the instruction counter by `x` bytes.
    template <size_t x>
    using inc = self<index + x, labels>;
};
```

In pass one, we expect forward reference symbol lookups to fail. These failure are perfectly acceptable; pass one only generates the symbol table, the symbol values themselves are not needed until pass two. Any undefined lookups return `None`, which will not treated as an error during pass one.

```cpp
template <size_t lc, typename _labels>
struct Pass1State : BaseState<Pass1State, lc, _labels> {
    template <typename name>
    using lookup_label = symbol_table_lookup<None, name, _labels>;
    
    template <typename newLabel>
    using add_label = Pass1State<lc,
        symbol_table_add<newLabel, LabelOffset<lc>, _labels>>;
};

using pass1state = Pass1State<0, empty_symbol_table>;
```

The symbol table is complete by the time we run pass two. At this stage, it is still possible that a symbol may be undefined, but, this time around, instead of returning `None` we'll generate a compiletime error.

`lookup_label` in pass two passes the undefined `no_such_label` type to `symbol_table_lookup` as the default value. If an undefined symbol is referenced, the compiler will generate an error  stating that `no_such_label<...>` is undefined. 

```cpp
template <typename label>
struct no_such_label;

template <size_t lc, typename _labels>
struct Pass2State : BaseState<Pass2State, lc, _labels> {
    template <typename name>
    using lookup_label =
        symbol_table_lookup<no_such_label<name>, name, _labels>;
    
    template <typename newLabel>
    using add_label = Pass2State<lc, _labels>;
};

template <typename pass1state>
using pass2state = Pass2State<0, typename pass1state::labels>;
```

Additionally, `add_label` is a noop in pass two.


# You're Nobody 'Til Somebody Assembles You
An assembly program is just a list of instructions and assembly directives. No nesting, syntax trees, or anything like that. And the only (sort-of) directives we care for our simple assembler are program labels. Labels and instructions go in, machine code comes out. 

As we've seen with the symbol table, the assembler must be able to thread state through the top level units during assembly, very much like the state monad in Haskell. Think of each unit of the assembly as a function, a function that that takes an input state and returns an output state along with some generated machine code. Simple instructions may return constant machine code and only increment the instruction counter of the state, whereas a label may update the state but not generate any machine code. 

## Instruction
`Instruction` is the base unit that we'll use for all x86 instructions. It encodes the 1 to 15 byte machine code for a single x86 instruction, such as `MOV` or `JMP`. `components` is a list of `ByteStrings` or objects that can be converted to `ByteStrings`. During assembly, after simple rewriting pass, `Instruction` joins these components together into the final machine code for the entire instruction. 

```cpp
template <typename... components>
struct Instruction  {
    static constexpr size_t size = (... + components::size);
    
    template <typename state>
    struct apply {
        using next_state = typename state::template inc<size>;
        using code = fmap<typename Rewrite<next_state>, List<components...>;
        using type = Pair<next_state, fold<
            mfunc<bytes_join>,
            ByteString<>,
            code>>>;
    };
};
```

The list of components of an instruction may contain symbols that must be resolved before the machine code is generated. For our simple assembler, we only have to worry about replacing label references with the correct relative jump offsets. 

The `fmap` in `Instruction` uses the `Functor` interface for a list that we've [previously used][stt-tetris] to apply `Rewrite` to each element of `components`. `fold` uses the `Foldable` interface to combine the resulting byte strings.

`Rewrite` looks for sized labels, and replaces them with jumps computed relative to the current instruction counter.

```cpp
template <size_t size, typename state, typename labelOffset>
struct GetOffset : IntToBytes<size,
    static_cast<long long>(labelOffset::value - state::index)> { };

template <size_t size, typename state>
struct GetOffset<size, state, None> : IntToBytes<size, 0> { };

template <typename state>
struct Rewrite {
    template <typename x>
    struct apply {
        using type = x;
    };
    
    template <size_t s, typename x>
    struct apply<Rel<s, x>> :
        GetOffset<s, state, typename state::template lookup_label<x>> {};
};
```

The programmer must still explicitly specify the size of the expected jump on the instruction though, either 8 or 32 bits:

```cpp
 Asm<int>(
    MOV(eax, 3_d),
    JMP("a"_rel8),
    ADD(eax, 2_d),
"a"_label,
    RET()
)
```

In this example, if `a` turns out to be more than 128 bytes away, our assembler will produce undefined machine code. A more complete assembler would select the correct `jmp` overload during pass two, depending on the actual size of the jump needed.

## Encoding and Generating Instructions
I'll just provide a quick overview of how all the instructions are generated here. The [actual code][src] is not all that interesting.

For our language, we'll use C++ functions for each instruction

```cpp
template <size_t a, int8_t b>
constexpr auto MOV(GeneralPurposeRegister<1, a>, byte<b>) {
    return Instruction<...>{};
};
```

This supports instructions overloads easily, and also makes the language somewhat more palatable: `MOV(eax, 1_d)`. As for actually generating all those instructions, I used a simple Javascript program to transform a x86 specification XML file into C++ source code. The coder generator is pretty horrific code, even by Javascript standards:

```js
var code = `template <${parameters.join(', ')}>
constexpr auto ${name}(${special.join(', ')}) {
    return ${encoding};
};`;
```

But it gets the job done. The xml file specifies the encoding of each instruction as well. Instruction encodings share many components, such as [REX prefixes](rex prefix encoding) and [ModR/M and SIB bytes](http://wiki.osdev.org/X86-64_Instruction_Encoding#ModR.2FM_and_SIB_bytes). The actual logic for generating the encoding is mixed between C++ and the Javascript. The Javascript may know that a REX byte of modrm byte is required for example:

```cpp
/// Example output from Javascript program
template <size_t a, int8_t b>
constexpr auto MOV(GeneralPurposeRegister<1, a>, byte<b>) {
    return Instruction<
        make_rex<0,0,0,get_rex_b(GeneralPurposeRegister<1, a>{})>,
        Opcode<'\xC6'>,
        typename modrm<0, GeneralPurposeRegister<1, a>, byte<b>>::type, to_bytes<byte<b>>>{};
};
```

But logic like `make_rex` and `modrm` are implemented in normal C++. Again, the logic for these is not too interesting. Take a look at [the source][src] for the details. 


## Labels
Labels are the other top level units of assembly code. A label attaches a symbol to an address in the the assembly code itself and are purely an assembly language construct, they generate no code, and indeed machine code has no real concept of labels at all.

During assembly, labels update the state to map the label symbol to the current instruction counter with `add_label` on the state object. 

```cpp
template <char... chars>
struct Label {
    template <typename state>
    struct apply {
        using type = Pair<
            typename state::template add_label<Label<chars...>>,
            ByteString<>>;
    };
};

template <typename T, T... chars>
constexpr auto operator""_label() { return Label<chars...>{}; };
```


## Sequencing
Our simple assembler does not need the full power of a state monad, so we can get away with a simple sequencing operation instead. `next` runs `p` and then `c`, concatenating the generated machine code:

```cpp
template <typename p, typename c>
struct next {
    template <typename s>
    struct apply {
        using left = call<p, s>;
        using right = call<c, typename left::first>;
        using type = Pair<
            typename right::first,
            bytes_add<typename left::second, typename right::second>>;
    };
};
```

`seq` does much the same but for a list of one or more instructions.

```cpp
template <typename x, typename... xs>
using seq = fold<mfunc<next>, x, List<xs...>>;
```

When dealing with macro-like functions later, we'll use the `block` to generate a sequence of assembly instructions from function parameters. `block` adds no actual logic and is only used to pass around types.

```cpp
template <typename x, typename... xs>
constexpr auto block(x, xs...) {
    return seq<x, xs...>{};
}
```

# I am given birth to nothing but machine code
{% include image.html file="TFTM_Junkions.JPG" %}

Bringing everything together, `assemble` converts an assembly program into machine code at compile time. Pass one is run first on the program to generate symbol table, then pass two is run with the resulting symbol table. The result of `assemble` is a `ByteString` of machine code.

```cpp
template <typename program>
using assemble = typename call<
    program,
    pass2state<typename call<program, pass1state>::first>>::second;
```

As for actually evaluating the machine code at runtime, `AsmProgram` wraps the machine code in a functor of return type `R` and forward arguments to it.

```cpp
template <typename R, typename P>
struct AsmProgram {
    using program = P;
    
    template <typename... Args>
    R operator()(Args... args) {
        return ((R(*)(std::decay_t<Args>...))P::data)(args...);
    }
};
```

The `Asm` function is sugar for creating an `AsmProgram`. It takes a return type `R` and a sequence of one or more assembly instructions, and returns a functor. 

```cpp
template <typename R, typename x, typename... xs>
constexpr auto Asm(x, xs...) {
    return AsmProgram<R, assemble<seq<x, xs...>>>();
}
```

The resulting syntax is actually not that bad. 

```cpp
Asm<int>(
    MOV(eax, 3_d),
    RET()
)();

auto y = Asm<int>(
    MOV(eax, 3_d),
    JMP("a"_rel8),
    ADD(eax, 2_d),
"a"_label,
    RET()
);
y(1, 2, 3);
```

Accessing args using `ebp`:

```cpp
Asm<int>(
    MOV(edx, 0_d),
    MOV(eax, _[ebp - 0xc_b]),
    MOV(ecx, _[ebp - 0x10_b]),
    DIV(ecx),
    MOV(ecx, _[ebp - 0x14_b]),
    DIV(ecx),
    RET()
)(100, 5, 4) // 5
```

```cpp
int ret66() { return 66; }

Asm<int>(
        MOV(rbx, _[rsp + 8_d]),
        CALL(rbx),
        ADD(eax, 2_d),
        RET()
)(&ret66);
```

## Macro-ish 
One quick final thought on the power of embedding the assembly in C++. Because the assembly source is just C++ values and types, we can use any template metaprogramming techniques to manipulate the assembly code. One simple example is writing basic macros within the language: 

```cpp
template <typename Count, typename... Body>
constexpr auto do_x_times(Count count, Body... body) {
    return block(
        MOV(ecx, count),
    "start"_label,
        CMP(ecx, 0_d),
        JE("done"_rel8),
        body...,
        DEC(ecx),
        JMP("start"_rel8),
    "done"_label);
}
```

```cpp
Asm<int>(
    MOV(eax, 0_d),
    do_x_times(5_d,
        ADD(eax, 6_d)),
    RET()
)();
```

Again, using C++ directly gets us a lot for free. 

# Conclusion


C++ templates metaprogramming enables the development of fairly powerful embedded domain specific languages and can make templates metaprograms much more expressive. x86 assembly may not be the most practical application of this, but I feel that this is an interesting little project and, with a little work, we could probably make our simple assembler more portable and support a pretty good subset of x86 assembly language.

Check out the [complete source][src] and send a pull request or open a bug if you would like a new instruction supported or find a bug (there are plenty of them).


PS. While this post started off well enough, I can't help but feel that relying on runtime evaluation of the assembly program is somewhat of a debasement. Why must we rely on runtime at all? Why not evaluate the machine code with templates? Replace the rotten old runtime with a clean new compiletime! The time is coming! More Template! More Template!


[src]: https://github.com/mattbierner/Template-Assembly

[stt-tetris]: /stupid-template-tricks-super-template-tetris/

[stt-parsing]: /stupid-template-tricks-pride-and-parser-combinators-part-one/

[addressing-modes]: http://www.ic.unicamp.br/~celio/mc404s2-03/addr_modes/intel_addr.html 


[mod-rm]: http://www.c-jump.com/CIS77/CPU/x86/X77_0060_mod_reg_r_m_byte.htm
[x86-instruction-encoding]: https://events.linuxfoundation.org/sites/events/files/slides/bpetkov-x86-hacks.pdf

[nasm]: https://en.wikibooks.org/wiki/X86_Assembly/NASM_Syntax

