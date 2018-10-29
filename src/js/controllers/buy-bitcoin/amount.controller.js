'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountController', amountController);

  function amountController($scope) {
    var vm = this;

    vm.focussedEl = false;

    var controller = {
      // Functions
    };
    return controller;
  }
})();
