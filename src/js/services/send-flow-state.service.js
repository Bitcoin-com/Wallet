'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowStateService', sendFlowStateService);
  
  function sendFlowStateService() {

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
      init: init,
      clear: clear,
      getClone: getClone,
      map: map,
      pop: pop,
      push: push,
    };

    return service;

    function init(params) {
      clear();
      map(params);
    }

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
    function getClone() {
      var currentState = {};
      Object.keys(service.state).forEach(function forCurrentParam(key) {
        if (typeof service.state[key] !== 'function' && key !== 'previousStates') {
          currentState[key] = service.state[key];
        }
      });
      return currentState;
    }

    function map(params) {
      Object.keys(params).forEach(function forNewParam(key) {
        service.state[key] = params[key];
      });
    };

    function pop() {
      console.log('sendFlow pop');
      if (service.previousStates.length) {
        var params = service.previousStates.pop();
        clearCurrent();
        map(params);
      } else {
        clear();
      }
    };

    function push(params) {
      console.log('sendFlow push');
      var currentParams = getClone();
      service.previousStates.push(currentParams);
      clearCurrent();
      map(params);
    };
  };

})();