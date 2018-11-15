'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinReceiptController', receiptController);

  function receiptController(
    bitcoinCashJsService
    , $ionicHistory
    , $log
    , moonPayService
    , profileService
    , popupService
    , $scope
    , $state
    ) {
    var vm = this;

    // Functions
    vm.onDone = onDone;
    vm.onGoToWallet = onGoToWallet;
    vm.onMakeAnotherPurchase = onMakeAnotherPurchase;

    var moonpayTxId = '';
    var walletId = '';
    

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      moonpayTxId = $state.params.moonpayTxId;
      console.log('moonpayTxId:', moonpayTxId);

      vm.haveTxInfo = false;
      // Change this to crypto later when the transaction is complete
      vm.lineItems = {
        bchQty: 0,
        cost: 0,
        rateUsd: 0,
        processingFee: 0,
        total: 0
      }
      vm.paymentMethod = null;
      vm.paymentMethodError = '';
      vm.paymentMethodLoading = true;
      vm.wallet = null;
      vm.walletAddress = '';

    }

    function _getPaymentMethodInfo(cardId) {
      vm.paymentMethodLoading = true;
      moonPayService.getCards().then(
        function onGetCardsSuccess(cards) {
          vm.paymentMethodLoading = false;
          if (cards && cards.length > 0) {
            
            var cardWasFound = false;
            for (var i = 0; i < cards.length; ++i) {
              if (cards[i].id === cardId) {
                cardWasFound = true;
                vm.paymentMethod = cards[i];
                break;
              }
            }
            if (!cardWasFound) {
              vm.paymentMethodError = gettextCatalog.getString('Not found.');
            }
            
          }  
        },
        function onGetCardsError(err) {
          vm.paymentMethodLoading = false;
          vm.paymentMethodError = err.message || gettextCatalog.getString('Failed to get payment method info.');
        }
      );
      
    }

    function _getWalletForAddress(cashAddr) {
      if (cashAddr.indexOf('bitcoincash:') < 0) {
        cashAddr = 'bitcoincash:' + cashAddr;
      }

      var legacyAddress = bitcoinCashJsService.readAddress(cashAddr).legacy;

      profileService.getWalletFromAddresses([legacyAddress], 'bch', function onWallet(err, walletAndAddress) {
        if (err) {
          $log.error('Error getting wallet from address. ' + err.message || '');
          return;
        }

        vm.wallet = walletAndAddress.wallet;

        $scope.$apply();
      });
    }

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();

      moonPayService.getTransaction(moonpayTxId).then(
        function onGetTransactionSuccess(transaction) {
          console.log('Transaction:', transaction);
          
          vm.haveTxInfo = true;

          vm.lineItems.bchQty = transaction.quoteCurrencyAmount;
          vm.lineItems.cost = transaction.baseCurrencyAmount;

          vm.rateUsd = transaction.baseCurrencyAmount / transaction.quoteCurrencyAmount;

          vm.lineItems.processingFee = transaction.feeAmount + transaction.extraFeeAmount;
          vm.lineItems.total = vm.lineItems.processingFee + transaction.baseCurrencyAmount;

          vm.walletAddress = transaction.walletAddress;

          _getWalletForAddress(transaction.walletAddress);
          _getPaymentMethodInfo(transaction.cardId);
        },
        function onGetTransactionError(err) {
          $log.error(err);
          
          var title = gettextCatalog('Error');
          var message = err.message || gettextCatalog('Failed to get transaction data.');
          popupService.showAlert(title, message);
        }
      );

      
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
