'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, sendFlowService, $state, $timeout, lodash, addressbookService, popupService, $ionicHistory, platformInfo, gettextCatalog, configService, bitcoinCashJsService) {

  var config = configService.getSync();
  var defaults = configService.getDefaults();

  $scope.isChromeApp = platformInfo.isChromeApp;
  $scope.addressbookEntry = {};

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.addressbookEntry = {};
    $scope.addressbookEntry.name = data.stateParams.name;
    $scope.addressbookEntry.email = data.stateParams.email;
    $scope.addressbookEntry.address = data.stateParams.address;
    $scope.addressbookEntry.coin = data.stateParams.coin;

    var bitcoinAlias = (config.bitcoinAlias || defaults.bitcoinAlias).toUpperCase();
    var bitcoinCashAlias = (config.bitcoinCashAlias || defaults.bitcoinCashAlias).toUpperCase();
    $scope.coinAlias = data.stateParams.coin == 'bch' ? bitcoinCashAlias : bitcoinAlias;
  });

  $scope.sendTo = function() {
    var stateParams = {
      data: $scope.addressbookEntry.address,
      toName: $scope.addressbookEntry.name,
      toEmail: $scope.addressbookEntry.email,
      coin: $scope.addressbookEntry.coin
    };

    sendFlowService.start(stateParams);
  };

  $scope.remove = function(addressbookEntry) {
    var title = gettextCatalog.getString('Warning!');
    var message = gettextCatalog.getString('Are you sure you want to delete this contact?');
    popupService.showConfirm(title, message, null, null, function(res) {
      if (!res) return;

      addressbookService.remove(addressbookEntry, function(err, ab) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $ionicHistory.goBack();
      });
    });
  };

});
