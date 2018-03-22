'use strict';

angular.module('copayApp.controllers').controller('signMessageController', function($scope, $interval, profileService, walletService, popupService, lodash, $ionicNavBarDelegate, signVerifyMessageService) {

  $scope.message = {};
  $scope.message.value = "";

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.walletSelectorTitle = 'Wallets';
    $scope.wallets = profileService.getWallets();
    $scope.wallet = $scope.wallets[0];
    $scope.showWallets = false;
    $scope.singleWallet = $scope.wallets.length > 1;
  });

  $scope.showWalletSelector = function() {
    $scope.showWallets = true;
  }

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
  }

  $scope.signMessage = function() {
    $scope.signedMessage = signVerifyMessageService.signMessage($scope.wallet, $scope.message.value);
  }
});
