---
layout: post
title: Moby-Dick; or, Whale Not Now Man then Ship Sea More Ahab
series: blotre
date: '2015-06-08'
---
Question: what color is *Moby-Dick*? No, not the white whale, but the text itself? You see, recently I've been thinking about how to encode text for [Blot're][blotre]. Why? Because why not? And why not start big too? Not just tweets or news stories, but whole novels. And there's nothing bigger than *Moby-Dick*.

{% include image.html file="turk1.png" description="Boom! You just read Moby-Dick." %}

In this post, I'll overview my work translating *Moby-Dick* to a stream of colors for use on Blot're. I didn't want to just encode *Moby-Dick* to set of randomly assigned colors either, that would be boring. I wanted to capture the color associations found throughout the book. Basically, what *Moby-Dick* would look like to someone with super strong color synesthesia, so strong that they could longer perceive words at all, just a pure stream of colors?

Starting from the raw text, I'll walk through the entire process translating the text to color. From tokenization and identifying possible color words with Apache [OpenNLP][], to crowd sourcing color associations on [Mechanical Turk][mturk], to generating some neat image representations of the novel, and finally posting the color stream up to [Blot're][blotre].

Now, you may be wondering about the practical applications of all this. Please let me assure you, there are none. And all the better. But I found it an interesting project and I hope you agree.

# Initial Data
My goal was map each word in *Moby-Dick* to a color. Sounds easy enough, but there's a lot of room for interpretation. *Moby-Dick* contains over two hundred thousand words and, since this project's inception, I knew that humans, not computers, would source the color mappings. Asking people to map two hundred thousand words seemed too daunting, so I scoped things down a bit to a more reasonable problem.

I decided to use a dictionary approach. This would allow me to map every distinct word to a color just once, even if that word appeared multiple times in the text. As a result, I decided that each word would be considered on its own, independent of its grammatical context and independent of any symbolism or larger meaning in the text.

The basic translation process would be:

1. Identify every distinct color word in the source text.
2. Construct a word to color association map for all the distinct words.
3. Map every word in the source text to a color using the constructed map.

For step two, I didn't want just the obvious mapping, words for colors like `white` and `blue`. And I also wanted to map more than just words for physical objects such as `whale`, `ocean`, or `blood`. What about more abstract ideas like `hope`, `starbuck`, or `deep`?

I wanted to capture the color association of words, the first color that comes to your mind when you hear that word. That can't be determined algorithmically and it is subjective, there's no correct color association for a word.

But let's not get ahead of ourselves here.

## Tokenization
First step, getting the source text into a usable format. I grabbed the *Moby-Dick* `.txt` file over at [Project Gutenberg][gutenberg] and cracked it open.

Ahhhh, typical Melville. Always with the spaces and the punctuators when a nice JSON array of words would have been so much more convenient. Consider this excerpt:

```
"I thought ye know'd it;--didn't I tell ye, he was a peddlin' heads around town?--but turn flukes again and go to sleep."
```

How could I turn something all englishy like *that* into something more computery like *this*:

```
["I", "thought", "ye", "know'd", "it", "didn't", "I", "tell", "ye", "he", "was", "a", "peddlin'", "heads", "around", "town", "but", "turn", "flukes", "again", "and", "go", "to, "sleep"]
```

I began by breaking the text into easily identifiable components, a process called [tokenization][]. [Apache OpenNLP][opennlp] helped me transform and analyze the source text.

OpenNLP includes three tokenizers: a whitespace tokenizer, a simple tokenizer, and a learnable tokenizer, the last being, "A maximum entropy tokenizer, detects token boundaries based on probability model". Maximum entropy! Probability models! Now were getting scientific! So you can imagine which tokenizer I tried first.

```bash
$ opennlp TokenizerME en-token.bin < moby_dick.txt
```

```
" I thought ye know 'd it;--did n't I tell ye , he was a peddlin' heads around town?--but turn flukes again and go to sleep. "
```

Mostly.

Using the default english model, the learnable tokenizer tokenized the majority of the elements just fine. But it was confused by `--`, and punctuators are still included on some tokens, such as `sleep.`.

But wait, let's first see how the simple tokenizer does.

```bash
$ opennlp SimpleTokenizer < moby_dick.txt
```

```
" I thought ye know ' d it ; -- didn ' t I tell ye , he was a peddlin ' heads around town ? -- but turn flukes again and go to sleep . "
```

Again, not perfect. But I didn't need perfect. And for my purposes, the simple tokenizer's results were actually preferable to the learnable tokenizer's. There's a token for each word, and sometimes more than one token too! Hyphenated words such as `rose-bud`, were tokenized as `rose` and `bud`.)

I feed the entire book through the simple tokenizer, minus the etymology and extracts, from, "Call me Ishmael" to, "found another orphan." There are about 260,000 tokens in *Moby-Dick*, and roughly 19,000 distinct tokens.

## Normalization
The most common tokens are pretty much what you would expect, a bunch of punctuation and small common words:

```
[',', 'the', '.', 'of', 'and', 'a', 'to', ';', 'in', 'that', '"', "'", '-', 'his', 'it', 'I', '!', 's', 'is', 'he', 'with', 'was', '--', 'as', 'all', 'for', 'this', 'at', 'by', 'but', 'not', 'him', 'from', 'be', '?', ...]
```

For this project, I was only interested in words that could have some color association. And while I wanted these color association to be subjective, words like `the` or `and` are a bit too open ended. And 19,000 words were still too many for me to colorize easily. So I set out to prune down the number of words I had to work with.

Normalizing all word to lowercase eliminated around two thousand distinct words. Further gains became more difficult.

Eliminating one and two letter words, usually conjunctions which I assumed didn't have a color association, removed one hundred more, while removing punctuators using a simple `\w+` regular expression shaved off another fifty words or so.

Examining the list more closely, I noticed that many nouns appeared twice, once in singular and once in plural form: `whale` and `whales`, `seaman` and `seamen` for example. I wanted to eliminate these too, but this was no job for a simple regular expression. Thankfully, the [Inflect][] Python library helped me standardize all words to their singular form.

```python
import inflect

p = inflect.engine()

# Get count of each distinct token from tokenized text
word_counts = dict()
for token in tokens:
    single = p.singular_noun(token)
    key = single if single else token
    word_counts[key] = word_counts.get(key, 0) + 1
```

Inflect isn't prefect, especially with words that are not nouns, such as its singularization of `this` to `thi`, but it can handle some complex plurals, like  `oarsmen` to `oarsman`. Again, I wasn't too concerned if a few words got messed up at this stage since the project was about the text as a whole, not individual words.

Down to 14,500 words now. Still too many. And the top words are still not all that meaningful.

```
['the', 'and', 'that', 'but', 'with', 'for', 'all', 'whale', 'thi', 'not', 'from', 'him', 'one', 'you', 'there', 'now', 'man', 'had', 'have', 'were', 'like', 'then', 'which', 'what', 'some',  ...]
```

## Color Word Identification
But what kind of words can have a color associations? Well, words for things and words that qualify things for starters. So nouns, adjectives, and adverbs. I decided to limit my project to those.

I ran the OpenNLP part of speech (POS) tagger on *Moby-Dick* to identify every noun, adjective, and adverb. Here's some example output:

```bash
$ opennlp POSTagger en-pos-maxent.bin < mody_dick.txt > moby_dick.pos
```

```
Call_VB me_PRP Ishmael_NNP ._. Some_DT years_NNS ago_RB --_: never_RB mind_VB how_WRB long_JJ precisely_RB --_: having_VBG
little_JJ or_CC no_DT money_NN in_IN my_PRP$ purse_NN ,_, and_CC nothing_NN particular_JJ to_TO interest_VB me_PRP on_IN
shore_NN ,_, I_PRP thought_VBD I_PRP would_MD sail_VB about_IN a_DT little_JJ and_CC see_VB the_DT watery_NN part_NN of_IN
the_DT world_NN ._.
```

The `_XX` suffix on each word indicates its part of speech. You can find a key [here](http://cogcomp.cs.illinois.edu/page/demo_view/pos). Nouns for example end with `_NN`, including plural nouns that end with `_NNS`.

From the tagged output, I extracted all nouns, adjectives, and adverbs and normalized them again. This got me down to around ten thousand distinct words. And now the top words made much more sense.

```
['whale', 'not', 'now', 'man', 'then', 'ship', 'sea', 'more', 'ahab', 'boat', 'other', 'old', 'time', 'head', 'there', 'only', 'captain', 'such', 'hand', 'long', 'here', 'very', 'thing', 'still', 'yet', 'great', 'way', 'white', 'most', 'last', 'again', 'stubb', 'day', 'water', 'queequeg', 'little', 'eye', 'sperm', 'side', 'first', 'much', 'deck', 'good', 'same', 'never', 'ever', 'own', 'line', 'almost', 'round', 'starbuck', 'even', 'part', 'down', 'life', 'too', 'chapter', 'world', 'away', 'pequod', 'god', 'sort', 'well', 'back', 'fish', 'far', 'night', 'many', 'foot', 'crew', 'right', 'mast', 'once', 'air', 'sir', 'whole', 'harpooneer', 'thus', 'soon', 'place', 'sailor', ...]
```

# Visualization - Take One
Before continuing on, I decided to try out a few simple color mappings and see what the results looked like.

Starting with a tokenized copy of *Moby-Dick*, I normalized each word in the text using the same process I used to generate the distinct word list.

```python
words = []
with open('moby_dick_tokens.txt', 'r') as f:
    content = f.read()
    # Skip puctuators
    for token in re.findall(r"(\w+)", content):
        word = token.lower()
        single = p.singular_noun(word)
        if single:
            word = single
        words.append(word)
```

I then rewrote each word to a color. `get_color` is the actual mapping function, taking the current word and the previous color, and outputting the corresponding color for the word.

```python
GRAY = (127, 127, 127)

colors = []
color = GRAY
for word in words:
    color = get_color(word, color)
    colors.append(color)
```

To quickly visualize things, I converted the entire color list to an image using [PIL][], with each word encoded as a single pixel. Like an english book, the image is written left-to-right, top-to-bottom.

```python
from PIL import Image

width = 800
height = int(math.ceil(len(colors) / float(width)))

img = Image.new('RGB', (width, height), GRAY)
pixels = img.load()
x = 0
y = 0
for color in colors:
    pixels[x, y] = color
    x = (x + 1) % width
    if x == 0:
        y += 1

img.save("out.png")
```

Time to try out some mappings.

## Ahab and Moby-Dick
What does *Moby-Dick* look like if you encode Ahab as black and Moby Dick as white (for the example image, the token sequence "white whale" was also encoded as white):

```python
map = { "moby": (255, 255, 255), "ahab": (0, 0, 0) }

def get_color(word, current):
    return map.get(word, GRAY)
```

{% include image.html file="moby-ahab-points.png" %}

A bit sparse.

To fill things in a bit more, I updated the mapping function to continue writing with the current color until another color word was encountered. I also added a simple decay function so that both black and white approach gray over time.

```python
def decay(val):                                                                                                                                                                                                
    if val < 127:
        return val + 1
    elif val > 127:
        return val - 1
    else:
        return val;

def get_color(word, current):
    return map.get(word, (decay(current[0]), decay(current[1]), decay(current[2])))
```

{% include image.html file="moby-ahab.png" %}

Interesting but monochromatic. Let's bring in some color.

## Color Words
*Moby-Dick* uses very colorful language. Hell, the word 'white' alone appears more than three hundred time, 'black' and 'green' around one hundred times each, and 'red' around fifty times. So what would the book look like if you visualized its color words?

To see, I started with the CSS3 list of color names. I split up compound names, like 'RebeccaPurple', creating entries for 'rebecca' and 'purple' (regular 'purple' overwrites the 'purple' from 'RebeccaPurple'.) Then, I ran the image building script again, this time without any decay function:

{% include image.html file="css_colors.png" %}

Fascinating.

But using just color words feels still like a bit of a copout. What about words like 'whale' (around five hundred occurrences) or 'pequod' (two hundred or so)? How could I colorize those?

# Mechanical Turk
Colorizing all ten thousand distinct words myself would have been quite a chore.  I also wanted the color associations to come from multiple points of view, a draw from multiple opinions on some of the more common words. But where could I find people who would willingly spend their time mapping words to colors? The Internets of course, at three cents a minute.

## HIT
I used [Mechanical Turk][mturk] to crowd source the color mappings because it allowed me to quickly and easily ask people questions and collect their responses. But before mapping all ten thousand words, I wanted to make sure the survey process would work as expected for a smaller set of data.

My task, or HIT in Amazon speak (oddly appropriate for Blot're), on Mechanical Turk asked workers to map five words to colors, in exchange for three cents compensation. I randomly bucketed the fifteen hundred most common words into three hundred buckets to generate my tasks.

I quickly put together a basic HTML survey using the [Spectrum color picker][spectrum]. The initial color values for each of the five words were randomly generated.  

{% include image.html file="Screen-Shot-2015-05-30-at-12-44-10-PM.png" %}

I also provided workers with the option to mark, "No color association", for words they strongly felt did not have any associated color. The survey had a few very basic guards to encourage better responses, such as requiring workers to interact with the color picker for each of the five words before submitting their responses.

## Results
Honestly, I wasn't sure what to expect when I posted up the first set of words.   What if workers were confused by my instructions or just picked colors at random? And Melville is [One Thesaurical Motherfucker](/one-thesaurical-motherfucker/) too. How would workers handle words such as 'swart' or 'admeasurement', or names like 'starbuck' and 'ahab'?

But the Mechanical Turk workers did surprisingly well. There are no correct mappings here, but most of the responses do make sense.

As hoped, 'yellow' was mapped to an almost perfect yellow (`#fbf655`), 'bone' to a nice off-white (`#f7f7f7`) and 'damsel' to a lovely pinkish purple. Heck, the workers even got a reasonable answer for 'cetology' (`#cbe8e5`, a light greenish blue).

{% include image.html file="cetology.png" description="cetology - A branch of zoology concerned with the cetaceans" %}

Workers colorized fourteen hundred of the fifteen hundred words. And, of those remaining one hundred words, most were words like 'macrocephalus' or 'stunsail' or 'zoroaster', which, even having dictionary at hand, probably don't have color associations for most people.

Here's the result of running the image generation script again using the first fourteen hundred crowd sourced mappings.

{% include image.html file="turk1-1.png" %}

# Blot're
The whole goal of this project was to encode a book for use on [Blot're][blotre]. But this was perhaps the easiest part of the whole process. You can find the stream of Moby-Dick stream [here](https://blot.re/s/matt/moby+dick).

## Setup
I wrote the client application in Node using the [Blot're CL framework][blotre-cl]. This framework handles registering a new [disposable][blotre-disposable] client with `https://blot.re`, displaying the redemption code to the user, obtaining an access token for the user who redeemed the code, and persisting the credentials in four lines of code:

```js
var BlotreCl = require('blotre-cl-framework');

// Use existing client or create new one.
BlotreCl({
    name: "Book're",
    blurb: "Blot're you a book!"
})
    .then(start)
    .catch(console.error);
```

Once the client app is authorized, `start` loads the color data and begins posting stream updates.

```js
var start = function(client) {
    var data = JSON.parse(fs.readFileSync('moby_dick_colors.json'));
    return getMobyStream(client)
        .then(function(stream) {
            return startMobyUpdates(client, stream, data);
        });
};
```

## Updates
The first step was to create a new target stream. `getMobyStream` gets or creates a stream named `"Moby Dick"` under the authorized user's root stream.

```js
var getMobyStream = function(client) {
    return client.getStream(client.creds.user.rootStream)
        .then(function(rootStream) {
            return client.createStream({
                name: "Moby Dick",
                uri: rootStream.uri + '/moby+dick'
            });
        });
};
```

Instead of using [REST][blotre-rest] like I did for the Weather app previously covered, I decided to use the [Blot're websocket send/response API][blotre-response]. This API is preferred for applications that send multiple requests per second, and it can also operate over the same websocket as the subscription API.

The [Node Blot're client][blotre-js] does not include helpers for websockets, but the bare API is pretty easy to use. First, I used `ws` to open a secure websocket to `wss://blot.re/v0/ws`. Because I would need to perform stream updates, I authorized the websocket connection as well by sending the access token in the authorization header.

```js
var WebSocket = require('ws');

var openBlotreSocket = function(client) {
    // Open an authorized websocket using the existing creds
    return new WebSocket('wss://blot.re/v0/ws', 'wss', {
        headers: {
            "Authorization": "Bearer " + client.creds.access_token
        }
    });
};
```

The actual update function simply iterates though the list of colors in order, posting up a new color every 250ms.

```js
var startMobyUpdates = function(client, targetStream, data) {
    var ws = openBlotreSocket(client);
    var i = 0;
    ws.on('open', function postUpdate() {
        if (i >= data.length)
            i = 0;

        ws.send(JSON.stringify({
            type: 'SetStatus',
            of: targetStream.uri,
            status: { color: data[i++] }
        }));
        setTimeout(postUpdate, 250);
    });

    ws.on('message', function(x) {
        if (x && x.error)
            console.error(x);
    });
};
```

Here's  the [actual stream](https://blot.re/s/matt/moby-dick). At some point, I hope to map the remaining 8500 words as well using Mechanical Turk. If I do, I'll post up updated images and update the Blot're stream too.

{% include image.html file="md-giffer.gif" %}

At this rate, it takes about fourteen hours to get through all of *Moby-Dick*. So take the day off, tune in to Blot're, and enjoy you some Melville as it was meant to be enjoyed.


[blotre]: https://blot.re
[blotre-js]: http://github.com/mattbierner/blotre-js
[blotre-disposable]: https://github.com/mattbierner/blotre/wiki/single-use-clients
[blotre-response]: https://github.com/mattbierner/blotre/wiki/Web-Socket-Response-API
[blotre-rest]: https://github.com/mattbierner/blotre/wiki/rest
[blotre-cl]: https://github.com/mattbierner/blotre-cl-framework

[gutenberg]: https://www.gutenberg.org/ebooks/2701
[spectrum]: https://bgrins.github.io/spectrum/
[inflect]: https://pypi.python.org/pypi/inflect
[opennlp]: https://opennlp.apache.org
[mturk]: https://www.mturk.com/mturk/welcome
[tokenization]: http://en.wikipedia.org/wiki/Tokenization_(lexical_analysis)
[pil]: https://python-pillow.github.io
