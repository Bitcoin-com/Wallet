var bitcoinCashJsModule = angular.module('bitcoinCashJsModule', []);
var bchjs = require('../node_modules/bitcoincashjs');

bitcoinCashJsModule.constant('MODULE_VERSION', '1.0.0');

bitcoinCashJsModule.provider('bitcoinCashJsService', function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.translateAddresses = function(address) {
      const Address = bchjs.Address;
      const BitpayFormat = Address.BitpayFormat;
      const CashAddrFormat = Address.CashAddrFormat;
      var result = new Address(address);
      return {
        'legacy': result.toString(),
        'bitpay': result.toString(BitpayFormat),
        'cashaddr': result.toString(CashAddrFormat)
      };
    }

    return service;
  }

  return provider;
});
