---
layout: post
title: Just the Links
date: '2015-10-01'
description: "A Chrome plugin that shows only the important part of a Wikipedia entry: the hyperlinks"
series: newspeak
---
The allure of an unvisited Wikipedia hyperlink is difficult to resist. It's gotten to the point where I don't even read the articles anymore, I just kind of scan for interesting looking hyperlinks to click on. From there, it was but a short jump to *[Just the Links][jtl]*.

{% include image.html file="hyperlinks-break.png" description="The surprisingly long and absurd Wikipedia article on BK Chicken Fries rendered with Just the Links in hyperlinks+break mode" %}

[*Just the Links*][jtl] is a Chrome browser plugin that renders only the hyperlinks in Wikipedia articles. It provides a few options to control what text is displayed:

* `hyperlinks` - Only show hyperlinks.
* `hyperlinks + exact` - Show hyperlinks plus any text that exactly matches a hyperlink (case insensitive).
* `hyperlinks + break` -  Show hyperlinks plus any text that matches any word found in a hyperlink  (case insensitive).
 
The [*Just the Links* site][jtl] has many more details, or you can [download *Just the Links* directly from the Chrome Store][download]. The source code is [on Github][src] too.




[jtl]: http://mattbierner.github.io/just-the-links/
[download]: hhttps://chrome.google.com/webstore/detail/just-the-links/mbfccghgfekfafnjhlkfkfiolbplafpa
[src]: https://github.com/mattbierner/just-the-links