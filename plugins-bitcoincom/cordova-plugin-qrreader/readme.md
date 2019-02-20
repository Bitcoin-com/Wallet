1. After cloning, delete the platforms/android folder. It's convenient to use that folder for now when working on the plugin. We will remove it from the repo after the plugin dev is complete.

2. `npm run apply:bitcoincom`

3. `node_modules/cordova/bin/cordova plugin add ./plugins-bitcoincom/cordova-plugin-qrreader`

4. `npm run start:android`