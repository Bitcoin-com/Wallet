'use strict';

/*
Template is at:
  src/js/templates/constants

Requires a file above the project root: leanplum-config.json, containing:
  {
    "dev": {
      "appId": "YOUR_DEV_APP_ID",
      "key": "YOUR_DEV_KEY"
    },
    "prod": {
      "appId": "YOUR_PROD_APP_ID",
      "key": "YOUR_PROD_KEY"
    }
  }
*/

(function(){

  angular
    .module('bitcoincom.services')
    .constant('leanplumConfig', {
      appId: '',
      key: ''
    });
    
})();