'use strict';

angular.module('copayApp.controllers').controller('shapeshiftController', function($scope, $interval, profileService, walletService, popupService, lodash, $ionicNavBarDelegate) {
  var vm = this;

  //vm.buyBitcion = buyBitcoin;

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
    $scope.toWallets = $scope.fromWallet.coin == 'btc' ? walletsBch : walletsBtc;
    $scope.onToWalletSelect($scope.toWallets[0]);
    $scope.singleToWallet = $scope.toWallets.length == 1;
  }

  function buyBitcoin() {
    console.log('buyBitcoin()');
  }

  $scope.buyBitcoin = buyBitcoin;

  $scope.onFromWalletSelect = function(wallet) {
    $scope.fromWallet = wallet;
    showToWallets();
    generateAddress(wallet, function(addr) {
      $scope.fromWalletAddress = addr;
    });
  };

  $scope.onToWalletSelect = function(wallet) {
    $scope.toWallet = wallet;
    generateAddress(wallet, function(addr) {
      $scope.toWalletAddress = addr;
    });
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    console.log('beforeEnter()');
    walletsBtc = profileService.getWallets({coin: 'btc'});
    walletsBch = profileService.getWallets({coin: 'bch'});
    $scope.fromWallets = lodash.filter(walletsBtc.concat(walletsBch), function(w) {
      return w.status.balance.availableAmount > 0;
    });
    console.log('Checking wallets.');
    if ($scope.fromWallets.length == 0) {
      // Need to go to new origin screen here, with parameters
      var params = {
        thirdParty: {
          id: 'shapeshift'
        }
      };
      console.log('Asking for transition');
      $state.transitionTo('tabs.send', params);
      return
    } 
    $scope.onFromWalletSelect($scope.fromWallets[0]);
    $scope.onToWalletSelect($scope.toWallets[0]);
    $scope.singleFromWallet = $scope.fromWallets.length == 1;
    $scope.singleToWallet = $scope.toWallets.length == 1;
    $scope.fromWalletSelectorTitle = 'From';
    $scope.toWalletSelectorTitle = 'To';
    $scope.showFromWallets = false;
    $scope.showToWallets = false;
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.showFromWalletSelector = function() {
    $scope.showFromWallets = true;
  }

  $scope.showToWalletSelector = function() {
    $scope.showToWallets = true;
  }
});
