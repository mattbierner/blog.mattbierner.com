---
layout: post
title: Apep-std and Apep Example Grammars
date: '2015-11-15'
---
It's been a little over a week since the initial release of [Apep][], and version 1.3.0 is now out. Performance is significantly better, heavy-weight dependencies are no longer required, and the API is more expressive and powerful.

Here's a few other updates on what's going on with Apep.

# Apep-std
The core Apep library is very small, so it doesn't quite capture all the functionality of the [Dada engine][dada]. That's where Apep-std comes in. Apep-std is a collection of libraries that each add targeted functionality:

* `sep` - [Apep-std-sep](https://github.com/mattbierner/apep-std-sep) - Helper combinators for working with sequencing generators.
* `transformations` - [Apep-std-transformations](https://github.com/mattbierner/apep-std-transformations) - Transforming text (capitalization, replacement, matching, ...).
* `vars` - [Apep-std-vars](https://github.com/mattbierner/apep-std-vars) - Working with variables (caching values).

These sub libraries can be consumed individually or through Apep-std. Together, these libraries provide all the functionality of the original Dada Engine, plus more.

# Fifty Shades of Dispepsia
I've also been porting a few Dada engine grammars over to Apep and, looking for something a bit more complicated, I found [Lisa Wray's Fifty Shades Dada Engine Text Generator](https://github.com/lisawray/fiftyshades).

The port was pretty straightforward. Here's part of the original grammar:

```
fetish-paragraph: 
    statement-of-fetish-obj statement-of-nervousness [statement-of-fetish-obj3 | statement-of-fetish-obj2]
    | transition statement-of-fetish-obj3  statement-of-fetish-obj statement-of-fetish-obj2
    | statement-of-fetish-obj ITALIC(interjection) ". " statement-of-fetish-obj2 
    ;

statement-of-fetish-obj:
     "His " fetish-obj " " fetish-obj>is-positioned " " fetish-obj>on-top-of ". " 
    | fetish-obj>demonstrative-pronoun>upcase-first " " fetish-obj "! We've never used " fetish-obj>article " "     
        fetish-obj " before. ";
```

And here's the Apep code:

```js
const fetishParagraph = pep.declare(() =>
    pep.choice(
        [statementOfFetishObj, statementOfNervousness,
            pep.choice(statementOfFetishObj3, statementOfFetishObj2)],
        [transition, statementOfFetishObj3, statementOfFetishObj,
            statementOfFetishObj2],
        [statementOfFetishObj, md.italic(interjection), ". ",
            statementOfFetishObj2]));

const statementOfFetishObj = pep.declare(() =>
    pep.choice(
        ["His ", fetishObj, " ", isPositioned(fetishObj), " ",
            onTopOf(fetishObj), ". "],
        [capitalize(demonstrativePronoun(fetishObj)), " ",
            fetishObj, "! We've never used ", fetishArticle, " before. "]));
```

One tradeoff of embedding Apep grammars in Javascript is that the syntax is a bit more messy looking – the commas are especially annoying – but it's not bad really, and the power of writing in Javascript directly should be pretty clear.

Here's one sample of the output. This was a direct port, so all credit for the grammer goes to Lisa Wray.

> He stalks gracefully forward. My mouth goes dry. I worry, again, that I'm not enough for him. That paddle! We've never used a paddle before. His fingers brush the paddle, and everything south of my waist tightens deliciously. 
>
> 'I am going to teach you a lesson,' he whispers, his eyes smoldering, and everything in my body tightens as I tingle ... everywhere. 
>
> 'Yes.' My voice is barely audible. 
>
> 'Tell me what you want,' he growls, his gaze burning. He cups my face gently, my insides liquefying. 
>
> He reaches down, and my stomach somersaults. He softly kisses my bottom lip, his eyes glowing with lust. I can hear music faintly. He always puts songs on repeat in here. His hand tightens around my hair at my nape, lifting his other hand to cradle my face. 
>
> Moving suddenly, he shoves me against the wall. He holds me against his hips, and I groan loudly, panting. His fingertips run down my neck. How can he do this to me?

*Fifty Shades of Gray* is around 100,000 words long, and Apep can 100,000 words worth of these excerpts in half a second. You can find the [port on Github](https://github.com/mattbierner/fifty-shades-of-dyspepsia/).


# Post-Apeptide
(This wordplay is getting rather out of hand.)

Perhaps the most famous use of the Dada Engine is [Andrew C. Bulhak's Post Modernism generator](http://www.elsewhere.org/pomo/). This grammar is fairly complicated and makes use of a few additional features from Apep-std, such as regular expression matching and variable storage.

Again, the Apep syntax is pretty close to the original:
 
```
pluralise:
    ".*y$" -> "y$"/"ies"
    ".*s$" -> "$"/"es"
    ".*" -> "$"/"s"
;
```
 
```js
const pluralise = pep_trans.match()
    .case(/(.*)y$/,   (_, x) => x + 'ies')
    .case(/(.*s)$/,   (_, x) => x + 'es')
    .case(/.*/,       (x) => x + 's');
```

And here's an example of what this grammar outputs:

------

<pre>
# Realities of Stasis: Patriarchial narrative in the works of Burroughs
G. Helmut Humphrey Department of Peace Studies, University of Illinois

# narratives of genre
If one examines Derridaist hyperreality, one is faced with a choice: either accept capitalist sublimation or conclude that expression comes from the collective unconscious, but only if neocapitalist semanticism is valid; otherwise, we can assume that the significance of the reader is social comment, but only if Derridaist hyperreality is valid; if that is not the case, we can assume that art may be used to marginalize minorities, but only if art is interchangeable with truth. Debord suggests the use of Derridaist hyperreality to analyse sexual identity. An abundance of narratives concerning Derridaist hyperreality may be discovered. 

"Consciousness is part of the genre of culture," says Lyotard; however, according to Humphrey [1] , it is not so much society that is part of the absurdity of art, but rather the paradigm, and eventually the collapse, of society. Therefore, Derrida uses the term 'Derridaist hyperreality' to denote not, in fact,  deappropriation, but neotheory. Thus, the subject is contextualised into a patriarchial narrative that includes sexuality as a paradox. The subject is contextualised into a Derridaist hyperreality that includes sexuality as a totality. Thus, the primary theme of Sargeant's [2] essay on poststructural prepatriarchial theory is a postconstructivist whole. However, Lyotard's model of patriarchial narrative holds that the task of the participant is deconstruction, given that consciousness is distinct from art. If postcapitalist theory holds, we have to choose between textual desituationism and Derridaist hyperreality. However, Baudrillard uses the term 'Foucaultist 'powerful communication'' to denote a self-falsifying whole. In The Ticket that Exploded, Burroughs affirms Derridaist hyperreality; in The Soft Machine, however,  Burroughs affirms Derridaist hyperreality. 

It could be said that if Derridaist hyperreality holds, the works of Burroughs are empowering. 

Cameron [3] implies that the works of Burroughs are not postmodern. 

The main theme of the works of Burroughs is not, in fact,  semioticism, but postnarrative. A number of theories concerning textual capitalist theory exist. The main theme of Porter's [4] analysis of patriarchial narrative is not situationism, as Lyotard would have it, but subnarrative. The subject is contextualised into a patriarchial narrative that includes sexuality as a totality. The subject is contextualised into a conceptual narrative that includes consciousness as a totality. In a sense, Wilson [5] suggests that we have to choose between Derridaist hyperreality and Derridaist hyperreality. However, if subtextual constructivism holds, we have to choose between Derridaist hyperreality and Derridaist hyperreality. 

The subject is contextualised into a Derridaist hyperreality that includes narrativity as a totality. Sontag's analysis of patriarchial narrative holds that consciousness is used to disempower the underprivileged. The premise of patriarchial narrative implies that society, surprisingly, has intrinsic meaning. 

1. Humphrey, V. G. C. (1986) *Patriarchial narrative in the works of Fellini.* Oxford University Press
2. Sargeant, D. H. C. (1985) *The Burning Door: Patriarchial narrative in the works of Burroughs.* Yale University Press
3. Cameron, X. Q. L. ed. (1986) *Discourses of Failure: Derridaist hyperreality, Baudrillardist reading and patriarchial narrative.* Cambridge University Press
4. Porter, L. (1977) *Capitalist Modernsisms: Derridaist hyperreality and patriarchial narrative.* Harvard University Press
5. Wilson, W. Y. (1974) *Narratives of Meaninglessness: Patriarchial narrative in the works of Burroughs.* Loompanics
</pre>

------

The formatting could be improved, but you get the point.

Here's the [source code for the Apep post modernism generator port](https://github.com/mattbierner/post-apeptide). I've got a few original grammers in progress as well.

And as always, any contributions to Apep are welcome and please report any bugs you encounter.


[dada]: http://dev.null.org/dadaengine/
[apep]: https://github.com/mattbierner/apep
[apep-std]: https://github.com/mattbierner/apep-std