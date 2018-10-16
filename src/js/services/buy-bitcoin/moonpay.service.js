'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonpayService', moonpayService);
  
  function moonpayService(storageService) {

    var service = {
      // Functions
      getCustomerId: getCustomerId
    };

    return service;

    /**
     * 
     * @param {function(Error, string)} cb 
     */
    function getCustomerId(cb) {
      storageService.getItem('moonpayCustomerId', cb);
    }
  };

})();