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
    href: 'https://cashgames.bitcoin.com/?utm_source=WalletApp&utm_medium=iOS&utm_campaign=CashGames'
  };

  var newsItem = {
    name: 'news',
    title: 'News',
    icon: 'icon-news',
    href: 'https://news.bitcoin.com/?utm_source=WalletApp&utm_medium=iOS&utm_campaign=News'
  };

  var poolItem = {
    name: 'pool',
    title: 'Mining Pool',
    icon: 'icon-mining',
    href: 'https://pool.bitcoin.com/?utm_source=WalletApp&utm_medium=iOS&utm_campaign=Pool'
  };

  var toolsItem = {
    name: 'tools',
    title: 'Tools',
    icon: 'icon-tools',
    href: 'https://tools.bitcoin.com/?utm_source=WalletApp&utm_medium=iOS&utm_campaign=Tools'
  };

  var priceChartItem = {
    name: 'pricechart',
    title: 'Bitcoin Price Charts',
    icon: 'icon-chart',
    sref: 'tabs.pricechart',
  };

  var faucetItem = {
    name: 'faucet',
    title: 'Free Bitcoin Cash',
    icon: 'icon-faucet',
    href: 'https://free.bitcoin.com/?utm_source=WalletApp&utm_medium=iOS&utm_campaign=Faucet'
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
    nextStepsService.register(priceChartItem);
    nextStepsService.register(faucetItem);
  };

  register();
  return root;
});
