'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, lodash, addressbookService, popupService, $ionicHistory, platformInfo, gettextCatalog, configService, bitcoinCashJsService) {

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
    $ionicHistory.removeBackView();
    $state.go('tabs.send');
    $timeout(function() {
      var to = '';
      if ($scope.addressbookEntry.coin == 'bch') {
        var a = 'bitcoincash:' + $scope.addressbookEntry.address;
        to = bitcoinCashJsService.readAddress(a).legacy;
      } else {
        to = $scope.addressbookEntry.address;
      }
      $state.transitionTo('tabs.send.amount', {
        toAddress: to,
        toName: $scope.addressbookEntry.name,
        toEmail: $scope.addressbookEntry.email,
        coin: $scope.addressbookEntry.coin
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    var title = gettextCatalog.getString('Warning!');
    var message = gettextCatalog.getString('Are you sure you want to delete this contact?');
    popupService.showConfirm(title, message, null, null, function(res) {
      if (!res) return;
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $ionicHistory.goBack();
      });
    });
  };

});
