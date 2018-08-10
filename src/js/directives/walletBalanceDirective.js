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

      if (wallet.status && wallet.status.totalBalanceStr) {
        setDisplay(wallet.status.totalBalanceStr, '');
        cryptoBalanceHasBeenDisplayed = true;
        return;
      }
       
      if (wallet.cachedBalance) {
        setDisplay(wallet.cachedBalance, wallet.cachedBalanceUpdatedOn);
        return;
      }

      if (wallet.cachedStatus && wallet.cachedStatus.totalBalanceStr) {
        setDisplay(wallet.cachedStatus.totalBalanceStr, '');
        return;  
      }
         
      setDisplay('', '');
    }

    function displayFiatBalance(wallet) {
      var displayAmount = '';
      if (wallet.status && wallet.status.alternativeBalanceAvailable) {
        displayAmount = wallet.status.totalBalanceAlternative + ' ' + wallet.status.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      if (wallet.cachedStatus && wallet.cachedStatus.alternativeBalanceAvailable) {
        displayAmount = wallet.cachedStatus.totalBalanceAlternative + ' ' + wallet.cachedStatus.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      getFiatBalance(wallet);
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

    function getFiatBalance(wallet) {
    }

    function setDisplay(amount, cachedBalanceUpdatedOn) {
      $scope.displayAmount = amount;
      $scope.cachedBalanceUpdatedOn = cachedBalanceUpdatedOn;
    }
  }
})();

