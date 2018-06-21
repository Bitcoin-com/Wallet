#!/bin/bash

# make sure we are in the correct dir when we double-click a .command file
dir=${0%/*}
if [ -d "$dir" ]; then
  cd "$dir"
fi

APP_PACKAGE=$1
APP_VERSION=$2
export DIST_PATH="dist"

##
# INIT GPG (YOU NEED THE PRIVATE KEY CONNECTED TO YOUR DESKTOP)
# gpg --card-edit

##
# LINUX

# Sig tar.gz
gpg --yes --output "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-linux-x64.tar.gz.sig" --detach-sig "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-linux-x64.tar.gz"
gpg --verify "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-linux-x64.tar.gz.sig" "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-linux-x64.tar.gz"

##
# WINDOWS

# Sig zip
gpg --yes --output "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-win-x64.zip.sig" --detach-sig "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-win-x64.zip"
gpg --verify "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-win-x64.zip.sig" "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-win-x64.zip"

##
# OSX

# Sig dmg
gpg --yes --output "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.dmg.sig" --detach-sig "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.dmg"
gpg --verify "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.dmg.sig" "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.dmg"

# Sig pkg
gpg --yes --output "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.pkg.sig" --detach-sig "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.pkg"
gpg --verify "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.pkg.sig" "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.pkg"