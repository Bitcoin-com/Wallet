'use strict';

angular.module('copayApp.services').factory('clipboardService', function ($http, $log, platformInfo, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
  var root = {};

  root.copyToClipboard = function (data) {
    if (!data) return;

    $log.debug("Copy '"+data+"' to clipboard");
    if (platformInfo.isCordova) {
      cordova.plugins.clipboard.copy(data);
    } else if (platformInfo.isNW) {
      nodeWebkitService.writeToClipboard(data);
    } else if (clipboard.supported) {
      clipboard.copyText(data);
    } else {
      // No supported
      return;
    }
  };

  root.readFromClipboard = function (cb) {
    $log.debug("Read from clipboard");
    if (platformInfo.isCordova) {
      cordova.plugins.clipboard.paste(function(text) {
        cb(text);
      })
    } else if (platformInfo.isNW) {
      cb(nodeWebkitService.readFromClipboard());
    } else {
      navigator.clipboard.readText()
          .then(text => {
            cb(text);
          })
          .catch(err => {
            $log.debug("Clipboard reading is not supported in browser..");
          });

      return;
    }
  };

  return root;
});