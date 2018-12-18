'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('buyBitcoinComService', buyBitcoinComService);

  function buyBitcoinComService(buyAndSellService, gettextCatalog) {
    var service = {};

    register();
    return service;

    function register() {
      buyAndSellService.register({
        name: 'buydotbitcoindotcom',
        logo: 'img/bitcoin-com-logo-grey.png',
        location: gettextCatalog.getString('Buy Bitcoin With Credit Card'),
        sref: 'tabs.buyandsell.bitcoindotcom'
      });
    };
  }
})();
