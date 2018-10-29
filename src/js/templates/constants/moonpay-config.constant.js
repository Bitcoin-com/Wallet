'use strict';

/*
Template is at:
  src/js/templates/constants

Requires a file above the project root: moonpay-config.json, containing:
  {
    "dev": {
      "baseUrl": "YOUR_DEV_BASE_URL",
      "apiKey": "YOUR_PROD_API_KEY"
    },
    "prod": {
      "baseUrl": "YOUR_PROD_BASE_URL",
      "apiKey": "YOUR_PROD_API_KEY"
    }
  }
*/

(function(){

  angular
    .module('bitcoincom.services')
    .constant('moonPayConfig', {
      baseUrl: '',
      apiKey: ''
    });
    
})();