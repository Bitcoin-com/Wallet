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
      vm.history.push({
        walletName: 'sdfd',
        subtitle: 'subdfd'
      });
      vm.history.push({
        walletName: 'sdfd2',
        subtitle: 'subdfd2'
      });
    }

    function _onBeforeEnter() {
      _initVariables();
    }

  }
})();
