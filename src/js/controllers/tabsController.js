'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($rootScope, $log, $scope, $state, $stateParams, $timeout, platformInfo, incomingDataService, lodash, popupService, gettextCatalog, scannerService, sendFlowService) {

  $scope.onScan = function(data) {
    incomingDataService.redir(data, function onError(err) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err.message);
      }
    });
  };

  $scope.setScanFn = function(scanFn) {
    $scope.scan = function() {
      $log.debug('Scanning...');
      scanFn();
    };
  };

  $scope.startFreshSend = function() {
    sendFlowService.start();
  };

  $scope.importInit = function() {
    $scope.fromOnboarding = $stateParams.fromOnboarding;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.chooseScanner = function() {
    var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

    if (!isWindowsPhoneApp) {
      $state.go('tabs.scan');
      return;
    }

    scannerService.useOldScanner(function(err, contents) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err.message);
      } else {
        incomingDataService.redir(contents, function onError(err) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err.message);
          }
        });
      }
    });

  };

});
