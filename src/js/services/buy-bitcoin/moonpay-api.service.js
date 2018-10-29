'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonpayApiService', moonpayApiService);
  
  function moonpayApiService($http) {

    var service = {
      // Functions
      getCustomer: getCustomer
    };

    return service;

    /**
     * @param {string} customerId
     * @param {function(Error, Object)} cb 
     */
    function getCustomer(customerId, cb) {
      
    }
  };

})();