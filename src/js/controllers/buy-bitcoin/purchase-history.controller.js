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
      
      var txsForAddress = {};
      var addresses = [];

      transactions.forEach(function onTransaction(tx){
        tx.createdTime = Date.parse(tx.createdAt);

        tx.walletAddress = "1L26JXNCL5Z2dSh5utbuMgBipNv8BTCN9r"; // For testing only - Used

        addresses.push(tx.walletAddress);
        txsForAddress[tx.walletAddress] = tx;
        
      });

      transactions.sort(function compare(a, b){
        return b.createdTime - a.createdTime;
      });

      vm.history = transactions;

      profileService.getWalletFromAddresses(addresses, 'bch', function onWallet(err, walletsForAddresses) {
        if (err) {
          $log.error('Error getting wallet from address. ' + err.message || '');
          return;
        }

        console.log('walletsForAddresses:', walletsForAddresses);

        transactions.forEach(function onTransaction(tx) {
          var wallet = walletsForAddresses[tx.walletAddress];
          if (wallet) {
            tx.walletColor = wallet.color;
            tx.walletName = wallet.name;
          }
        });

        $scope.$apply();

        

        /*
        walletsForAddresses.forEach(function onWalletAndAddress(walletForAddress) {
          var wallet = walletForAddress.wallet;
          var address = walletForAddress.address;
          var tx = txsForAddress[address];

          console.log('wallet found for ' + address + ', name:', wallet.name);
          $scope.$apply(function(){
            tx.walletColor = wallet.color;
            tx.walletName = wallet.name;
          });

        });
        */

      });
    }

  }
})();
