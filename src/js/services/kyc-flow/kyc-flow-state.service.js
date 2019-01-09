'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowStateService', kycFlowStateService);
  
  function kycFlowStateService(lodash, $log) {

    var defaultState = {
      identity: null
      , result: ''
      , isRecovery: false
      , recoverySuccess: false
      , documentReviewing: false
      , countryCode: ''
      , documentType: ''
      , firstName: ''
      , lastName: ''
      , dob: ''
      , streetAddress1: ''
      , streetAddress2: ''
      , postalCode: ''
      , city: ''
      , country: ''
      , inPreview: false
      , documents: []
      , documentsMeta: {}
    }

    var service = {
      // Functions
      init: init
      , clear: clear
      , getClone: getClone
      , pop: pop
      , push: push
      , isEmpty: isEmpty
      , 
    };

    var state = defaultState;
    var states = [];

    return service;

    
    /**
     * Init state & stack
     * @param {Object} params 
     */
    function init(params) {
      $log.debug("kyc-flow-state init()");

      clear();

      var newState = defaultState;

      if (params) {
        for(var attributeName in params) {
          newState[attributeName] = params[attributeName];
        }
      }
      push(newState);
    }

    /**
     * Clear a state & stack
     */
    function clear() {
      $log.debug("kyc-flow-state clear()");

      states = [];
    }

     /**
     * Fill in the current state from the params
     * @param {Object} params 
     */
    function map(params) {
      Object.keys(params).forEach(function forNewParam(key) {
        state[key] = params[key];
      });
    }

    /**
     * Get a clone of the current state
     */
    function getClone() {
      var newState = {};
      var currentState = state;

      Object.keys(currentState).forEach(function forCurrentParam(key) {
        if (typeof currentState[key] !== 'function' && key !== 'previousStates') {
          newState[key] = currentState[key];
        }
      });
      return newState;
    }

    /**
     * Pop state
     */
    function pop() {
      $log.debug('kyc-flow-state pop');
      map(states.pop());
      if (states.length === 0) {
        console.log("Popped with a length of 0!")
        states.push(defaultState);
      }
    }

    /**
     * Push state
     * @param {Object} params 
     */
    function push(params) {
      $log.debug('kyc-flow-state push');
      map(params);
      states.push(state);
    }

    /**
     * Is empty stack
     */
    function isEmpty() {
      return states.length === 0;
    }
  };

})();