---
layout: post
title: "VoxelizeAR"
description: Turn the world around you into voxels with this iOS augmented reality app
series: arr
titleImage:
    file: 'title.gif'
titleVideo:
    file: 'title.mp4'
---

[VoxelizeAR][app] is a new augmented reality app for iOS that lets you convert the real world into [voxels](https://en.wikipedia.org/wiki/Voxel).

**Links**
- [Get VoxelizeAR on the App Store][app]
- [Support][docs]

{% include youtube.html width="560" height="315" src="https://www.youtube.com/embed/3t8PqWGsGC4"  %}

As you touch the screen, voxelizeAR converts the 3D geometry of the world into a three dimensional grid of single colored voxels. This isn't a simple image filter however: voxelizeAR uses augmented reality to persist the voxelization even as you walk around the world. This really makes it look like you've gone and pixelated a little slice of reality.

{% include image.html file="flowers.png" description="Voxelized flowers" %}

Voxelizer works best on devices with a LiDAR sensor—such as the iPhone 12 Pro or iPad Pro—as these support voxelizing arbitrary 3D solid surfaces. Devices without a LiDAR sensor can still run voxelizeAR just fine, but are limited to voxelizing on flat, horizontal or vertical surfaces. Multiple flat surfaces can be detected at the same time however, so you can still create more limited three dimensional effects.

{% include video.html file="big.mp4" poster="big-poster.jpg" description="Adjust the size of the voxels to change the visual effect" %}

It's unfortunate that not all devices support because the ability to just stroll around the world instantly turning parts of it into voxels is really pretty great! I've got a few of other app ideas that may make use of this technology too. <!-- Next stop: 41°23′16″N 93°16′7″W! -->

[Give voxelizeAR a try][app] and let me know what you think! It's a free app too, so if you enjoy it be sure to leave a review to help others find it.

[app]: https://apps.apple.com/us/app/voxelizear/id1575681728
[docs]: https://github.com/mattbierner/voxelizeAR-support

