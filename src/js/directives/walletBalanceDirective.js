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
    
  function walletBalanceController($log, $scope, txFormatService) {
    var cryptoBalanceHasBeenDisplayed = false;
    
    formatBalance();
    $scope.$watchGroup(['displayAsFiat', 'totalBalanceSat'], function onWalletBalanceWatch() {
      formatBalance();
    });

    function displayCryptoBalance(wallet) {
      console.log('displayCryptoBalance()');

      if (wallet.status && wallet.status.isValid && wallet.status.totalBalanceStr) {
        setDisplay(wallet.status.totalBalanceStr, '');
        cryptoBalanceHasBeenDisplayed = true;
        return;
      }
       
      if (wallet.cachedBalance) {
        setDisplay(wallet.cachedBalance, wallet.cachedBalanceUpdatedOn);
        return;
      }

      if (wallet.cachedStatus && wallet.status.isValid && wallet.cachedStatus.totalBalanceStr) {
        setDisplay(wallet.cachedStatus.totalBalanceStr, '');
        return;  
      }
         
      setDisplay('', '');
    }

    function displayFiatBalance(wallet) {
      var displayAmount = '';
      if (wallet.status && wallet.status.isValid && wallet.status.alternativeBalanceAvailable) {
        displayAmount = wallet.status.totalBalanceAlternative + ' ' + wallet.status.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      if (wallet.cachedStatus && wallet.cachedStatus.isValid && wallet.cachedStatus.alternativeBalanceAvailable) {
        displayAmount = wallet.cachedStatus.totalBalanceAlternative + ' ' + wallet.cachedStatus.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      getFiatBalance(wallet);
    }

    function formatBalance() {
      var displayAsFiat = $scope.displayAsFiat === 'true';
      if (!$scope.wallet) {
        setDisplay('', '');
        return;
      }

      var wallet = null;
      try {
        wallet = JSON.parse($scope.wallet);
      } catch (e) {
        $log.error('Error parsing wallet to display balance.', e);
        setDisplay('', '');
        return;
      }

      if (!displayAsFiat || displayAsFiat && !cryptoBalanceHasBeenDisplayed) {
        displayCryptoBalance(wallet);
      }

      if (displayAsFiat) {
        displayFiatBalance(wallet);
      }
    }

    function getFiatBalance(wallet) {
      if (!(wallet.status && wallet.status.isValid)) {
        $log.warn('Abandoning call to get fiat balance, because no valid wallet status.');
        return;
      }

      txFormatService.formatAlternativeStr(wallet.coin, wallet.status.totalBalanceSat, function onFormatAlernativeStr(formatted) {
        if (formatted) {
          setDisplay(formatted, '');
        }
      });
    }

    function setDisplay(amount, cachedBalanceUpdatedOn) {
      $scope.displayAmount = amount;
      $scope.cachedBalanceUpdatedOn = cachedBalanceUpdatedOn;
    }
  }
})();

