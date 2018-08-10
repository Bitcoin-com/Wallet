'use strict';

(function(){

  angular
  .module('bitcoincom.directives')
  .directive('walletBalance', function() {
    return {
      restrict: 'E',
      scope: {
        displayAsFiat: '@',
        totalBalanceSat: '@',
        wallet: '@'
      },
      templateUrl: 'views/includes/wallet-balance.html',
      controller: walletBalanceController
    }
  });
    
  function walletBalanceController($log, $scope, $timeout, uxLanguage) {
    console.log('walletBalanceController');
    var cryptoBalanceHasBeenDisplayed = false;
    
    formatBalance();
    $scope.$watchGroup(['displayAsFiat', 'totalBalanceSat'], function onWalletBalanceWatch() {
      formatBalance();
    });

    function displayCryptoBalance(wallet) {
      console.log('displayCryptoBalance()');
      if (wallet.status) {
        if (wallet.status.totalBalanceStr) {
          $scope.displayAmount = wallet.status.totalBalanceStr;
          $scope.cachedBalanceUpdatedOn = '';
          console.log('Displaying wallet.status.totalBalanceStr');

        } else if (wallet.status.cachedBalance) {
          $scope.displayAmount = wallet.status.cachedBalance;
          $scope.cachedBalanceUpdatedOn = wallet.status.cachedBalanceUpdatedOn;
          console.log('Displaying wallet.status.cachedBalance');

        } else {
          $scope.displayAmount = '';
          $scope.cachedBalanceUpdatedOn = '';
          console.log('Displaying "" from status');
        }
      } else if (wallet.cachedBalance) {
        $scope.displayAmount = cachedBalance;
        $scope.cachedBalanceUpdatedOn = '';
        console.log('Displaying cachedBalance');

      } else {
        $scope.displayAmount = '';
        $scope.cachedBalanceUpdatedOn = '';
        console.log('Displaying "" without status');
      }
      cryptoBalanceHasBeenDisplayed = true;
    }

    function displayFiatBalance(wallet) {
    
    }

    function formatBalance() {
      //console.log('formatBalance() with wallet:', $scope.wallet,);
      console.log('formatBalance() with displayAsFiat: "' + $scope.displayAsFiat + '"');
      var wallet = null;
      try {
        wallet = JSON.parse($scope.wallet);
      } catch (e) {
        $log.error('Error parsing wallet to display balance.', e);
        $scope.displayAmount = '';
        $scope.cachedBalanceUpdatedOn = '';
      }

      if (!$scope.displayAsFiat || $scope.displayAsFiat && !cryptoBalanceHasBeenDisplayed) {
        displayCryptoBalance(wallet);
      }

      if ($scope.displayAsFiat) {
        displayFiatBalance(wallet);
      }


    }
  }
})();

