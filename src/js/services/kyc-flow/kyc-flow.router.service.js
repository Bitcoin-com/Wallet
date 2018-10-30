'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowRouterService', kycFlowRouterService);
  
  function kycFlowRouterService(
    kycFlowStateService
    , $state, $log
  ) {

    var service = {
      // Functions
      start: start,
      goNext: goNext,
      goPrev: goPrev,
    };

    return service;

    function start () {
      
    }

    function goNext () {
      
    }

    function goPrev () {
      
    }
  }
})();