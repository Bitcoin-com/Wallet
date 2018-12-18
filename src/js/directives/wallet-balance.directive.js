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
        walletBalanceHidden: '@',
        walletCoin: '@',
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

    function displayFiatBalance(walletStatus, walletCachedStatus, walletCoin) {
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

      getFiatBalance(walletStatus, walletCachedStatus, walletCoin);
    }

    function formatBalance() {
      var displayAsFiat = $scope.displayAsFiat === 'true';
      $scope.balanceHidden = $scope.walletBalanceHidden === 'true';

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
        displayFiatBalance(walletStatusObj, walletCachedStatusObj, $scope.walletCoin);
      }
    }

    function getFiatBalance(walletStatus, walletCachedStatus, walletCoin) {
      var totalBalanceSat = null;

      if (walletStatus && walletStatus.isValid) {
        totalBalanceSat = walletStatus.totalBalanceSat
      } else if (walletCachedStatus && walletCachedStatus.isValid) {
        totalBalanceSat = walletCachedStatus.totalBalanceSat
      }

      // 0 is valid
      if (totalBalanceSat === null) {
        $log.warn('Abandoning call to get fiat balance, because no valid wallet status (cached or otherwise).');
        return;
      }

      txFormatService.formatAlternativeStr(walletCoin, totalBalanceSat, function onFormatAlernativeStr(formatted) {
        if (formatted) {
          setDisplay(formatted, '');
        } else {
          $log.error('Failed to format fiat balance of wallet.');
        }
      });
    }

    function setDisplay(amount, cachedBalanceUpdatedOn) {
      $scope.displayAmount = amount;
      $scope.cachedBalanceUpdatedOn = cachedBalanceUpdatedOn;
    }
  }
})();

