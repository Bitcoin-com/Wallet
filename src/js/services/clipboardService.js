'use strict';

angular.module('copayApp.services').factory('clipboardService', function ($http, $log, $timeout, platformInfo, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
  var root = {};

  root.copyToClipboard = function (data) {
    if (!data) return;

    $log.debug("Copy '"+data+"' to clipboard");
    if (platformInfo.isCordova) {
      cordova.plugins.clipboard.copy(data);
    } else if (platformInfo.isNW) {
      nodeWebkitService.writeToClipboard(data);
    } else if (navigator && navigator.clipboard) {
      $log.debug("Use navigator clipboard.")
      navigator.clipboard.writeText(data).catch(function onClipboardError(err) {
        $log.debug("Clipboard writing is not supported in your browser..");
      });
    } else if (clipboard.supported) {
      clipboard.copyText(data);
    } else {
      // Not supported
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
      $timeout(function() {
        cb(nodeWebkitService.readFromClipboard());
      },0);
    } else {
      navigator.clipboard.readText()
          .then(function (text) {
            cb(text);
          })
          .catch(function (err) {
            $log.debug("Clipboard reading is not supported in browser..");
          });

      return;
    }
  };

  return root;
});