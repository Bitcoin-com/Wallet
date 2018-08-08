'use strict';

angular.module('copayApp.services').factory('sendFlowService', function ($log) {
  var vm = this;

  vm.amount = false;

  vm.fromWalletId = false;
  vm.previousStates = [];
  vm.thirdParty = false;
  vm.sendMax = false;
  vm.toAddress = false;
  vm.toWalletId = false;

  vm.clear = function() {
    $log.debug("Reinitialize Send Flow variables");
    vm.amount = false;
    vm.fromWalletId = false;
    vm.thirdParty = false;
    vm.sendMax = false;
    vm.toAddress = false;
    vm.toWalletId = false;
    vm.previousStates = [];
  };

  vm.map = function(params) {

    var tempState = {};
    Object.keys(vm).map(function(key, index) {
      if (typeof vm[key] !== 'function' && key !== 'previousStates') {
        tempState[key] = vm[key];
      }
    });
    vm.previousStates.push(tempState);

    Object.keys(params).map(function(key, index) {
      vm[key] = params[key];
    });
  };

  vm.previousState = function() {
    if (vm.previousStates.length) {
      vm.map(vm.previousStates.pop());
    }
  };

  return vm;
});