'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService, appConfigService, $ionicNavBarDelegate) {
    $scope.success = null;

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.bwsurl = {
      value: (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url
    };

    $scope.resetDefaultUrl = function() {
      $scope.bwsurl.value = ($scope.wallet.coin === 'btc') ? defaults.bws.url : defaults.bwscash.url;
    };

    $scope.save = function() {

      var bws;
      switch ($scope.bwsurl.value) {
        case 'prod':
        case 'production':
          bws = ($scope.wallet.coin === 'btc') ? defaults.bws.url : defaults.bwscash.url;
          break;
        case 'sta':
        case 'staging':
          bws = 'https://bws-staging.b-pay.net/bws/api';
          break;
        case 'loc':
        case 'local':
          bws = 'http://localhost:3232/bws/api';
          break;
      };
      if (bws) {
        $log.info('Using BWS URL Alias to ' + bws);
        $scope.bwsurl.value = bws;
      }

      var opts = {
        bwsFor: {}
      };
      opts.bwsFor[walletId] = $scope.bwsurl.value;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });
  });
