module.exports = function(context) {
  var fs = require('fs');
  var path = require('path');
  var glob = require('glob');

  var root;
  if (context.opts.paths && context.opts.paths.length > 1) {
    root = path.join(context.opts.paths[0], '..');
  } else {
    root = context.opts.projectRoot;
  }

  function replaceStringInFile(filePath, targetStr, replacementStr) {
    var data = fs.readFileSync(filePath, 'utf8');
    var result = data.replace(new RegExp(targetStr, 'g'), replacementStr);
    fs.writeFileSync(filePath, result, 'utf8');
  }

  function findStringInFile(filePath, targetStr) {
    var data;
    try {
      data = fs.readFileSync(filePath, 'utf8');
    } catch(err) {
      return false;
    }
    var result = data.includes(targetStr);
    return result;
  }

  // Perform Fix Routine
  if (root) {

    // Update AndroidManifest.xml
    var androidMainfestPath = root + "/platforms/android/AndroidManifest.xml";

    var removeStrings = [
      "<uses-permission android:name=\"android.permission.CAMERA\" />" // Cordova-Camera-Preview-Plugin Fix
      , "<uses-feature android:name=\"android.hardware.camera\" android:required=\"true\" />"
    ];

    if (removeStrings) {
      removeStrings.forEach( function(targetStr) {
        if (findStringInFile(androidMainfestPath, targetStr)) {
          replaceStringInFile(androidMainfestPath, targetStr, '');
        }
      })
    }
  }
  console.log("Exiting fixAndroidPlugin.js");
}