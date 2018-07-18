'use strict';

angular.module('copayApp.controllers').controller('walletToWalletController', function($scope, $rootScope, $log, profileService, configService) {

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.walletsBch = profileService.getWallets({coin: 'bch'});
    $scope.walletsBtc = profileService.getWallets({coin: 'btc'});
    configService.whenAvailable(function(config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
    });
  });

  $scope.useWallet = function(wallet) {
      // Do something with selected wallet
  };

});