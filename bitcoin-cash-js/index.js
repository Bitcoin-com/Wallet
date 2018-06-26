var bitcoinCashJsModule = angular.module('bitcoinCashJsModule', []);
var bchjs = require('../node_modules/bitcoincashjs-fork');

bitcoinCashJsModule.constant('MODULE_VERSION', '1.0.0');

bitcoinCashJsModule.provider('bitcoinCashJsService', function() {
  var provider = {};

  provider.$get = function() {
    var service = {};
    const Address = bchjs.Address;
    const BitpayFormat = Address.BitpayFormat;
    const CashAddrFormat = Address.CashAddrFormat;

    service.translateAddresses = function(address) {
      var result = new Address(address);
      return {
        'legacy': result.toString(),
        'bitpay': result.toString(BitpayFormat),
        'cashaddr': result.toString(CashAddrFormat).replace('bitcoincash:', '')
      };
    }

    service.readAddress = function(address) {
      var a = address.replace('bitcoincash:', '');
      var result = {};
      if (a[0] == '1') {
        result = Address.fromString(a, 'livenet', 'pubkeyhash');
      } else if (a[0] == '3') {
        result = Address.fromString(a, 'livenet', 'scripthash');
      } else if (a[0] == 'C') {
        result = Address.fromString(a, 'livenet', 'pubkeyhash', BitpayFormat);
      } else if (a[0] == 'H') {
        result = Address.fromString(a, 'livenet', 'scripthash', BitpayFormat);
      } else if (a[0] == 'q') {
        result = Address.fromString(address, 'livenet', 'pubkeyhash', CashAddrFormat);
      } else if (a[0] == 'p') {
        result = Address.fromString(address, 'livenet', 'scripthash', CashAddrFormat);
      } else {
        return null;
      }

      return {
        'legacy': result.toString(),
        'bitpay': result.toString(BitpayFormat),
        'cashaddr': result.toString(CashAddrFormat).replace('bitcoincash:', '')
      }
    }

    service.getBitcoinCashJs = function() {
      return bchjs;
    }

    return service;
  }

  return provider;
});
