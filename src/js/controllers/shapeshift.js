'use strict';

angular.module('copayApp.controllers').controller('shapeshiftController', function($scope, $state, $interval, profileService, walletService, popupService, lodash, $ionicNavBarDelegate) {
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

  // $scope.onFromWalletSelect = function(wallet) {
  //   $scope.fromWallet = wallet;
  //   showToWallets();
  //   generateAddress(wallet, function(addr) {
  //     $scope.fromWalletAddress = addr;
  //   });
  // };
  //
  // $scope.onToWalletSelect = function(wallet) {
  //   $scope.toWallet = wallet;
  //   generateAddress(wallet, function(addr) {
  //     $scope.toWalletAddress = addr;
  //   });
  // };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletsBtc = profileService.getWallets({coin: 'btc'});
    walletsBch = profileService.getWallets({coin: 'bch'});
    $scope.fromWallets = lodash.filter(walletsBtc.concat(walletsBch), function(w) {
      return w.status.balance.availableAmount > 0;
    });

    if ($scope.fromWallets.length === 0) {
      // return
    // } else {
    //   $scope.onFromWalletSelect($scope.fromWallets[0]);
    }

    // $scope.onToWalletSelect($scope.toWallets[0]);

    $scope.singleFromWallet = $scope.fromWallets.length === 1;
    // $scope.singleToWallet = $scope.toWallets.length == 1;
    $scope.fromWalletSelectorTitle = 'From';
    $scope.toWalletSelectorTitle = 'To';
    $scope.showFromWallets = false;
    $scope.showToWallets = false;
    $scope.walletsWithFunds = profileService.getWallets({onlyComplete: true, hasFunds: true});
    console.log($scope.walletsWithFunds);
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
    var params = {
      thirdParty: {
        id: 'shapeshift'
      }
    };
    $state.go('tabs.home').then(function() {
      $state.transitionTo('tabs.send', params);
    });
  }
});
