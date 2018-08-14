'use strict';

angular.module('copayApp.controllers').controller('shapeshiftController', function($scope, sendFlowService, $state, $timeout, $ionicHistory, profileService, walletService, popupService, lodash, $ionicNavBarDelegate) {
  var walletsBtc = [];
  var walletsBch = [];

  function generateAddress(wallet, cb) {
    if (!wallet) return;
    walletService.getAddress(wallet, false, function(err, addr) {
      if (err) {
        popupService.showAlert(err);
      }
      return cb(addr);
    });
  }

  function showToWallets() {
    $scope.toWallets = $scope.fromWallet.coin === 'btc' ? walletsBch : walletsBtc;
    $scope.onToWalletSelect($scope.toWallets[0]);
    $scope.singleToWallet = $scope.toWallets.length === 1;
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletsBtc = profileService.getWallets({coin: 'btc'});
    walletsBch = profileService.getWallets({coin: 'bch'});
    $scope.fromWallets = lodash.filter(walletsBtc.concat(walletsBch), function(w) {
      return w.status.balance.availableAmount > 0;
    });

    $scope.singleFromWallet = $scope.fromWallets.length === 1;
    $scope.fromWalletSelectorTitle = 'From';
    $scope.toWalletSelectorTitle = 'To';
    $scope.showFromWallets = false;
    $scope.showToWallets = false;
    $scope.walletsWithFunds = profileService.getWallets({onlyComplete: true, hasFunds: true});
    $scope.wallets = profileService.getWallets({onlyComplete: true});
    $scope.hasWallets = !lodash.isEmpty($scope.wallets);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.showFromWalletSelector = function() {
    $scope.showFromWallets = true;
  };

  $scope.showToWalletSelector = function() {
    $scope.showToWallets = true;
  };

  // This could probably be enhanced refactoring the routes abstract states
  $scope.createWallet = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.add.create-personal');
    });
  };

  $scope.buyBitcoin = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.buyandsell');
    });
  };

  $scope.shapeshift = function() {
    var stateParams = {
      thirdParty: {
        id: 'shapeshift'
      }
    };

    // Starting new send flow, so ensure everything is reset
    sendFlowService.clear();
    $state.go('tabs.home').then(function() {
      $ionicHistory.clearHistory();
      $state.go('tabs.send').then(function() {
        $timeout(function () {
          sendFlowService.pushState(stateParams);
          $state.transitionTo('tabs.send.origin');
        }, 60);
      });
    });
  }
});
