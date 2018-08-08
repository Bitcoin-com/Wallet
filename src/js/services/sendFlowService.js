'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowService', sendFlowService);
  
  function sendFlowService($log) {

    var service = {
      amount: '',
      fromWalletId: '',
      sendMax: false,
      thirdParty: null,
      toAddress: '',
      toWalletId: '',
      previousStates: [],

      // Functions
      clear: clear,
      map: map,
      previousState: previousState,
      startSend: startSend
    };

    return service;

    function clear() {
      $log.debug("Reinitialize Send Flow variables with clear()");
      service.amount = '';
      service.fromWalletId = '';
      service.sendMax = false;
      service.thirdParty = null;
      service.toAddress = '';
      service.toWalletId = '';
      service.previousStates = [];
    }

    /**
     * Clears all previous state
     * @param {} params 
     */
    function startSend(params) {
      console.log('startSend()');
      clear();
      Object.keys(params).forEach(function forNewParam(key) {
        service[key] = params[key];
      });
    }

    function map(params) {

      var currentState = {};
      Object.keys(service).forEach(function forCurrentParam(key) {
        if (typeof service[key] !== 'function' && key !== 'previousStates') {
          currentState[key] = service[key];
        }
      });
      service.previousStates.push(currentState);

      // Do we want to inherit the previous state here, or clear first before adding new params?

      Object.keys(params).forEach(function forNewParam(key) {
        service[key] = params[key];
      });
    };

    function previousState() {
      if (service.previousStates.length) {
        map(service.previousStates.pop());
      } else {
        clear();
      }
    };
  };

})();