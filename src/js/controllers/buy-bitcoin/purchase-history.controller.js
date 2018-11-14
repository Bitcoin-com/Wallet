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
    , $scope, $ionicHistory
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
      console.log('transaction: ', transactions[0]);
      
      var addresses = [];

      transactions.forEach(function onTransaction(tx){
        tx.createdTime = Date.parse(tx.createdAt);

        //tx.walletAddress = "1L26JXNCL5Z2dSh5utbuMgBipNv8BTCN9r"; // For testing only - Used

        addresses.push(tx.walletAddress);
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

        transactions.forEach(function onTransaction(tx) {
          if (tx.walletAddress === walletAndAddress.address) {
            var wallet = walletAndAddress.wallet;
            tx.walletColor = wallet.color;
            tx.walletName = wallet.name;
          }
        });

        $scope.$apply();

      });
    }

  }
})();
