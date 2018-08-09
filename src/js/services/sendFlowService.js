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
      getState: getState,
      map: map,
      popState: popState,
      pushState: pushState,
      startSend: startSend
    };

    return service;

    function clear() {
      console.log("sendFlow clear()");
      service.amount = '';
      service.fromWalletId = '';
      service.sendMax = false;
      service.thirdParty = null;
      service.toAddress = '';
      service.toWalletId = '';
      service.previousStates = [];
    }

    /**
     * Handy for debugging
     */
    function getState() {
      var currentState = {};
      Object.keys(service).forEach(function forCurrentParam(key) {
        if (typeof service[key] !== 'function' && key !== 'previousStates') {
          currentState[key] = service[key];
        }
      });
      return currentState;
    }

    /**
     * Clears all previous state
     */
    function startSend(params) {
      console.log('startSend()');
      clear();
      map(params);
    }

    function map(params) {
      Object.keys(params).forEach(function forNewParam(key) {
        service[key] = params[key];
      });
    };

    function popState() {
      console.log('sendFlow pop');
      if (service.previousStates.length) {
        var params = service.previousStates.pop();
        clear();
        map(params);
      } else {
        clear();
      }
    };

    function pushState(params) {
      console.log('sendFlow push');
      var currentParams = getState();
      service.previousStates.push(currentParams);
      clear();
      map(params);
    };
  };

})();