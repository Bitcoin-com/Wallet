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

rm entitlements-child.plist
ln -s ../resources/bitcoin.com/mac/pkg/entitlements-child.plist entitlements-child.plist

rm entitlements-parent.plist
ln -s ../resources/bitcoin.com/mac/pkg/entitlements-parent.plist entitlements-parent.plist

rm build.cfg
ln -s ../resources/bitcoin.com/mac/pkg/build.cfg build.cfg

rm build_mas.py
ln -s ../resources/bitcoin.com/mac/pkg/build_mas.py build_mas.py

echo "Signing ${APP_FULLNAME}"
export CURRENT_PATH=`pwd`
export APP_PATH="pkg/${APP_FULLNAME}/osx64/${APP_FULLNAME}"
export TMP_PATH="tmp"
export DIST_PATH="dist"

rm -rf $TMP_PATH
mkdir $TMP_PATH

if [ ! -d $DIST_PATH ]; then
  mkdir $DIST_PATH
fi

cd "${APP_PATH}.app/Contents/Versions"
ln -s "55.0.2883.87" "Current"

cd $CURRENT_PATH
chmod -vR 777 "${APP_PATH}.app/Contents"

python build_mas.py -C build.cfg -O "${TMP_PATH}/${APP_FULLNAME}.app" -I "${APP_PATH}.app" -P "$DIST_PATH/${APP_PACKAGE}-wallet-${APP_VERSION}-osx.pkg"

echo "Signing Done"

echo "Done."

exit