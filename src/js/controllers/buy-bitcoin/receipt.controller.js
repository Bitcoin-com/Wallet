'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinReceiptController', receiptController);

  function receiptController(
    bitcoinCashJsService
    , externalLinkService
    , $ionicHistory
    , ionicToast
    , $log
    , moonPayService
    , platformInfo
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
    vm.onShareTransaction = onShareTransaction;
    vm.onViewOnBlockchain = onViewOnBlockchain;

    var moonpayTxId = '';
    var txUrl = '';
    var walletId = '';
    

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      moonpayTxId = $state.params.moonpayTxId;
      console.log('moonpayTxId:', moonpayTxId);

      vm.cryptoTransactionId = '';
      vm.haveTxInfo = false;
      
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
      vm.status = 'pending';
      vm.wallet = null;
      vm.walletAddress = '';

      txUrl = '';
      walletId = '';

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

          vm.cryptoTransactionId = transaction.cryptoTransactionId;
          if (transaction.cryptoTransactionId) {
            txUrl = 'https://explorer.bitcoin.com/bch/tx/' + transaction.cryptoTransactionId;
          }

          vm.createdTime = transaction.createdTime;

          vm.lineItems.bchQty = transaction.quoteCurrencyAmount;
          vm.lineItems.cost = transaction.baseCurrencyAmount;

          vm.rateUsd = transaction.baseCurrencyAmount / transaction.quoteCurrencyAmount;

          vm.lineItems.processingFee = transaction.feeAmount + transaction.extraFeeAmount;
          vm.lineItems.total = vm.lineItems.processingFee + transaction.baseCurrencyAmount;

          vm.status = transaction.status;

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

    function onShareTransaction() {
      if (platformInfo.isCordova) {
        var text = gettextCatalog.getString('Take a look at this Bitcoin Cash transaction here: ') + txUrl;
        window.plugins.socialsharing.share(text, null, null, null);
      } else {
        ionicToast.show(gettextCatalog.getString('Copied to clipboard'), 'bottom', false, 3000);
        clipboardService.copyToClipboard(explorerTxUrl);
      }
    }

    function onViewOnBlockchain() {
      externalLinkService.open(txUrl, false);
    }

  }
})();
