'use strict';

// For the amount-master view that shows the UI for different configurations.
// It is a useful reference for creating the other screens.

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountMasterController', amountController);

  function amountController($scope) {
    var vm = this;

    vm.focussedEl = false;

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.lineItems = {
        cost: '$125.00',
        processingFee: '$10.00',
        total: '$135.00'
      };
    }

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();
    }

  }
})();
