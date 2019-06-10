'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('sendFlowStateService', sendFlowStateService);
  
  function sendFlowStateService($log) {

    var service = {
      // Variables
      state: {
        amount: 0,
        displayAddress: null,
        fromWalletId: '',
        sendMax: false,
        thirdParty: null,
        outs: [],
        toAddress: '',
        toWalletId: '',
        coin: '',
        isRequestAmount: false,
        isWalletTransfer: false
      },
      previousStates: [],

      // Functions
      init: init,
      clear: clear,
      getClone: getClone,
      map: map,
      pop: pop,
      push: push,
      isEmpty: isEmpty
    };

    return service;

    /**
     * Init state & stack
     * @param {Object} params 
     */
    function init(params) {
      $log.debug("send-flow-state init()");

      clear();

      if (params) {
        push(params);
      }
    }

    /**
     * Clear a state & stack
     */
    function clear() {
      $log.debug("send-flow-state clear()");

      clearCurrent();
      service.previousStates = [];
    }

    /**
     * Clear current state only
     */
    function clearCurrent() {
      $log.debug("send-flow-state clearCurrent()");

      service.state = {
        amount: 0,
        displayAddress: null,
        fromWalletId: '',
        sendMax: false,
        thirdParty: null,
        outs: [],
        toAddress: '',
        toWalletId: '',
        coin: '',
        isRequestAmount: false,
        isWalletTransfer: false
      }
    }

    /**
     * Get a clone of the current state
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

    /**
     * Fill in the current state from the params
     * @param {Object} params 
     */
    function map(params) {
      Object.keys(params).forEach(function forNewParam(key) {
        service.state[key] = params[key];
      });
    }

    /**
     * Pop state
     */
    function pop() {
      $log.debug('send-flow-state pop');

      if (service.previousStates.length) {
        var params = service.previousStates.pop();
        clearCurrent();
        map(params);
      } else {
        clear();
      }
    }

    /**
     * Push state
     * @param {Object} params 
     */
    function push(params) {
      $log.debug('send-flow-state push');

      var currentParams = getClone();
      service.previousStates.push(currentParams);
      clearCurrent();
      map(params);
    }

    /**
     * Is empty stack
     */
    function isEmpty() {
      return service.previousStates.length == 0;
    }
  };

})();