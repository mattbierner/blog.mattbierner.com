---
layout: post
title: "An ARKit Wishlist"
description: A wishlist for augmented reality development on iOS
series: arr
---

One of the bright spots of my past year has been learning ARKit. While the iOS AR learning curve wasn't the smoothest, ARKit has helped me build apps and experiences that I've long dreamt of but didn't think were possible with current hardware. It's also opened up my imagination to a whole new range of augmented reality possibilities. Apple's AR developer tools and hardware support is one of the few technologies that I find genuinely exciting these days.

So with WWDC approaching, I decided to indulge myself by putting together a little fantasy list about what I'd most like to see addressed next in iOS AR development. 

This wishlist is not an attempt to guess at what Apple may actually introduce. That being said, I've tried to keep my list somewhat grounded. As much fun as it can be to dream about APIs that would let you Blade Runner zoom down to a molecular level or go all Minority Report wavy hands on the very fabric of reality, this list is more about the immediate future. A few of my most wanted features are also rather mundane. 

While the shelf life of a wishlist like this is inevitably quite short, this list also reflects how I'm currently thinking about AR development, as well as the areas of AR that I'd like to explore in the next year or so.

So with all those caveats in mind, let's dive in!

# Expanded required device capabilities

Here at the very tippy-top of my fantasy wishlist I've placed "required device capabilities", a term that sounds as if it were ripped from an NIST publication. However required device capabilities—or, more specifically, the lack thereof—is the number one factor I find holding back my AR aspirations.

To understand why, first a bit of background.

iOS 14 runs on everything from the iPhone 12 Pro Max to the now almost six year old iPhone 6S (not to mention the easily forgotten iPod touch and a whole family of iPads). Naturally not every iOS API works across this entire range of devices, so developers have a few options if they want to use one of these:

First are [required device capabilities](https://developer.apple.com/documentation/bundleresources/information_property_list/uirequireddevicecapabilities). Required device capabilities are a static list of hardware features that a device must support to install the app: such as having a camera or Bluetooth support. Sounds reasonable enough.

Developers can also check capabilities at runtime, which is often preferable to disabling the app entirely. If your app is run on a device that lacks a camera for example, your app could simply not show a camera button instead of preventing the app from being installed. All of ARKit's more advanced features use this sort of runtime gating. To augment the front facing camera for example, you check `ARFaceTrackingConfiguration.isSupported`. However, unlike required device capabilities, your app still must function even if a runtime check fails.

Now let's say your app is built around AR face tracking. Face tracking is only supported on devices that have a TrueDepth camera, so if face tracking is simply a nice to have feature, you can do a runtime check of `ARFaceTrackingConfiguration.isSupported` and then disable any face tracking UI/features when it is not. If however face tracking is at the heart of your app, you'd expect to be able to add `hasTrueDepthCamera` to your app's list of required device capabilities so that it can only be installed on devices with a TrueDepth camera. Yet a `hasTrueDepthCamera` required device capability doesn't actually exist today, nor are there required device capabilities for any of ARKit's various feature levels.

That's certainly not ideal, but if you were deploying to the web, your app could simply throw up a, "Sorry, this device is not supported" screen if a runtime capability check fails. That's not even an option in the App Store. To ship, your app must provide some minimum level of functionality for all devices that can install it, which puts developers in a real bind given that the only reason they need to provide this minimum functionality is that they can't effectively limit an app to specific devices using required device capabilities in the first place!

[In the Walls](/in-the-walls) for example is built around face tracking. However because I can't restrict my app to just devices with a TrueDepth camera, I had to put in significant extra work to deliver a pared back experience on older devices. Even though this fallback experience is now pretty solid, I still don't feel it lives up to what my app advertises. The demo videos in the app store are all about face tracking and some users are inevitably disappointed when they learn it isn't supported on their device. I also estimate that at least half the development time and budget for *In the Walls* went towards developing this fallback experience. That's pretty crazy!

In other cases, I've simply not shipped an app because trying to develope an acceptable fallback would be so time consuming and compromise the vision of the app so much. [Face Drop](/face-drop) for example would very likely already be in the App Store if I could use required device capabilities to limit it to devices that have a TrueDepth camera.  

While I'm sure that Apple has its reasons, as an outsider it seems to me that the current situation is bad for developers, bad for consumers, and bad for Apple. The lack of finer grained required device capabilities means that developers have to do extra work and can't build apps around the latest and greatest hardware. Users for their part end up being disappointed by apps that can't deliver what they advertise. And shouldn't Apple want to push users to buy the latest hardware? If someone creates a killer app that requires a LiDAR sensor, that seems like a good way to prod people to buy the more expensive device that can run it.

I'm inclined to say that the decision of what hardware to support should be left up to developers (at least at a high level, such as requiring a specific type of camera). Apple shouldn't need to enforce this compatibility when there's already a good intrinsic motivator in place: more supported devices == more users == more sales.

All this is probably far more about "required device capabilities" than you ever wanted to hear, but if I could wave a magic wand and fix one thing about iOS development today, I'd add required device capabilities for: having a TrueDepth font facing camera, having a back facing LiDAR camera, and for supporting the various `ARConfiguration` options (`supportsSceneReconstruction`, `supportsUserFaceTracking`, etc.). This may sound small, but I believe it would be a big win for developers and result in more innovative, boundary pushing AR apps for consumers.

# Accessing front and back camera simultaneously

For those of you still with us, let's now move on to something more directly AR related, albeit only a bit more exciting sounding: accessing data from both the front and back cameras at the same time.

With ARKit, you currently choose which camera to augment and can then grab color information from that camera (and potentially depth data too, provided the device supports it). What I'd like is the ability to access data from both cameras in the same AR session. 

While this may sound like a very niche feature, I've run into this limitation multiple times while working on my existing apps or thinking about new ones:

- With [In The Walls](/in-the-walls), access to data from both cameras would let me use depth info from the front facing camera to distort the world in real time. My current workaround requires users to record a short video with the front facing camera, then switch to the back camera to place the recorded video in the world. This is clunky and I also have to restart the AR session between these two steps.

- With [Face Drop](/face-drop), this feature would enable capturing the user's current face texture when they place a face in the world. The current prototype again requires first capturing a snapshot with the front facing camera and then switching the back camera for placement.

I'd also love to be able to use hand gestures captured by one camera to interact with a scene being augmented by the other camera. 

I opened a feature request against Apple for this feature half a year or so ago, but it was closed with an explanation about hardware limitations. However there is precedence here: since at least the iPhone XS, ARKit [has supported tracking facial expressions with the front facing camera while augmenting the world using the back facing camera](https://developer.apple.com/documentation/arkit/arworldtrackingconfiguration/3223421-supportsuserfacetracking). Internally Apple must be using both camera feeds for this. And even if current devices can't support this, future devices should be able to. I'd also be perfectly happy with half or quarter resolution data from the secondary camera. 

# AirTags API

AirTags fascinate me, which is odd because I have pretty much zero interest in them as a consumer product. However the precise location tracking technology in them is really cool! I'd love for Apple (or another manufacture) to make this functionality available to developers.

For augmented reality, the ideal usage of AirTags would be as anchors for virtual content. Imagine being able to anchor a virtual hat to an AirTag for example, and then being able to try on the hat by placing the tag on your head. 

However from what I can gather from my limited testing with the *Find My* app, while AirTags can track distance and orientation relatively precisely, I don't think they are precise enough anchoring for virtual content in realtime, especially if attached to a moving subject such as a person. I'd love to be proven wrong but my gut feel is that it's not possible with this generation of hardware.

That being said, there are still plenty of fun use cases that don't require anchoring. If relative distance and orientation were exposed to developers, it would be fairly easy to build a coarse version of theremin or other musical instruments using AirTags. You could also start building some fun games around the technology. And while Apple's Find My app already has haptic feedback, I also imagine there's at least a modicum of fun to be had hooking up a relative distance tracker to devices of a more powerful vibratory nature.

AirTags seem technically quite impressive, so it is a shame they are currently limited to mundane tasks like tracking car keys and luggage. Even in their current state, I'm sure developers would be able to come up with some very cool alternative use applications for them.


# Hand / finger tracking

Within the Apple hype-sphere, it is more or less accepted as fact that Apple will release an AR headset within the next few years, the only real question is when. My bet is that they roll out an ultra crazy expensive developer device to build up an app ecosystem before eventually dropping an only moderately crazy expensive consumer level device.

Apple's AR APIs certainly seem to be slowly converging towards what you'd need for a proper augmented reality headset, what with the recent focus on features such as spatial audio, body occlusion, and shared experiences. We can also look at the APIs the other way around though. What new APIs would be required for a headset vs a phone? I'm of the opinion that hand and finger tracking support would be pretty near the top of this list.

Admittedly, using your hands with phone based AR is an awkward affair, requiring you to grip your phone with one hand while reaching out with the other. However that's not to say that you can't create neat experiences that use hands for interaction. Both [WatAR](/watar-1-1) and [WarpAR](/warpar-1-1) for example let you distort the world using your hands. A few apps have gone even farther and implemented their own finger gesture detection solutions, which varying degrees of success.

Built-in hand/finger tracking would lower the bar to trying out this type of interaction and help get developers thinking about a Tom Cruise-ish future where you won't be clutching a screen all the time. A high level API to help recognize specific gestures would be even more useful, although I'm not keeping my fingers crossed on that one. 


# SceneKit modernization 

I have a bit of a love/hate relationship with SceneKit. On one hand, it's enabled me to quickly create some really unique augmented reality experiences. On the other, I'm still haunted by blank documentation pages and weeks spent banging my head against my keyboard trying to figure out why my shader modifiers wouldn't work.

For its part, Apple seems somewhat eager to forget about SceneKit as well, given that much of their recent augmented reality material has focused hard on RealityKit. However RealityKit not a SceneKit replacement, at least not yet. At the moment, RealityKit doesn't even support custom object shaders. It's still like the kids version of SceneKit, which is pretty bad given that SceneKit is already like the kids version of a real game engine.

Part of me is afraid that when iOS 15 or 16 is announced, SceneKit will quietly be deprecated, leaving developers to choose between using the ultra high level RealityKit API and using Metal directly. While SceneKit is far from perfect, it's builtin and a decent enough middle ground: high level enough that you can throw together simple apps somewhat easily once you understand the basics, while also exposing customization options for more advanced users. In my opinion, it just needs a bit of love.

Top on my list for SceneKit modernization would be a docs overhaul. The SceneKit doc pages are often woefully vague and many APIs could benefit from code examples. I found this especially painful when getting started, but I still run to the problem. Just this last week for example, I failed to figure out how to use [`SCNGeometryTessellator`](https://developer.apple.com/documentation/scenekit/scngeometrytessellator) because it lacks documentation. What is an `insideTessellationFactor`? What does `isAdaptive` mean? I can guess but could not get the result I was after. Even a Github search turned up a scant single page of swift results.

While `SCNGeometryTessellator` is admittedly a pretty niche API, the extremely vague [shader modifier](https://developer.apple.com/documentation/scenekit/scnshadable) docs cost me entire weeks of work. I eventually gave up using shader modifiers entirely because the docs were so unclear and debugging them was such a nightmare.

After tackling the documentation problem and adding more code examples, in my opinion the rest of SceneKit mainly just needs a bit of polish. For example, there are things that require zero or one lines of code with RealityKit that are complicated SceneKit, such as using LiDAR data to add scene physics or adding motion blur to AR. Some part of the API could also benefit from an overhaul, such as `SCNTechnique` which uses an untyped dictionary for configuration and relies heavily on magic string identifiers.

As a stretch, I'd love to see a few more rendering features from more advanced game engines. For example, I've been working on a little project that needs to render flesh, and had a heck of a time getting it to look alive. Support for subsurface scattering would probably help significantly.


# Body anchors / body meshes

Let's wrap things up with something a bit more dreamy.

Ever since the iPhone X, ARKit has been able to provide an approximate model of a user's face for AR. While this face model is very generic, it is a good enough approximation for occlusion and for anchoring 2D/3D objects to the user's face. I'd love to see Apple extend these capabilities to the rest of a user's body.

An easy to use API that lets you anchor a virtual object to part of your body would be great. A simple use case would be affixing a virtual bracelet to your wrists. While you can sort of approximate this using existing ARKit APIs, in my experience you have to do a whole lot of work to get a result that still looks pretty terrible.

I'd also like a 3D mesh that approximates the user's real world body, if for no other reason than it would let me create a version of [Beatsy](/beatsy) that sends waves rippling through your body.

# Closing Thoughts

Ever since I started seriously exploring AR on iOS around a year or so ago, I've been constantly surprised by what I can creating. Apple does a great job exposing some solid basic building blocks and data streams that you can use to assemble some really neat experiences.

Still, there are certainly areas where Apple's AR ecosystem could improve. At the very top of my personal wishlist are some basics, such as finer grained required device capabilities and improved documentation. After that, there's a few API additions and enhancements that I feel could open up some interesting creative options: such as an AirTag API and access to data from both cameras. However I'd be delighted by something completely unexpected too that opens up options that I haven't even considered yet.

I've already got a healthy backlog of AR projects that I'd like to work on using the current APIs. Hopefully the next iOS release brings a few new toys to play with too! (plus those damn required device capabilities)



