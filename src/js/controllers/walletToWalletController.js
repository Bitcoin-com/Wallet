'use strict';

angular.module('copayApp.controllers').controller('walletToWalletController', function($scope, $rootScope, $log, configService, gettextCatalog, profileService) {

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.type = 'origin'; // origin || destination
    $scope.coin = false; // Wallets to show (for destination screen)
    $scope.walletsEmpty = [];
    $scope.isPaymentRequest = true; // Show price-header

    if ($scope.type === 'origin') {
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send from');
      $scope.walletsEmpty = profileService.getWallets({coin: $scope.coin, hasNoFunds: true});
    } else if ($scope.type === 'destination') {
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
      // Do something with selected wallet
  };
});