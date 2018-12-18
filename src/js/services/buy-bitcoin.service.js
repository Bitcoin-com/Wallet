'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('buyBitcoinService', buyBitcoinService);

  function buyBitcoinService(servicesService) {
    var service = {};

    register();
    return service;

    function register() {
      servicesService.register({
        name: 'buybitcoin',
        title: 'Buy Bitcoin',
        icon: 'icon-buy-bitcoin2',
        sref: 'tabs.buybitcoin'
      });
    };
  }
})();
