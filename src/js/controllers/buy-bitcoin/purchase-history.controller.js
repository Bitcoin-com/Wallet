'use strict';


(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinPurchaseHistoryController', purchaseHistoryController);

  function purchaseHistoryController($scope) {
    var vm = this;

    vm.history = [];

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.history = [];
      moonPayService.getTransactions().then(
        function onGetTransactionsSuccess(transactions) {
          vm.history = transactions;
        }
      );
    }

    function _onBeforeEnter() {
      _initVariables();
    }

  }
})();
