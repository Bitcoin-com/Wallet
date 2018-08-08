'use strict';

angular.module('copayApp.services').factory('sendFlowService', function ($log) {
  var vm = this;

  vm.amount = false;
  vm.fromWalletId = false;
  vm.thirdParty = false;
  vm.sendMax = false;
  vm.toAddress = false;
  vm.toWalletId = false;

  vm.initialize = function() {
    $log.debug("Reinitialize Send Flow variables");
    vm.amount = false;
    vm.fromWalletId = false;
    vm.thirdParty = false;
    vm.sendMax = false;
    vm.toAddress = false;
    vm.toWalletId = false;
  };

  vm.map = function(params) {
    Object.keys(params).map(function(key, index) {
      vm[key] = params[key];
    });
    console.log(vm);
  };

  return vm;
});