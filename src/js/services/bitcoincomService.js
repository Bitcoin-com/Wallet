'use strict';
angular.module('copayApp.services').factory('bitcoincomService', function($http, $log, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  /*
   * Development: 'testnet'
   * Production: 'livenet'
   */
  credentials.NETWORK = 'livenet';
  //credentials.NETWORK = 'testnet';

  if (credentials.NETWORK == 'testnet') {
    credentials.BITPAY_API_URL = "https://test.bitpay.com";
  } else {
    credentials.BITPAY_API_URL = "https://bitpay.com";
  };

  var nextStepItem = {
    name: 'bitcoincom',
    title: 'Explore Bitcoin.com',
    icon: 'icon-bitcoincom',
    sref: 'tabs.bitcoin-com',
  };

  var _getBitPay = function(endpoint) {
    return {
      method: 'GET',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.getNetwork = function() {
    return credentials.NETWORK;
  };

  var register = function() {
        nextStepsService.register(nextStepItem);
  };

  register();
  return root;
});
