---
layout: post
title: "VS Code Docs View"
description: VS Code extension that displays documentation in the sidebar or panel.
titleImage:
    file: 'title.png'
---

The [Docs View][extension] extension for VS Code display documentation for the symbol at your current cursor position in the sidebar or panel.

**Links**

- [Extension][extension]
- [Source](https://github.com/mattbierner/vscode-docs-view)

{% include image.html file="title.png" description="Docs in a view" %}

The extension was inspired by my [recent quality time](/in-the-walls) with Xcode. While learning new iOS APIs, I enjoyed always having their documentation displayed in a large pane to the right of my editor. And since I have now exhausted my supply of nice things to say about Xcode, we shall leave the subject at that (although it should be noted that both Eclipse and VS have had similar documentation style views for years). 

The extension uses the new [Webview View API](https://code.visualstudio.com/updates/v1_50#_webview-views) that I recently added to VS Code. This API allows extensions to show arbitrary html content in the sidebar and panel. Besides Docs View, the API is also already being used for [real time profiling](https://code.visualstudio.com/updates/v1_50#_javascript-debugging) and [pull request reviews](https://marketplace.visualstudio.com/items?itemName=CodeStream.CodeStream). Neat!

Docs View supports any language that offers IntelliSense and hovers. It can either augment or change your workflow. I personally still mostly use hovers while coding, only breaking out the Docs View for reading longer documentation or browsing complex type signatures. I also sometimes use the Docs View's "pin" command to pin documentation for a particular API that I know I will keep coming back to reference.

If you find that you prefer always using the Docs View though, you can even disable VS Code's hovers by setting `"editor.hover.enabled": false`. Try dragging the Docs View down into the panel too, which I find requires less eye movement on large displays. Or hey, why not even move the panel to the right for some proper Xcode vibes?

{% include image.html file="right.png" description="VS Code with a side of docs (thanks to the 'View: Move Panel Right' command)." %}

<!-- Although sadly the Swift language server and highlighter are still rather lacking... -->

So [try out Docs View extension][extension] and see if it's for you. Even if you don't use it all the time, it can still be a handy tool to have around.

[extension]: https://marketplace.visualstudio.com/items?itemName=bierner.docs-view