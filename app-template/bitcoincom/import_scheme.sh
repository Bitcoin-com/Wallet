#!/bin/bash

# Set to your project and scheme

export PROJECT_FILE="../../platforms/ios/Bitcoin.com Wallet.xcodeproj"
export SCHEME="BETA.xcscheme"
export TEST="../../platforms/ios"

# Generate path to shared schemes folder
export SCHEMES="$PROJECT_FILE/xcshareddata/xcschemes"
export DEST="$SCHEMES/$SCHEME"

if [ ! -f "$DEST" ]; then

    # Create folder if necessary
    echo making directory $SCHEMES
    mkdir -p $SCHEMES

    # Copy scheme
    cp "${SCHEME}" "$DEST"
fi