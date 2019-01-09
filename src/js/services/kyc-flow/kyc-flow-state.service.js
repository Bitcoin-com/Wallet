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

      if (params) {
        for(var attributeName in params) {
          state[attributeName] = params[attributeName];
        }
      }

      push(state);
    }

    /**
     * Clear a state & stack
     */
    function clear() {
      $log.debug("kyc-flow-state clear()");
      clearCurrent();
      states = [];
    }

    /**
     * Clear current state only
     */
    function clearCurrent() {
      $log.debug("send-flow-state clearCurrent()");
      state = {
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
      };
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
      var currentState = state;

      // Recursive function to clone Object + Array
      function recClone(oldObject, newObject) {
        Object.keys(oldObject).forEach(function forCurrentParam(key) {
          if (typeof oldObject[key] !== 'function') {
            if (Array.isArray(oldObject[key])) {
              newObject[key] = [];
              recClone(oldObject[key], newObject[key]);
            } else {
              newObject[key] = oldObject[key];
            }
          }
        });

        return newObject;
      }
      
      var newState = recClone(currentState, {});

      return newState;
    }

    /**
     * Pop state
     */
    function pop() {
      $log.debug('kyc-flow-state pop');
      console.log('Full-Stack', states);
      console.log('TRUE - lastState', states[states.length - 1]);
      var lastState = states.pop();
      console.log('lastState', lastState);
      clearCurrent();
      map(lastState);
    }

    /**
     * Push state
     * @param {Object} params 
     */
    function push(params) {
      $log.debug('kyc-flow-state push');
      states.push(state);
      clearCurrent();
      map(params);
    }

    /**
     * Is empty stack
     */
    function isEmpty() {
      return states.length === 0;
    }
  };

})();