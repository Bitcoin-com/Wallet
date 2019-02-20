After cloning, delete the platforms/android folder before running `npm run apply:bitcoincom`.
It's convenient to use that folder for now when working on the plugin. We will remove it from the repo after the plugin dev is complete.

To add the plugin (if not found during `npm run apply:bitcoincom`)

`node_modules/cordova/bin/cordova plugin add ./plugins-bitcoincom/cordova-plugin-qrreader`