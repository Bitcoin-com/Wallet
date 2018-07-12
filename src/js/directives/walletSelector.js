'use strict';

angular.module('copayApp.directives')
  .directive('walletSelector', function($rootScope, $timeout, configService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/walletSelector.html',
      transclude: true,
      scope: {
        title: '=walletSelectorTitle',
        forceTitle: '=walletSelectorForceTitle',
        show: '=walletSelectorShow',
        wallets: '=walletSelectorWallets',
        selectedWallet: '=walletSelectorSelectedWallet',
        onSelect: '=walletSelectorOnSelect',
        onHide: '=walletSelectorOnHide',
        displayBalanceAsFiat : '=walletSelectorDisplayBalanceAsFiat'
      },
      link: function(scope, element, attrs) {
        console.log(scope, element, attrs);
        scope.hide = function() {
          scope.show = false;
          if (typeof scope.onHide === "function") {
            scope.onHide()
          }
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
