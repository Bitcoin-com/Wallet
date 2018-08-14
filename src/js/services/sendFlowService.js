'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowService', sendFlowService);
  
  function sendFlowService($log) {

    var service = {
      // A separate state variable so we can ensure it is cleared of everything,
      // even other properties added that this service does not know about. (such as "coin")
      state: {
        amount: '',
        displayAddress: null,
        fromWalletId: '',
        sendMax: false,
        thirdParty: null,
        toAddress: '',
        toWalletId: ''
      },
      previousStates: [],

      // Functions
      clear: clear,
      getStateClone: getStateClone,
      map: map,
      popState: popState,
      pushState: pushState,
      startSend: startSend
    };

    return service;

    function clear() {
      console.log("sendFlow clear()");
      clearCurrent();
      service.previousStates = [];
    }

    function clearCurrent() {
      console.log("sendFlow clearCurrent()");
      service.state = {
        amount: '',
        displayAddress: null,
        fromWalletId: '',
        sendMax: false,
        thirdParty: null,
        toAddress: '',
        toWalletId: ''
      }
    }

    /**
     * Handy for debugging
     */
    function getStateClone() {
      var currentState = {};
      Object.keys(service.state).forEach(function forCurrentParam(key) {
        if (typeof service.state[key] !== 'function' && key !== 'previousStates') {
          currentState[key] = service.state[key];
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
        service.state[key] = params[key];
      });
    };

    function popState() {
      console.log('sendFlow pop');
      if (service.previousStates.length) {
        var params = service.previousStates.pop();
        clearCurrent();
        map(params);
      } else {
        clear();
      }
    };

    function pushState(params) {
      console.log('sendFlow push');
      var currentParams = getStateClone();
      service.previousStates.push(currentParams);
      clearCurrent();
      map(params);
    };
  };

})();