#!/bin/bash

# make sure we are in the correct dir when we double-click a .command file
dir=${0%/*}
if [ -d "$dir" ]; then
  cd "$dir"
fi

# set up your app name, architecture, and background image file name
APP_PACKAGE=$1
APP_VERSION=$2
APP_NAME=$3
APP_FULLNAME=$4

export APP_LINUX_PATH="others/${APP_NAME}/linux64"
export APP_WIN_PATH="others/${APP_NAME}/win64"
export DIST_PATH="dist"

if [ ! -d $DIST_PATH ]; then
  mkdir $DIST_PATH
fi

##
# LINUX

echo "Building Linux..."

# Building package
cp -R $APP_LINUX_PATH bitcoin-com-wallet
tar -cvzf "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-linux-x64.tar.gz" bitcoin-com-wallet

# Clean
rm -R bitcoin-com-wallet

echo "Linux Done."


##
# WINDOWS

echo "Building Windows..."

# Building package
cp -R $APP_WIN_PATH bitcoin-com-wallet
zip -r "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-win-x64.zip" bitcoin-com-wallet

# Clean
rm -R bitcoin-com-wallet

echo "Windows Done."

echo "Done."

exit
