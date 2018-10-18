'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('kycNewCustomerController', kycNewCustomerController);

  function kycNewCustomerController(kycFlowService) {
    var vm = this;

    vm.goBack = goBack;

    function goBack() {
      kycFlowService.goBack();
    }
  }


})();
