'use strict';

angular.module('copayApp.services').factory('clipboardService', function ($http, $log, platformInfo, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
  var root = {};

  root.copyToClipboard = function (data, scope) {
    var msg = gettextCatalog.getString('Copied to clipboard');

    if (!data) return;

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

    scope.$apply(function () {
      ionicToast.show(msg, 'bottom', false, 1000);
    });
  };

  return root;
});