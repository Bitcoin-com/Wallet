'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('kycGetVerifiedController', kycGetVerifiedController);

  function kycGetVerifiedController(kycFlowService) {
    console.log('kycGetVerifiedController');
    var vm = this;

    vm.goBack = goBack;

    function goBack() {
      kycFlowService.router.goBack();
    }
  }


})();
