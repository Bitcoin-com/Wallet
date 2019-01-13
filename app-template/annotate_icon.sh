#!/usr/bin/env bash

FOLDER_NAME=$1
DEST_FOLDER_RELATIVE=../resources/bitcoin.com/ios/icon/$FOLDER_NAME

mkdir $DEST_FOLDER_RELATIVE
convert '../resources/bitcoin.com/ios/icon/icon-1024.png' -gravity center -pointsize 144 -fill '#003eaa' -draw "fill #003eaa rotate -45 rectangle -500,1035,500,1200"  -draw "fill white font 'bitcoincom/fonts/ProximaNova-ExtraBold.otf'  rotate -45 text 0,400 'DEBUG'" $DEST_FOLDER_RELATIVE/icon-1024.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 120x120 $DEST_FOLDER_RELATIVE/icon-120.png