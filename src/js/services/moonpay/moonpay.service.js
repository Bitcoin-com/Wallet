'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayService', moonPayService);
  
  function moonPayService(
    moonPayApiService
    , storageService
    , $log
  ) {

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      getCustomerId: getCustomerId,
      updateCustomer: updateCustomer
    };

    return service;

    function createCustomer () {
      
    }

    function getCustomer () {
      
    }

    function getCustomerId () {
      
    }

    function updateCustomer () {
      
    }
  }
})();