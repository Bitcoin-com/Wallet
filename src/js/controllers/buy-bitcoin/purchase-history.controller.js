'use strict';


(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinPurchaseHistoryController', purchaseHistoryController);

  function purchaseHistoryController(
    bitcoinCashJsService
    , moonPayService
    , popupService
    , profileService
    , $scope
    , $timeout
    , $ionicHistory
    , $log
  ) {
    var vm = this;

    vm.history = [];
    vm.transactionsAreLoading = true;

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.history = [];
      moonPayService.getTransactions().then(
        function onGetTransactionsSuccess(transactions) {
          vm.transactionsAreLoading = false;
          _prepareTransactionsForDisplay(transactions);
        },
        function onGetTransactionsError(err) {
          var title = gettextCatalog.getString('Error Getting Transaction History');
          var message = err.message || gettextCatalog.getString('An error occurred when getting your transaction history.');
          var okText = gettextCatalog.getString('Go Back');
          popupService.showAlert(title, message, 
            function onAlertDismissed() {
              $ionicHistory.goBack();
            }, 
            okText
          );
          vm.transactionsAreLoading = false;
        }
      );
    }

    function _onBeforeEnter() {
      _initVariables();
    }

    function _prepareTransactionsForDisplay(transactions) {
      
      var addresses = [];

      transactions.forEach(function onTransaction(tx){
        tx.createdTime = Date.parse(tx.createdAt);
        var cashAddr = tx.walletAddress;
        if (cashAddr.indexOf('bitcoincash:') < 0) {
          cashAddr = 'bitcoincash:' + cashAddr;
        }

        try {
          var legacyAddress = bitcoinCashJsService.readAddress(cashAddr).legacy;
          addresses.push(legacyAddress);
        } catch (err) { 
          $log.debug('Error converting the address to legacy.' + err.message || ''); 
        }
      });

      transactions.sort(function compare(a, b){
        return b.createdTime - a.createdTime;
      });

      vm.history = transactions;

      profileService.getWalletFromAddresses(addresses, 'bch', function onWallet(err, walletAndAddress) {
        if (err) {
          $log.error('Error getting wallet from address. ' + err.message || '');
          return;
        }

        var walletCashAddr = bitcoinCashJsService.readAddress(walletAndAddress.address).cashaddr;
        var walletCashAddrParts = walletCashAddr.split(':');
        var walletCashAddrWithoutPrefix = walletCashAddrParts.length === 2 ? walletCashAddrParts[1] : walletCashAddr;

        transactions.forEach(function onTransaction(tx) {
          if (tx.walletAddress === walletCashAddrWithoutPrefix) {
            var wallet = walletAndAddress.wallet;
            tx.walletColor = wallet.color;
            tx.walletName = wallet.name;
          }
        });

        // The callback may return immediately if the address was cached.
        $timeout(function onTimeout(){
          $scope.$apply();
        }, 1);

      });
    }

  }
})();
