'use strict';


(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinPurchaseHistoryController', purchaseHistoryController);

  function purchaseHistoryController(
    moonPayService
    , popupService
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
      /*
      transactions.sort(function compare(a, b){

      });
      */
      transactions.forEach(function onTransaction(tx){
        tx.createdTime = Date.parse(tx.createdAt);

      });

      

      vm.history = transactions;
    }

  }
})();
