'use strict';

angular.module('copayApp.controllers').controller('sendFlowController', function($scope, $rootScope, $state, $stateParams, $log, $ionicHistory, configService, gettextCatalog, profileService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var config = configService.getSync().wallet.settings;
    $scope.sendFlowTitle = "";

    if ($state.current.name === 'tabs.send.wallet-to-wallet') {
      $scope.sendFlowTitle = gettextCatalog.getString('Wallet to Wallet Transfer');
    }

    $scope.params = $stateParams;
    $scope.coin = false; // Wallets to show (for destination screen or contacts)
    $scope.type = data.stateParams && data.stateParams['fromWalletId'] ? 'destination' : 'origin'; // origin || destination

    if ($scope.params.coin) {
      $scope.coin = $scope.params.coin; // Contacts have a coin embedded
    }

    if ($scope.params.amount) { // There is an amount, so presume that it a payment request
      $scope.sendFlowTitle = gettextCatalog.getString('Payment request');
      $scope.specificAmount = $scope.specificAlternativeAmount = '';
      $scope.requestAmount = (($stateParams.amount) * (1 / config.unitToSatoshi)).toFixed(config.unitDecimals);
      $scope.isPaymentRequest = true;
    }
    if ($scope.params.thirdParty) {
      // Third Party Service
      if ($scope.params.thirdParty.id === 'shapeshift') {

      }
    }
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    configService.whenAvailable(function(config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
    });

    $scope.walletsEmpty = []; // empty wallets for origin screen

    if ($scope.type === 'origin') {
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send from');
      $scope.walletsEmpty = profileService.getWallets({coin: $scope.coin, hasNoFunds: true});
    } else if ($scope.type === 'destination') {
      $scope.fromWallet = profileService.getWallet(data.stateParams.fromWalletId);
      $scope.coin = $scope.fromWallet.coin; // Only show wallets with the select origin wallet coin
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send to');
    }

    if (!$scope.coin || $scope.coin === 'bch') { // if no specific coin is set or coin is set to bch
      $scope.walletsBch = profileService.getWallets({coin: 'bch', hasFunds: $scope.type==='origin'});
    }
    if (!$scope.coin || $scope.coin === 'btc') { // if no specific coin is set or coin is set btc
      $scope.walletsBtc = profileService.getWallets({coin: 'btc', hasFunds: $scope.type === 'origin'});
    }
  });

  function getNextStep() {
    if (!$scope.params.toWalletId && !$scope.params.toAddress) { // If we have no toAddress or fromWallet
      return 'tabs.send.destination';
    } else if (!$scope.params.amount) { // If we have no amount
      return 'tabs.send.amount';
    } else { // If we do have them
      return 'tabs.send.confirm';
    }
  }

  $scope.useWallet = function(wallet) {
    if ($scope.type === 'origin') { // we're on the origin screen, set wallet to send from
      $scope.params['fromWalletId'] = wallet.id;
    } else { // we're on the destination screen, set wallet to send to
      $scope.params['toWalletId'] = wallet.id;
    }
    $state.transitionTo(getNextStep(), $scope.params);
  };

  $scope.goBack = function() {
    $ionicHistory.goBack();
  }

});