#!/usr/bin/env bash

#usage: ./annotate_icon.sh beta BETA 003eaa

# Required command line parameters
FOLDER_NAME=$1
ICON_TEXT=$2
HEX_COLOR=$3

DEST_FOLDER_RELATIVE=../resources/bitcoin.com/ios/icon/$FOLDER_NAME

mkdir $DEST_FOLDER_RELATIVE
convert '../resources/bitcoin.com/ios/icon/icon-1024.png' -gravity center -pointsize 144 -draw "fill '#$HEX_COLOR' rotate -45 rectangle -500,1035,500,1200"  -draw "fill white font 'bitcoincom/fonts/ProximaNova-ExtraBold.otf'  rotate -45 text 0,400 '$ICON_TEXT'" $DEST_FOLDER_RELATIVE/icon-1024.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 120x120 $DEST_FOLDER_RELATIVE/icon-120.png