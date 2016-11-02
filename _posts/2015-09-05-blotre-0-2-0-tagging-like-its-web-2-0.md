---
layout: post
title: Blot're 0.2.0 - Tagging Like It's Web 2.0
series: blotre
date: '2015-09-05'
---
The release of [Blot're][blotre] 0.2.0 brings an exciting new feature to your favorite color network: tagging. Tagging allows you to add dynamic metadata to streams, either to clarify what it represents or to help with stream organization and search.

{% include image.html file="Screen-Shot-2015-09-05-at-1-11-40-PM.png" %}

Tags show up under the stream name. You can also search for streams with a given tag or find child streams with a given tag.

{% include image.html file="Screen-Shot-2015-09-05-at-1-12-41-PM.png" %}

Tagging also introduces the concept of a shared stream collection. Each tag is conceptually a collection of streams, add a tag to a stream and it automatically becomes a child of that tag. The tag's set of children is dynamic and shared between all Blot're users, introducing fun new collaborative opportunities.

Status updates on the stream are automatically broadcast to the parent tag, who maintains an set of children ordered by last update time. This is very similar to how existing streams and child streams work currently.

# For Developers
The Blot're [APIs][api] have also been updated to support tags.

Stream data now includes a list of tags in the `tags` field:

```js
{
  "id": "552f68963004ce448e1e19a5",
  "name": "ToasterPrime",
  "uri": "toastmastergeneral/toasterprime",
  "created": 1429170326262,
  "updated": 1429170326262,
  "status": {
    "color": "#0000ff",
    "created": 1429170326262,
    "poster": "552f24f33004785713de674e"
  },
  "tags": [{"tag": "toaster", {"tag": "energon-cube-breakfast"}],
  "owner": "552f24f33004785713de674e"
}
```

Each stream can have up to six unique tags of between one and thirty two characters each. Tags follow the same rules as stream names, but cannot contain spaces and tags are always normalized to lowercase in the system.

## With the REST and Socket Response APIs
Both the [REST][] and [Websocket Response][response] APIs now support querying and changing tags. Here's a quick overview of the five new calls using the websocket APIs, but the REST tag API is nearly identical (REST operates on stream ids instead of urls and only return the relevant Json data instead of wrapping things in a JSON message.)

#### GetTags
Gets the tags of a stream.

```
SEND {
  "type": "GetTags",
  "of": "toastmastergeneral/bread+stockpile"
}
```

```
RESPONSE {
  "type": "StreamTags",
  "url": "toastmastergeneral/bread+stockpile",
  "tags": [
    {"tag": "sotoast"},
    {"tag": "goldenbrown"},
    {"tag": "challahorgy"}]
}
```

#### SetTags
Sets the tags of a stream, overwriting the existing tags. Requires [authorization][]. Returns the set of normalized tags values.

```
SEND {
  "type": "SetTags",
  "of": "toastmastergeneral/bread+stockpile",
  "tags": [
    {"tag": "RYE"},
    {"tag": "Pumpernickel"},
    {"tag": "Challahorgy"}]
```

```
RESPONSE {
  "type": "StreamTags",
  "url": "toastmastergeneral/bread+stockpile",
  "tags": [
    {"tag": "rye"},
    {"tag": "pumpernickel"},
    {"tag": "challahorgy"}]
]
```

#### GetTag
Lookup a specific tag on a stream.

```
SEND {
  "type": "SetTag",
  "of": "toastmastergeneral/bread+stockpile",
  "tag": "RYE"
}
```

```
RESPONSE {
  "type": "StreamTag",
  "url": "toastmastergeneral/bread+stockpile",
  "tag": "rye"
}
```

#### SetTag
Add a specific tag to a stream. Requires [authorization][]. Noop if the tag already exists

```
SEND {
  "type": "SetTag",
  "of": "toastmastergeneral/bread+stockpile",
  "tag": "GoldenBrown"
}
```

```
RESPONSE {
  "type": "StreamTag",
  "url": "toastmastergeneral/bread+stockpile",
  "tag": "goldenbrown"
}
```

#### DeleteTag
Remove a tag from a stream. Requires [authorization][]. Returns the deleted tag.

```
SEND {
  "type": "DeleteTag",
  "of": "toastmastergeneral/bread+stockpile",
  "tag": "Rye"
}
```

``` 
RESPONSE {
  "type": "StreamTag",
  "url": "toastmastergeneral/bread+stockpile",
  "tag": "rye"
}
```


## With the Subscription API
You can subscribe to a tag collection using the [websocket subscriptions API][subscriptions] just like you would subscribe to a normal stream collection:

```
SEND {
    "type": "SubscribeCollection",
    "to": "#rye" 
}
```

The socket will now receive all `StatusUpdated` events for the tag's children, along with `ChildAdded` and `ChildRemoved` events whenever a tag is added or removed from the stream.

Additionally, any regular stream subscriptions will now receive `ParentAdded` and `ParentRemoved` events whenever tags are added or removed from that stream.


# Looking Forward
Both [Blot're.js][blotre.js] and [Blot're.py][blotre.py] have been updated to support the new APIS.

Inspired by a certain TPP (not of trans-pacific variety), I'm also working on a little project that uses the shared nature of Blot're tags to crowdsource control of something. The number 2600 may also be involved. More details to come shortly.


[blotre]: https://blot.re

[api]: https://github.com/mattbierner/blotre/wiki
[authorization]: https://github.com/mattbierner/blotre/wiki/authorization 
[subscriptions]: https://github.com/mattbierner/blotre/wiki/Subscriptions
[rest]: https://github.com/mattbierner/blotre/wiki/REST
[response]: https://github.com/mattbierner/blotre/wiki/Web-Socket-Response-API

[blotre.js]: https://www.npmjs.com/package/blotre
[blotre.py]: https://github.com/mattbierner/blotre-py