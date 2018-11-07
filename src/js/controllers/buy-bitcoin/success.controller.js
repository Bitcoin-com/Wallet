'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinSuccessController', successController);

  function successController(
    $ionicHistory,
    $scope,
    $state,
    ) {
    var vm = this;
    vm.onDone = onDone;
    vm.onMakeAnotherPurchase = onMakeAnotherPurchase;

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.purchasedAmount = 0.15384976;
      vm.purchasedCurrency = 'bch';
      vm.walletName = 'Business Wallet';
    }

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();
    }

    function onDone() {
      $ionicHistory.nextViewOptions({
        disableAnimation: true,
        historyRoot: true
      });
      $state.go('tabs.home').then(
        function() {
          $state.go('tabs.buybitcoin');
        }
      );
    }

    function onMakeAnotherPurchase() {
      $ionicHistory.nextViewOptions({
        disableAnimation: true,
        historyRoot: true
      });
      $state.go('tabs.home').then(
        function() {
          $state.go('tabs.buybitcoin').then(
            function () {
              $state.go('tabs.buybitcoin-amount');
            }
          );
        }
      );
    }

  }
})();
