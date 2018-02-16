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

  var cashGamesItem = {
    name: 'games',
    title: 'Bitcoin Cash Games',
    icon: 'icon-games',
    href: 'http://cashgames.bitcoin.com'
  };

  var newsItem = {
    name: 'news',
    title: 'News',
    icon: 'icon-news',
    href: 'http://news.bitcoin.com'
  };

  var poolItem = {
    name: 'pool',
    title: 'Mining Pool',
    icon: 'icon-mining',
    href: 'http://pool.bitcoin.com'
  };

  var toolsItem = {
    name: 'tools',
    title: 'Tools',
    icon: 'icon-tools',
    href: 'http://tools.bitcoin.com'
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
    nextStepsService.register(cashGamesItem);
    nextStepsService.register(newsItem);
    nextStepsService.register(poolItem);
    nextStepsService.register(toolsItem);
  };

  register();
  return root;
});
