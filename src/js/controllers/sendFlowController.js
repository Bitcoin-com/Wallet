'use strict';

angular.module('copayApp.controllers').controller('sendFlowController', function($scope, $rootScope, $state, $stateParams, $log, configService, gettextCatalog, profileService) {

  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var config = configService.getSync().wallet.settings;

    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;

    // in SAT ALWAYS
    if ($stateParams.toAmount) {
      $scope.requestAmount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
      $scope.isPaymentRequest = true;
    }

    console.log(data, $stateParams);

    $scope.params = $stateParams;
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    console.log(data, $stateParams);
    $scope.type = data.stateParams.fromWalletId ? 'destination' : 'origin'; // origin || destination
    $scope.coin = false; // Wallets to show (for destination screen)
    $scope.walletsEmpty = [];
     // Show price-header

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

  $scope.useWallet = function(wallet) {
    if ($scope.type === 'origin') {
      $scope.params['fromWalletId'] = wallet.id;
      $state.transitionTo('tabs.send.destination', $scope.params);
    } else {
      $scope.params['toWalletId'] = wallet.id;
      $state.transitionTo('tabs.send.amount', $scope.params);
    }
  };
});