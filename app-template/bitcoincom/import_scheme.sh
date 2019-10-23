#!/bin/bash

# Set to your project and scheme

export PROJECT_FILE='../../platforms/ios/Bitcoin.com Wallet.xcodeproj'
export SCHEME='BETA.xcscheme'

# Generate path to shared schemes folder

export SCHEMES="$PROJECT_FILE"/xcshareddata/xcschemes

cd "$(dirname "$0")"

if [ ! -f "$SCHEMES/$SCHEME" ]; then

    # Create folder if necessary
    mkdir -p "$SCHEMES"

    # Copy scheme
    cp $SCHEME "$SCHEMES/$SCHEME"
fi