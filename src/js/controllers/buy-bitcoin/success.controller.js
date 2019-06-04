'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinSuccessController', successController);

  function successController(
    bitAnalyticsService
    , $interval
    , $ionicHistory
    , $log
    , moonPayService
    , profileService
    , $scope
    , $state
    ) {
    var vm = this;

    // Functions
    vm.onDone = onDone;
    vm.onGoToWallet = onGoToWallet;
    vm.onMakeAnotherPurchase = onMakeAnotherPurchase;
    vm.onSeeReceipt = onSeeReceipt;

    var purchasedAmount = 0;
    var refreshPromise = null;
    var walletId = '';

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);
    
    function _initVariables() {
      purchasedAmount = $state.params.purchasedAmount;

      vm.coin = 'bch';
      vm.failureReason = '';
      vm.moonpayTxId = $state.params.moonpayTxId;
      vm.purchasedAmount = purchasedAmount;
      vm.purchasedCurrency = 'EUR';
      vm.quoteCurrencyAmount = '';
      vm.walletName = '';
      vm.status = 'pending';
      console.log('vm.moonpayTxId:', vm.moonpayTxId, purchasedAmount);
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

      bitAnalyticsService.postEvent('buy_bitcoin_purchase_success_screen_shown', [{}, {}, {}], ['leanplum']);

      if (vm.moonpayTxId) {
        _refreshTransactionInfo();
      }
    }

    function _onBeforeLeave() {
      bitAnalyticsService.postEvent('buy_bitcoin_purchase_success_screen_close', [{}, {}, {}], ['leanplum']);
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

    function _onBeforeLeave() {
      console.log('_onBeforeLeave()');
      if (refreshPromise !== null) {
        $interval.cancel(refreshPromise);
        refreshPromise = null;
      }
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
              $state.go('tabs.buybitcoin-amount', { 
                coin: vm.coin
              });
            }
          );
        }
      );
    }

    function onSeeReceipt() {
      $state.go('tabs.buybitcoin-receipt', { 
        moonpayTxId: vm.moonpayTxId
      });
    }

    function _refreshTransactionInfo() {
      
      moonPayService.getTransaction(vm.moonpayTxId).then(
        function onGetTransactionSuccess(transaction) {
          vm.purchasedAmount = transaction.baseCurrencyAmount;
          vm.status = transaction.status;
          vm.failureReason = transaction.failureReason;

          if (vm.walletAddress[0] != 'q' && vm.walletAddress[0] != 'p') {
            vm.coin = 'btc'
          }

          console.log('_refreshTransactionInfo() ' + transaction.status);
          if (vm.status === 'completed') {
            vm.quoteCurrencyAmount = transaction.quoteCurrencyAmount;
          }

          if (refreshPromise === null &&
            (vm.status === 'pending' || vm.status === 'waitingAuthorization')
          ) {
            refreshPromise = $interval(_refreshTransactionInfo, 5000);
          }
          else { // completed, failed, waitingAuthorization
            $interval.cancel(refreshPromise);
            refreshPromise = null;
          }
          
        }, function onGetTransactionError(err) {
          $log.error(err);
          // Can't do much, wait for next refresh
        }
      )
    }

  }
})();
