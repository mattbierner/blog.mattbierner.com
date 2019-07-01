---
layout: post
title: "What I've learned so far while bringing VS Code's Webviews to the web"
---

VS Code is [heading back to the web](https://devblogs.microsoft.com/visualstudio/intelligent-productivity-and-collaboration-from-anywhere/) and we're currently working to make everything from Desktop VS Code more or less just work in the browser. Today I'd like to share what I've learned so far while bringing [VS Code's webview API](https://code.visualstudio.com/api/extension-guides/webview) to the web. The work is ongoing, but I've learned a lot while working on this problem so far, specifically about what is and isn't possible using web standards, as well as discovering cases where those standards didn't quite work as I'd hoped.

# Webviews on the desktop
VS Code's webviews render arbitrary html in a sandbox; a bit like a specialized `<iframe>` element. I designed VS Code's webview API and maintain its implementation. Webviews are used internally by VS Code to render the marketplace extension pages as well as our release notes, and many extensions also make use of this API to implement all sorts of stuff. For example, I also maintain VS Code's built-in markdown extension, which uses a webview to show a live preview of rendered markdown. Extensions have built some very complicated user interfaces using webviews. 

The VS Code webview API is pretty high-level and relatively simple on its surface: extensions give VS Code a string of html and VS Code renders that html in an editor. Extensions can also post messages to webviews they create, change the position of the webview editor, and save/restore state associated with each webview.

## \<webview>
Desktop VS Code implements webviews using Electron's [`<webview>` tag](https://electronjs.org/docs/api/webview-tag). Electron's APIs give us a lot of control over webview content. Here's a short list of the key capabilities and properties we need to implement VS Code's webviews. Electron's `<webview>` APIs help us meet all of these:

#### Isolated from the main VS Code process
Webview content is rendered in an isolated context. Scripts inside of webviews cannot access resources within the VS Code process or editor DOM. This allows us to run arbitrary html in a way that minimizes its potential for harm.

The intent here is not to defend against malicious extensions but against insecure extensions that create webviews vulnerable to script injections or other attacks. Our goal is defense in depth; even if an attacker can get malicious scripts running inside a webview, they should never be able to read arbitrary files from the disk or interfere with the main VS Code editor.

#### Isolated from each other
Webviews should not be able to effect each other. Even multiple webviews created by the same extension should never be able to effect each other or directly share state.

#### Controlled loading of local resources
VS Code's webviews can load resources from the local workspace or from the disk, but only under paths that extensions specify. Again, this restriction is in place so that even if a webview is compromised, it should not be able to read arbitrary files from the system.

Loading local resources is implemented using a custom `vscode-resource:` [protocol](https://electronjs.org/docs/api/protocol). A custom protocol lets us specify how resources are loaded and restrict which resources can be loaded. 

#### Communication with VS Code
We expose an API to webview content that lets them communicate with VS Code using `postMessage`.

#### Monitoring of events inside of webviews
We register custom handlers inside of webviews to intercept clicks and other actions. When a user clicks a `https` link in a webview for example, we want to open that in the default browser and not inside the current webview or inside VS Code itself.

#### Disabling scripts
Script are disabled by default in webview content but can be re-enabled.

#### Themeable
We specify a baseline css style and some css variables from the current VS Code theme. This lets extension's style their webviews in a way that is consistent with the rest of the current VS Code theme.

## Structure
To support all this today using the `<webview>` tag, we set up nested contexts with the following structure: 

```html
<webview>
  <html>
     <body>
     <script>
         // VS Code's scripts for managing webview content
         //
         // This manages the webview content and also hooks up listeners for clicks and
         // other events on it. Note that these listeners work even if the webview content 
         // in the iframe has scripts disabled.
         // 
         // This is where we also communicate to and from the VS Code main process
         // using postMessage
    </script>
    <iframe width="100%" height="100%" sandbox="allow-same-origin allow-scripts?">
        // Actual webview html content coming from an extension
        //
        // We also inject the VS Code webview api script into here, which talks with frame's parent
        // using postMessage
     </iframe>
    </body>
  </html>
</webview>
```

Each `<webview>` also has a unique web session to ensure its isolation. The outer `<webview>` source comes from a `data:` uri, which means the webview is run in a unique origin and cannot load `file:` resources directly.


# Loading of local resources
More than any other requirement, the loading of local resources in particular has informed bringing VS Code webviews to the browser. So let's skip ahead for a moment to understand this problem in isolation and look at the way I addressed the issue. This will help explain some of the hangups hit in the next section, which returns to cover how to render and support VS Code's webview in browsers in the first place.

## The vscode-resource protocol
Today, if a webview extension wants to show an image from the user's workspace, the required html would look something like:

```html
<img src="vscode-resource:/Users/matt/projects/catre/creosote-cat.gif">
```

The custom [`vscode-resource:` protocol](https://code.visualstudio.com/api/extension-guides/webview#loading-local-content) lets us implement how requests to this protocol are resolved. We use this in VS Code to both restrict which resources can be loaded from the local file system, as well as transparently supporting the loading of resources from [remote workspaces](https://code.visualstudio.com/blogs/2019/05/02/remote-development) (if I'm connected to a remote workspace over ssh for example, even though the webview itself is run locally, the resources it loads may come from the remote machine). However there is no equivalent to [Electron's custom protocol API](https://electronjs.org/docs/api/protocol) for the normal web.

So as a starting point to get loading of resources working, we'll need to rewrite any `vscode-resource:` uris in webview html to use a standard `https:` uri. But where exactly should this uri point?

The obvious solution would be to setup a VS Code server endpoint that serves up resource from the workspace and extensions. And while that could work, it would require some fairly complicated logic: the server would have to know the current workspace, which extensions a user has loaded, and which folders within that environment the requesting webview should or should not have access to. Ugh. But what if we could use the same logic that the VS Code web client already uses to load and display files and images in the browser?

## Creating a virtual server with service workers
After a bit of experimentation, I realized that [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) would let us do just that. Service workers are usually discussed in the context of caching or offline features, but for VS Code's purposes their relevant capabilities are:

* A service worker can intercept https requests from a page and resolve the request at some arbitrary later time using whatever means it wishes.

* Service workers can send and receive messages from pages they are active on.

We can use these two capabilities to implement a sort of virtual server endpoint that delegates the loading of local resources inside of webviews back to the main VS Code client, even though the service worker, webview, and VS Code client are all run as isolated processes by the browser. Here's how it works:

1. Rewrite all of the `vscode-resource:` protocol uris in webview html to use a `/vscode-resource` https uri instead; e.g. `vscode-resource:/Users/matt/projects/catre/creosote-cat.gif` becomes `/vscode-resource/Users/matt/projects/catre/creosote-cat.gif`.

1. Inside the webview, register a service worker that intercepts all requests to the `/vscode-resource` endpoint. 

1. In the service worker's `fetch` handler, when a request for anything under `/vscode-resource` comes in, post a message back to the requesting page with the path of the resource being requested (`/Users/matt/projects/catre/creosote-cat.gif`). Then create and store a value in the service worker that can be resolved at some later point, and return a `Promise` to this value from the `fetch` handler.

    Keep in mind here that, from the service worker's point of view, the requesting page is actually the inner iframe within the webview (i.e. the one with the html from the extension). This inner page may not even have scripts enabled, so what we really want to do is post a message back to the outer webview context which VS Code controls. To map between the inner iframe and its owning webview, we serve the inner and outer iframe with a shared `id` query parameter in their urls. The service workers can read the urls of all active clients and therefor map from the inner context to the outer one, or vice versa. Simple, but it works. 

1. In the outer webview environment, forward the message from the service worker to the main VS Code page using `postMessage`.

1. In the main VS Code client, handle the message from the webview. Use VS Code's internal filesystem APIs to read the requested resource asynchronously. Once the file has been read, post its contents back to the webview using `postMessage`.

1. Back inside the webview, handle forward the file content message from VS Code to the service worker using `postMessage`.

1. Back in the service worker, handle the message from the page and resolve the request from step 3.

Getting all the players talking to each other properly is a bit complicated—especially with VS Code's nested iframes and when you consider that multiple webviews may all exist at the same time—but this approach allows us to delegate all the complex loading of webview resources back to VS Code itself. We can even reuse much of the same code in the browser originally used to implement the `vscode-remote` protocol, minus all the electron specific bits of course. Even better, this service worker based approach means you don't need to setup a special, webview resource server endpoint to host VS Code. That eliminates a whole lot of complexity and will potentially save significant hosting cost too!

# iframe based webviews
So after that brief flash forward, let's get back to the basic question at hand: how can we bring VS Code's webviews to the browser in the first place?

If you've followed this far, you may be asking: *What's so difficult? Can't you just replace every `<webview>` tag with an `<iframe>` and everything will be golden?*

And yes, to get VS Code's webviews working in browsers, iframes are really the only viable solution. But, as noted in the opening section, VS Code's webviews also have some important features and restrictions beyond what off the shelf iframes offer. That won't stop us, but it does require some caution.

First off, and perhaps most importantly, we need to ensure that webview content is run inside an isolated context. Webviews should never be able to effect the rest of the VS Code client.

In practice, that means that we must serve the webview iframe in a separate [origin](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) from the main VS Code editor. This prevents iframe content from accessing the state (cookies, local storage, service workers, etc.) of the main VS Code client, and it will also block the webview from using `window.top` to gain access to the top level editor DOM.

There are two simple ways to "fake" serve an iframe in a unique origin without requiring a real separate origin (i.e. a separate domain or subdomain).

## Sandbox
Normally when you point an iframe to an html file from the current origin (`<iframe src='/path/to/webview.html'>`) the iframe will be served from the same origin as the current page. We can prevent this using the [`sandbox` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) and making sure not to set `allow-same-origin`

```html
<iframe
    src='/path/to/webview.html'
    sandbox="allow-scripts">
</iframe>`
```

The `sandbox` attribute disables all capabilities by default, so by omitting `allow-same-origin` from the capabilities list, browsers will run the iframe in a unique origin regardless of the iframe `src`.

Now the problem. If you recall, VS Code uses nested iframes to implement its webviews, which gives us crucial control over the presentation and management of the webview content itself. However the origin of a sandboxed iframe will never match anything, including that of other iframes embedded inside it. That means the outer iframe cannot directly reach into the DOM of the inner iframe. Trying to do so yields errors such as:

```
DOMException: Blocked a frame with origin "null" from accessing a cross-origin frame.
```

Furthermore, you can't register a service worker inside a iframe with a unique origin. This makes sense if you consider service workers were in large part designed to enable caching and offline behavior, neither of which are relevant for a unique origin that will be used once. But this is a key limitation because, as we just saw, service workers offer a nice clean way to load local resources inside webviews.

## `srcdoc` or data uri
I next tried to workaround these limitations by serving up the iframe in a slightly different way that would allow safely enabling `allow-same-origin`. Rather than serving the iframe content from a file on the server, I tried using the `srcdoc` attribute or a `data:` uri to serve the static webview content inline. 

```html
<iframe
    srcdoc="<html>VS Code's code for managing webview content</html>"
    sandbox="allow-scripts allow-same-origin">
</iframe>
```

However this has the exact same problems as the previous approach: service workers do not work and—despite now setting `allow-same-origin`—sandboxing means that the inner and outer iframe still are not in the same origin. There's also a fun new problem: [content security policies](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).

The main VS Code editor page sets a restrictive content security policy (CSP), one that only allows scripts and images to be loaded from the current origin just as an example. Inline iframes inherit the content security policy of their parent page, which means that, using the `srcdoc` approach, webviews would also only be able load images or scripts from the VS Code server. (This inheritence prevent a content injection from injecting an inline iframe that can bypass the parent page's content security policy.)

As far as I know, there is no way to override this inheritance, so even if all the other issues with this approach could be addressed, the CSP limitation is a blocker.

## Different origin
The requirements around content security policy, service workers, and nested iframes left one less than ideal option: serve the iframe from a separate origin:

```html
<iframe
    src='https://webview.example.com'
    sandbox="allow-scripts allow-same-origin">
</iframe>
```

We have to set the `allow-same-origin` flag in order to support service workers inside the iframe and our nested iframes. However, since the iframe content is served from a different origin from the editor page, it should not be able to break out and effect the editor itself.

One downside to this approach is that it requires setting up a separate server endpoint for the static iframe content, which in practice is just a few static html and JavaScript files. Not the end of the world, but annoying.

The bigger drawback is that with this approach, all webviews are run in the same origin and can therefore share some state. One webview can use local storage or set cookies, and another webview would be able to observe those changes. To fix this, we could:

* Try to sandbox the JavaScript environment inside webviews. Maybe we can block access to `document.cookie`, `navigator.serviceWorker`, and so on.

* Serve every webview from a unique origin. This could be unique subdomains, something like: `https://SOME_GUID.webview.example.com`. While this should work, I don't know if it will cause problems for browsers over time (would heavy users of VS Code in the browser end up with service workers and state for thousands of unique webview subdomains?)

# Where things stand
VS Code's webviews didn't work at all in browsers at the start of this month, and now we can run webviews from many extensions without issues across all modern browsers. There were two key parts to making this possible: changing from Electron's `<webview>` tag to a sandboxed iframe served from a separate origin, and using a service worker to load local resources by delegating back to the main VS Code process. However during my exploration of this problem, some initially promising web standards didn't quite meet our needs. I also learned that the various standards also don't always play nicely with each other, take iframe `srcdoc` and CSP as one example.

The biggest issue with my current solution is that all webviews are being served from the same origin, so they are not truly isolated. I don't think this is a blocker, and I have some potential workarounds in mind. 

If I could wave a magic wand, here's what I wish was possible though:

* A way to register a service worker for unique origins. ([see this comment](https://github.com/w3c/ServiceWorker/issues/1437))

* A way to selectively disable content security policy inheritance for `srcdoc` iframes. 

* `srcdoc` sandboxed iframes should be able to create iframes that share the same origin. 

While there's still a lot of work to be done<!--and science!-->, I've learned quite a lot getting to this point. I look forward the point when all this becomes available for you to test.

[Let me know](https://twitter.com/mattbierner) if you see any flaws in the current approach or have thoughts on addressing some of its limitations.

***

*PS: This is not an official VS Code post nor should you ever expect VS Code related content here. I posted this because I found it interesting and thought others may too.*