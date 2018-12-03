'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('kycNewCustomerController', kycNewCustomerController);

  function kycNewCustomerController() {
    var vm = this;

    vm.goBack = goBack;

    function goBack() {
      
    }
  }


})();
