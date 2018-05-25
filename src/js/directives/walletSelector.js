'use strict';

angular.module('copayApp.directives')
  .directive('walletSelector', function($rootScope, $timeout, configService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/walletSelector.html',
      transclude: true,
      scope: {
        title: '=walletSelectorTitle',
        show: '=walletSelectorShow',
        wallets: '=walletSelectorWallets',
        selectedWallet: '=walletSelectorSelectedWallet',
        onSelect: '=walletSelectorOnSelect',
        displayBalanceAsFiat : '=walletSelectorDisplayBalanceAsFiat'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
        scope.selectWallet = function(wallet) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(wallet);
        };
        scope.$watch('wallets', function(newValue, oldValue) {
          scope.wallets = newValue;
        });
      }
    };
  });
