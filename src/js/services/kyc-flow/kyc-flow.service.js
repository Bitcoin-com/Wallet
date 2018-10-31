'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowService', kycFlowService);
  
  function kycFlowService(
    moonPayService
    , kycFlowRouterService
    , kycFlowStateService
    , $log
  ) {

    var service = {
      // Variables
      router: kycFlowRouterService,
      state: kycFlowStateService,

      // Functions
      start: start,
      nextStep: nextStep,
      previousStep: previousStep,
    };

    return service;

    function start () {
      
    }

    function nextStep () {
      
    }

    function previousStep () {
      
    }
  }
})();