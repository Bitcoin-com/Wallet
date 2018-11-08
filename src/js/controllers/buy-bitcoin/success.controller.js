'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinSuccessController', successController);

  function successController(
    $ionicHistory
    , $log
    , moonPayService
    , profileService
    , $scope
    , $state
    ) {
    var vm = this;
    vm.onDone = onDone;
    vm.onGoToWallet = onGoToWallet;
    vm.onMakeAnotherPurchase = onMakeAnotherPurchase;

    var walletId = '';

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.purchasedAmount = 0.15384976;
      vm.purchasedCurrency = 'bch';
      vm.walletName = '';
    }

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();

      moonPayService.getDefaultWalletId().then(
        function onGetDefaultWalletIdSuccess(id) {
          if (id) {
            walletId = id;
            var wallet = profileService.getWallet(walletId);
            vm.walletName = wallet.name;

          } else {
            $log.error('Success screen: Default wallet ID not found.');
            // Can't do much, leave in unknown wallet state
          }

        },
        function onGetDefaultWalletIdError(err) {
          $log.error(err);
          // Can't do much, leave in unknown wallet state
        }
      );

      console.log('moonpay tx id: ',  $state.params.moonpayTxId);
    }

    function onDone() {
      $ionicHistory.nextViewOptions({
        disableAnimation: true,
        historyRoot: true
      });
      $state.go('tabs.home').then(
        function () {
          $state.go('tabs.buybitcoin');
        }
      );
    }

    function onGoToWallet() {
      $ionicHistory.nextViewOptions({
        disableAnimation: true,
        historyRoot: true
      });
      $state.go('tabs.home').then(
        function() {
          $state.go('tabs.wallet', { walletId: walletId });
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
