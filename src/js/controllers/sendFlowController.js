'use strict';

angular.module('copayApp.controllers').controller('sendFlowController', function($scope, $rootScope, $state, $stateParams, $log, configService, gettextCatalog, profileService) {

  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var nextStep = '';

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var config = configService.getSync().wallet.settings;
    $scope.params = $stateParams;
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;

    if ($scope.params.amount) {
      console.log("is Payment Request", $scope.params.amount);

      $scope.requestAmount = (($stateParams.amount) * satToUnit).toFixed(unitDecimals);
      $scope.isPaymentRequest = true;
    }
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    console.log(data, $stateParams);
    $scope.type = data.stateParams && data.stateParams['fromWalletId'] ? 'destination' : 'origin'; // origin || destination
    $scope.coin = false; // Wallets to show (for destination screen)
    $scope.walletsEmpty = [];
     // Show price-header

    console.log("current type: "+$scope.type);

    if ($scope.type === 'origin') {
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send from');
      $scope.walletsEmpty = profileService.getWallets({coin: $scope.coin, hasNoFunds: true});
    } else if ($scope.type === 'destination') {

      $scope.fromWallet = profileService.getWallet(data.stateParams.fromWalletId);
      $scope.coin = $scope.fromWallet.coin;

      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send to');
    }

    if (!$scope.coin || $scope.coin === 'bch') {
      $scope.walletsBch = profileService.getWallets({coin: 'bch', hasFunds: $scope.type==='origin'});
    }
    if (!$scope.coin || $scope.coin === 'btc') {
      $scope.walletsBtc = profileService.getWallets({coin: 'btc', hasFunds: $scope.type === 'origin'});
    }

    configService.whenAvailable(function(config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
    });
  });

  function getNextStep() {
    if (!$scope.params.toWalletId && !$scope.params.toAddress) {
      return 'tabs.send.destination';
    } else if (!$scope.params.amount) {
      return 'tabs.send.amount';
    } else {
      return 'tabs.send.confirm';
    }
  }

  $scope.useWallet = function(wallet) {
    if ($scope.type === 'origin') {
      $scope.params['fromWalletId'] = wallet.id;
    } else {
      $scope.params['toWalletId'] = wallet.id;
    }
    $state.transitionTo(getNextStep(), $scope.params);
  };
});