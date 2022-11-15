#!/bin/sh
FILE=`basename $1 .mp4`
DIR=`dirname $1`

ffmpeg -ss 00:00:00 -i $DIR/$FILE.mp4 -vframes 1 $2 -y $DIR/$FILE-poster.jpg