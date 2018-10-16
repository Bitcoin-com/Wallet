'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWelcomeController', buyBitcoinWelcomeController);

  function buyBitcoinWelcomeController(kycFlowService) {
    var vm = this;

    vm.goBack = goBack;

    function goBack() {
      kycFlowService.goBack();
    }
  }


})();
