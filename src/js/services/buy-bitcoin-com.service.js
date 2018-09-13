'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('buyBitcoinComService', buyBitcoinComService);

  function buyBitcoinComService($http, $log, $window, $filter, platformInfo, storageService, buyAndSellService, gettextCatalog) {
    var service = {};

    service.register = function() {
      buyAndSellService.register({
        name: 'buydotbitcoindotcom',
        logo: 'img/bitcoin-com-logo-grey.png',
        location: gettextCatalog.getString('Buy Bitcoin With Credit Card'),
        sref: 'tabs.buyandsell.bitcoindotcom'
      });
    };

    service.register();

    return service;
  }
})();
