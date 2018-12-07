'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowStateService', kycFlowStateService);
  
  function kycFlowStateService(lodash, $log) {

    var service = {

      identity: null
      , result: ''
      , isRecovery: false
      , recoverySuccess: false
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
      , documents: []
      , documentsMeta: {}

      // Functions
      , init: init
      , clear: clear
      , getClone: getClone
      , pop: pop
      , push: push
      , isEmpty: isEmpty
    };

    var states = [];

    return service;

    
    /**
     * Init state & stack
     * @param {Object} params 
     */
    function init(params) {
      $log.debug("kyc-flow-state init()");

      clear();

      if (params) {
        push(params);
      }
    }

    /**
     * Clear a state & stack
     */
    function clear() {
      $log.debug("kyc-flow-state clear()");

      states = [];
    }

    /**
     * Get a clone of the current state
     */
    function getClone() {
      var statesLen = states.length;
      if (statesLen > 0) {
        var currentState = states[statesLen - 1];
        var clonedState = lodash.clone(currentState);
        return clonedState;
      } else {
        return null;
      } 
    }

    /**
     * Pop state
     */
    function pop() {
      $log.debug('kyc-flow-state pop');
      states.pop();
    }

    /**
     * Push state
     * @param {Object} params 
     */
    function push(params) {
      $log.debug('kyc-flow-state push');
      states.push(params);
    }

    /**
     * Is empty stack
     */
    function isEmpty() {
      return states.length === 0;
    }
  };

})();