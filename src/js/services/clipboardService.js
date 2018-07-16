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
    } else if (navigator && navigator.clipboard) {
      $log.debug("Use navigator clipboard.")
      navigator.clipboard.writeText(data).catch(err => {
        $log.debug("Clipboard writing is not supported in your browser..");
      });
    } else if (clipboard.supported) {
      clipboard.copyText(data);
    } else {
      // Not supported
      return;
    }

  };

  return root;
});