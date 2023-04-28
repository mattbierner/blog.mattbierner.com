#!/bin/sh
FILE=`basename $1 .mp4`
DIR=`dirname $1`

ffmpeg -ss 00:00:9  -i $DIR/$FILE.mp4 -vframes 1 -s 405x720 -y $DIR/$FILE-poster.jpg