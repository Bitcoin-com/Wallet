#!/usr/bin/env bash

#usage: ./annotate_icon.sh beta BETA 003eaa

# Required command line parameters
FOLDER_NAME=$1
DEST_FOLDER_RELATIVE=../resources/bitcoin.com/ios/icon/$FOLDER_NAME
DEST_ICON_MASTER=$DEST_FOLDER_RELATIVE/icon-1024.png
SOURCE_ICON='resources/ios/icon/icon-1024.png'

mkdir $DEST_FOLDER_RELATIVE

if [ -z "$3" ]; then
  cp $SOURCE_ICON $DEST_ICON_MASTER
else
  ICON_TEXT=$2
  HEX_COLOR=$3
  convert $SOURCE_ICON -gravity center -pointsize 144 -draw "fill '#$HEX_COLOR' rotate -45 rectangle -500,1035,500,1200"  -draw "fill white font 'bitcoincom/fonts/ProximaNova-ExtraBold.otf'  rotate -45 text 0,400 '$ICON_TEXT'" $DEST_ICON_MASTER
fi

# iPhone Notifications
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 40x40 $DEST_FOLDER_RELATIVE/icon-40.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 60x60 $DEST_FOLDER_RELATIVE/icon-60.png

# iPhone Settings
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 29x29 $DEST_FOLDER_RELATIVE/icon-29.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 58x58 $DEST_FOLDER_RELATIVE/icon-58.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 87x87 $DEST_FOLDER_RELATIVE/icon-87.png

# iPhone Spotlight
# 40 - already done
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 80x80 $DEST_FOLDER_RELATIVE/icon-80.png

# iPhone App, iOS 5, 6
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 57x57 $DEST_FOLDER_RELATIVE/icon-57.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 114x114 $DEST_FOLDER_RELATIVE/icon-114.png

# iPhone App, iOS 7+
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 120x120 $DEST_FOLDER_RELATIVE/icon-120.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 180x180 $DEST_FOLDER_RELATIVE/icon-180.png

# iPad Notifications
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 20x20 $DEST_FOLDER_RELATIVE/icon-20.png
# 40 - already done

# iPad Settings
# 29 - already done
# 58 - already done

# iPad Spotlight, iOS 7+
# 40 - already done
# 80 - already done

# iPad Spotlight, iOS 5, 6
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 50x50 $DEST_FOLDER_RELATIVE/icon-50.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 100x100 $DEST_FOLDER_RELATIVE/icon-100.png

# iPad App, iOS 5, 6
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 72x72 $DEST_FOLDER_RELATIVE/icon-72.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 144x144 $DEST_FOLDER_RELATIVE/icon-144.png

# iPad App, iOS 7+
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 76x76 $DEST_FOLDER_RELATIVE/icon-76.png
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 152x152 $DEST_FOLDER_RELATIVE/icon-152.png

# iPad Pro App
convert $DEST_FOLDER_RELATIVE/icon-1024.png -resize 167x167 $DEST_FOLDER_RELATIVE/icon-167.png