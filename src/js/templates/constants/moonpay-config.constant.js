'use strict';

/*
Template is at:
  src/js/templates/constants

Requires a file above the project root: moonpay-config.json, containing:
  {
    "dev": {
      "baseUrl": "YOUR_DEV_BASE_URL",
      "pubKey": "YOUR_DEV_API_KEY",
      "secretKey": "YOUR_DEV_API_KEY"
      "vgsIdentifier": "YOUR_VGS_DEV_IDENTIFIER"
    },
    "prod": {
      "baseUrl": "YOUR_PROD_BASE_URL",
      "pubKey": "YOUR_PROD_API_KEY",
      "secretKey": "YOUR_PROD_API_KEY",
      "vgsIdentifier": "YOUR_VGS_PROD_IDENTIFIER"
    }
  }
*/

(function(){

  angular
    .module('bitcoincom.services')
    .constant('moonPayConfig', {
      baseUrl: '',
      env: '',
      pubKey: '',
      secretKey: '',
      vgsIdentifier: '',
    });
    
})();