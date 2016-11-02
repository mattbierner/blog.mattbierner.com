---
layout: post
title: Responsive, Two Column Documentation Layout With Markdown and CSS
date: '2014-12-16'
---
<blockquote>
    Adrift in Markdown,<br/>
    longing for structured layout<br/>
    sans HTML
</blockquote>

Markdown is great. I find myself using it everywhere, even places where it makes no sense, such as Word documents and iMovie titles. But Markdown works best for documents that consist of a single column of content. Ask Markdown to do something as radical as position an image next to some text, and you must resort to embedded HTML or fragile CSS.

So when I wanted to create a two column layout for the [Bennu][] and [Nu][] websites, with API examples and their documentation next to one another, I initially feared that I would have to write the documentation in HTML. But that turned out not the be the case. With just standard Markdown and a bit of CSS, it is fairly simple to create a responsive, two column layout well suited for code documentation.

{% include image.html file="Screen-Shot-2014-12-15-at-8-04-47-PM.png" description="The Bennu website on a larger screen" %}

While also reverting to a one column layout for smaller screen sizes.

{% include image.html file="Screen-Shot-2014-12-15-at-8-05-19-PM.png" description="Smaller screen view of the same site" %}


I've setup [a simple Github page][page] that describes how to create a two column, while also demonstrating use of the layout itself. Building on the example, it is trivial to change the dimensions of the columns, change the type of content displayed in either column, or add more elaborate styling.

Check out the [documentation page][page] or the complete [example source][src], and feel free to report any problems or suggest improvements.


[Nu]: http://mattbierner.github.io/nu/
[bennu]: http://bennu-js.com

[src]: https://github.com/mattbierner/markdown-two-column-documentation-example
[page]: http://mattbierner.github.io/markdown-two-column-documentation-example/
[index]: https://raw.githubusercontent.com/mattbierner/markdown-two-column-documentation-example/master/index.md
[style]: https://github.com/mattbierner/markdown-two-column-documentation-example/blob/master/stylesheets/styles.css