---
layout: post
title: Giving up the Ghost
description: "Or; How I learned to Stop Hosting and Love Jekyll"
date: '2016-01-13'
---

When I first heard about [Ghost][] back in 2013, I was pretty excited. An open source, Node.js blogging platform focused on ease of use? Sign me up.

The [Ghost.org](http://web.archive.org/web/20131108182903/https://ghost.org/features) website practically oozed 201X hipsterism too. "Free. Open. Simple", Ghost promised in gigantic sans-serif letters, atop a faux-a-chrome picture of a flannel wearing blogger typing away at their Macbook. "That could be me", I fantasized, "blogging away surrounded by bamboo and bokeh aplenty!" 

{% include image.html file="ghost.png" description="I wish I was exaggerating..." %}

All joking aside, Ghost did treat me pretty well, powering this blog for over two years. But now it's time to move on. So I recently switched to [Jekyll][] and haven't looked back.

# Jekyll – The Beast with the Least
The advantages of blogging with Jekyll are [well established](http://tom.preston-werner.com/2008/11/17/blogging-like-a-hacker.html), but for me, two points about Jekyll really stand out. Foremost, Jekyll recognizes that a blog, at least in its published form, is just a static collection of documents. Think of how many blogging software projects (including good friend Ghost) have been taken by Web 2.0 fever, trying to build ever more complex and dynamic webapps. That may work for a blogging platform like [Medium](https://medium.com), but for self-hosted blogs, it seems like an evolutionary dead end.

Jekyll operates more in the vein of LaTeX, transforming a set of input documents into a (static) website. No need for a database or dedicated server, just publish to [Github pages][pages], or any other static web host, and you're all set. Which brings us to the second point: Jekyll gets out of your way. Jekyll defines a minimal framework of what a blog is and leaves the rest up to you. You can build whatever you want using Liquid, HTML, CSS, and JS, no need to be limited to theme libraries or plugins. 

## No Flannel Required
The Unix style design of Jekyll integrates into existing workflows far better than a monolithic webapp like Ghost ever could. This was my typical workflow to publish a post using Ghost:

1. Write the post using a local text editor (because the Ghost text editor sucks).
2. Boot and login to a local Ghost instance.
3. Copy post to the local Ghost instance.
4. Upload images.
5. Publish the post on the local instance to see what it will actually look like (because the Ghost editor preview also sucks).
6. Login to the production Ghost instance.
7. Copy the post again to the production instance.
8. Upload images again.
9. Publish to production.
10. Backup the new post and new images with a crazy custom script.

Now, here's my workflow to publish a post with Jekyll:

1. Wite the post using whatever you want. Jekyll doesn't care. (You can also collaborate however you want).
2. Run the blog locally using `jekyll serve -w` and see exactly what the post will look like once it is published.
3. `git commit` the new post and `git push` to publish it.
4. And it's all in git so backup is easy.

4 < 10. And that's ignoring the not negligible cost of maintaining an up to date Ghost instance. Jekyll's got true ease of use, no flannel required.

# Arise - From Ghost to Jekyll
But enough fawning. Let's take a look at the process of actually porting a Ghost blog to Jekyll.

Migrating content is surprisingly easy, but I don't think there's a good story for porting over a Ghost theme. That'll take some manual work. [Jekyll-Now](https://github.com/barryclark/jekyll-now) is a great starting point at least.

## Migrating Text
First, export your Ghost blog by following [these instructions](http://support.ghost.org/import-and-export-my-ghost-blog-settings-and-data/). Then run the [Jekyll Ghost importer script](hhttps://github.com/eloyesp/jekyll_ghost_importer) on the exported data to generate the `_posts`. These two steps take care of a good deal of the migration, but there are still a few problems.

With Ghost, I used [Google's code prettifier](https://github.com/google/code-prettify) for clientside syntax highlighting, but Jekyll does not understand these fenced code block annotations:

```
`` `prettyprint lang-js
...
`` `
```

This was fixed with a quick find/replace in `_posts`:

``` bash
$ perl -i -pe 's/prettyprint lang-//g' _posts/*
```

This got the text into a good state, now time to handle images.

## Migrating Images
The exported Ghost database does not contain image data, so if you've uploaded any images through Ghost, these must be manually migrated over. This can be as easy as copying the entire Ghost `content/images` directory into Jekyll, but I decided to just start from scratch so that the images would all be organized more logically for the future (breaking hyperlinks like a champ in the process too).

My target image directory structure has each post with its own `content` folder:

```
content
    - 2016-01-03-introducing-bak-re
        - gen-z-toaster-oven-engagement-graph.png
        - easy-bakapocalypse-2.jpg
        ...
        
    - 2016-01-010-hamt-iv-hamt-takes-new-york
        ...
```

Which allows referencing images like so:

```
---
layout: post
title: "Introducing Bak're: The Tinder of Toaster Ovens" 
date: '2016-01-03'
---
[Blot're](https://blot.re) is dead. And good riddance. It's 2016, ain't nobody got time for all those colors anymore. So it's out with those Millennials, and their dirty old toasters, in with Gen-Z: the toaster oven generation.

![My god it's full of scones!](/content/2016-01-03-introducing-bak-re/easy-bakapocalypse-2.jpg)

Bak're is the world's first IoTo (internet of toaster ovens) communications platform...
```

But writing out `/content/2016-01-03-introducing-bak-re/` every time is no good. An `image.html` template let's us instead use just the file name:

```html
{% raw %} 
<figure class="image">
    {% capture image_src %}
        {% if include.file %}/content/{{ page.path | remove_first:'_posts/' | split:'.' | first }}/{{ include.file }}
        {% else %}
            {{ include.url }}
        {% endif %}
    {% endcapture %}
    <a href="{{ image_src }}">
        <img src="{{ image_src }}" alt="{{ include.description }}" />
    </a>
    {% if include.description %}
        <figcaption>{{ include.description }}</figcaption>
    {% endif %}
</figure>
{% endraw %}
```

This template takes three parameters:

* `file` - Path relative to the current post's content directory.
* `url` - Absolute url for the image. Either `file` or `url` must be specified.
* `description` - Optional caption for the image.

And instead of using the Markdown's image syntax, we now use a Liquid template: 

```html
{% raw %}
toaster oven generation...

{% include image.html
    file="easy-bakapocalypse-2.jpg"
    description="My god! it's full of scones!" %}
{% endraw %}

Bak're is...
```

Besides simplifying image references, `image.html` allows you to customize how images are statically rendered. Back with Ghost, the only way to add visible captions to images was with Javascript. Now that all happens during generation.

## Image Migration Script
Faced with sixty or so posts to convert, I wrote a small script that automatically downloads all the images from a running Ghost blog, and rewrites `_posts` that have gone through the Jekyll post importer to use `image.html`. [Here's the gist](https://gist.github.com/mattbierner/91d90806fc6d3b414498).

The basic usage is:

```bash
$ cd my_jekyll_blog
$ python migrate_ghost_images.py _posts --site http://my-super-blog.com
```

If you only want to download images hosted on your ghost instance, be sure to specify the `--local_only` flag. Otherwise, images linked from other sites will also be downloaded and replaced.

# Today's an Excellent Day for an Exorcism
I was initially afraid that the cost of migrating from Ghost to Jekyll would be high, but the process was not bad. The scripts detailed should handle most of the migration automatically. The biggest obstacle is probably going to be migrating over the look of your preferred Ghost theme, but this is also a good opportunity for a redesign, and there are plenty of great Jekyll themes out there.

Overall, blogging with Jekyll is an improvement in almost every way. Not only does it eliminate all the concerns of hosting, but, in its simplicity, it actually makes writing and publishing content far easier. And, although I've been busting pretty hard on ol' Ghost here, the same arguments apply to pretty much every other piece of blogging software out there.

Feel free to check out the [source of this blog on Github][src] if you are interested in how it is setup, or want a slightly more complete starting point than Jekyll-Now offers (or if you just just want to open a bug about some horrific grammar failure).

[ghost]: http://ghost.org/
[jekyll]: http://jekyllrb.com/
[pages]: https://pages.github.com

[src]: https://github.com/mattbierner/mattbierner.github.io