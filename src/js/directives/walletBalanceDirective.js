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
        // The Wallet object is sometimes not stringify()-able, so not interpolatable,
        // so can't be passed to a directive.
        walletStatus: '@',
        walletCachedBalance: '@',
        walletCachedBalanceUpdatedOn: '@',
        walletCachedStatus: '@'
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

    function displayCryptoBalance(walletStatus, walletCachedBalance, walletCachedBalanceUpdatedOn, walletCachedStatus) {
      console.log('displayCryptoBalance()');

      if (walletStatus && walletStatus.isValid && walletStatus.totalBalanceStr) {
        setDisplay(walletStatus.totalBalanceStr, '');
        cryptoBalanceHasBeenDisplayed = true;
        return;
      }
       
      if (walletCachedBalance) {
        setDisplay(walletCachedBalance, walletCachedBalanceUpdatedOn);
        return;
      }

      if (walletCachedStatus && walletCachedStatus.isValid && walletCachedStatus.totalBalanceStr) {
        setDisplay(walletCachedStatus.totalBalanceStr, '');
        return;  
      }
         
      setDisplay('', '');
    }

    function displayFiatBalance(walletStatus, walletCachedStatus) {
      var displayAmount = '';
      if (walletStatus && walletStatus.isValid && walletStatus.alternativeBalanceAvailable) {
        displayAmount = walletStatus.totalBalanceAlternative + ' ' + walletStatus.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      if (walletCachedStatus && walletCachedStatus.isValid && walletCachedStatus.alternativeBalanceAvailable) {
        displayAmount = walletCachedStatus.totalBalanceAlternative + ' ' + walletCachedStatus.alternativeIsoCode;
        setDisplay(displayAmount, '');
        return;
      }

      getFiatBalance(wallet);
    }

    function formatBalance() {
      var displayAsFiat = $scope.displayAsFiat === 'true';

      var walletStatusObj = null;
      var walletCachedBalance = null;
      var walletCachedBalanceUpdatedOn = null;
      var walletCachedStatusObj = null;

      try {
        walletStatusObj = JSON.parse($scope.walletStatus);
      } catch (e) {
        $log.warn('Failed to parse walletStatus.', e);
      }

      try {
        walletCachedStatusObj = JSON.parse($scope.walletCachedStatus);
      } catch (e) {
        $log.warn('Failed to parse walletCachedStatus.', e);
      }

      if (!displayAsFiat || displayAsFiat && !cryptoBalanceHasBeenDisplayed) {
        displayCryptoBalance(walletStatusObj, walletCachedBalance, walletCachedBalanceUpdatedOn, walletCachedStatusObj);
      }

      if (displayAsFiat) {
        displayFiatBalance(walletStatusObj, walletCachedStatusObj);
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

