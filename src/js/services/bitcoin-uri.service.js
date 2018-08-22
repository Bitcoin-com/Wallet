'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitcoinUriService', bitcoinUriService);
    
  function bitcoinUriService() {
    var service = {
     parse: parse 
    };

    return service;

    /*
    For parsing:
      BIP21
      BIP72

    returns: 
    {
      address: '',
      amount: '',
      coin: '',
      isValid: false,
      label: '',
      legacyAddress: '',
      message: '',
      other: {
        somethingIDontUnderstand: 'Its value'
      },
      req: {
        "req-param0": "",
        "req-param1": ""
      },
      url: ''

    }
    */
    function parse(uri) {
      var address;
      var isValid = false;
      var legacyAddress;

      var parsed = {
        isValid: false
      };

      parsed.address = '1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW';
      parsed.isValid = true;
      parsed.legacyAddress = '1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW';

      return parsed;
    }

  }  

})();