'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinReceiptController', receiptController);

  function receiptController(
    bitcoinCashJsService
    , clipboardService
    , externalLinkService
    , gettextCatalog
    , $interval
    , $ionicHistory
    , ionicToast
    , $log
    , moonPayService
    , platformInfo
    , profileService
    , popupService
    , $scope
    , $state
    , $timeout
    , $window
    ) {
    var vm = this;

    // Functions
    vm.onDone = onDone;
    vm.onGoToWallet = onGoToWallet;
    vm.onMakeAnotherPurchase = onMakeAnotherPurchase;
    vm.onShareTransaction = onShareTransaction;
    vm.onViewOnBlockchain = onViewOnBlockchain;

    var txUrl = '';
    var walletId = '';
    var refreshPromise = null;

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _initVariables() {
      vm.moonpayTxId = $state.params.moonpayTxId;
      console.log('moonpayTxId:', vm.moonpayTxId);

      vm.coin = 'bch';
      vm.cryptoTransactionId = '';
      vm.haveTxInfo = false;
      
      vm.lineItems = {
        bchQty: 0,
        cost: 0,
        rateEur: 0,
        processingFee: 0,
        total: 0
      }
      vm.paymentMethod = null;
      vm.paymentMethodError = '';
      vm.paymentMethodLoading = true;
      vm.status = '';
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

    function _getWalletFromAddress(toAddress) {
      if (vm.coin == 'bch') {
        if (toAddress.indexOf('bitcoincash:') < 0) {
          toAddress = 'bitcoincash:' + toAddress;
        }
        toAddress = bitcoinCashJsService.readAddress(cashAddr).legacy;
      }

      try {
        profileService.getWalletFromAddress(toAddress, vm.coin, function onWallet(err, walletAndAddress) {
          if (err) {
            $log.error('Error getting wallet from address. ' + err.message || '');
            return;
          }

          var walletCashAddr = bitcoinCashJsService.readAddress(walletAndAddress.address).cashaddr;
          var walletCashAddrParts = walletCashAddr.split(':');
          var walletCashAddrWithoutPrefix = walletCashAddrParts.length === 2 ? walletCashAddrParts[1] : walletCashAddr;

          if (tx.walletAddress === walletCashAddrWithoutPrefix) {
            vm.wallet = walletAndAddress.wallet;
            tx.walletId = wallet.id;
            moonPayService.setTransactionWalletId(tx);
          }

          $scope.$apply();
        });
      } catch (err) { 
        $log.debug('Error converting the address to legacy.' + err.message || ''); 
      }
    }

    function _setTransaction(transaction) {

      vm.haveTxInfo = true;
      vm.coin = transaction.baseCurrencyCode
      vm.cryptoTransactionId = transaction.cryptoTransactionId;

      if (transaction.cryptoTransactionId) {
        txUrl = 'https://explorer.bitcoin.com/' + vm.coin + '/tx/' + transaction.cryptoTransactionId;
      }

      vm.createdTime = transaction.createdTime;

      vm.lineItems.bchQty = transaction.quoteCurrencyAmount;
      vm.lineItems.cost = transaction.baseCurrencyAmount;

      vm.rateEur = transaction.baseCurrencyAmount / transaction.quoteCurrencyAmount;

      vm.lineItems.processingFee = transaction.feeAmount + transaction.extraFeeAmount;
      vm.lineItems.total = vm.lineItems.processingFee + transaction.baseCurrencyAmount;

      vm.status = transaction.status;

      vm.walletAddress = transaction.walletAddress;

      if (vm.walletAddress[0] != 'q' && vm.walletAddress[0] != 'p') {
        vm.coin = 'btc'
      }
      
      if (transaction.walletId) {
        vm.wallet = profileService.getWallet(transaction.walletId);
      } else {
        _getWalletFromAddress(transaction.walletAddress);
      }

      _getPaymentMethodInfo(transaction.cardId);

      // Check if Refresh cycle is needed
      if (vm.moonpayTxId && refreshPromise === null) {
        refreshPromise = $interval(_refreshTransactionInfo, 5000);
      }
    }

    function _onBeforeEnter() {
      if ($window.StatusBar) {
        $window.StatusBar.styleDefault();
        $window.StatusBar.backgroundColorByHexString('#FBFCFF');
      }
      
      _initVariables();

      moonPayService.getTransaction(vm.moonpayTxId).then(
        function onGetTransactionSuccess(transaction) {
          console.log('Transaction:', transaction);
          
          _setTransaction(transaction);
          _handleTransactionCleanup(transaction);
        },
        function onGetTransactionError(err) {
          $log.error(err);
          
          var title = gettextCatalog('Error');
          var message = err.message || gettextCatalog('Failed to get transaction data.');
          popupService.showAlert(title, message);
        }
      );
    }

    function _onBeforeLeave() {
      if (refreshPromise !== null) {
        $interval.cancel(refreshPromise);
        refreshPromise = null;
      }
    }

    function _handleTransactionCleanup(transaction) {
      if (vm.status === 'completed') {
        vm.quoteCurrencyAmount = transaction.quoteCurrencyAmount;
      }
      if (vm.status === 'completed' || vm.status === 'failed') { // pending or waitingAuthorization
        $interval.cancel(refreshPromise);
        refreshPromise = null;
      }
    }

    function _refreshTransactionInfo() {
      moonPayService.getTransaction(vm.moonpayTxId).then(
        function onGetTransactionSuccess(transaction) {
          _setTransaction(transaction);
          _handleTransactionCleanup(transaction);
        }, function onGetTransactionError(err) {
          $log.error(err);
          // Can't do much, wait for next refresh
        }
      )
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
              $state.go('tabs.buybitcoin-amount', { 
                coin: 'bch'
              });
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
        clipboardService.copyToClipboard(txUrl);
      }
    }

    function onViewOnBlockchain() {
      externalLinkService.open(txUrl, false);
    }

  }
})();
