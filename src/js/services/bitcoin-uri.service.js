'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitcoinUriService', bitcoinUriService);
    
  function bitcoinUriService(bitcoinCashJsService) {
    var service = {
     parse: parse 
    };

    return service;

    /*
    For parsing:
      BIP21
      BIP72

    returns: 
    {
      address: '',
      amount: '',
      coin: '',
      isValid: false,
      label: '',
      legacyAddress: '',
      message: '',
      other: {
        somethingIDontUnderstand: 'Its value'
      },
      req: {
        "req-param0": "",
        "req-param1": ""
      },
      testnet: false,
      url: ''

    }

    // Need to do testnet, and copay too

    */
   // bitcoincash:?r=https://bitpay.com/i/GLRoZMZxaWBqLqpoXexzoD
    function parse(uri) {
      var parsed = {
        isValid: false
      };

      // Identify prefix
      var trimmed = uri.trim();
      var colonSplit = /^([\w-]*):?(.*)$/.exec(trimmed);
      if (!colonSplit) {
        return parsed;
      }

      var addressAndParams = '';
      var preColonLower = colonSplit[1].toLowerCase();
      if (preColonLower === 'bitcoin') {
        parsed.coin = 'btc';
        addressAndParams = colonSplit[2];
        console.log('Is btc');

      } else if (/^(?:bitcoincash)|(?:bitcoin-cash)$/.test(preColonLower)) {
        parsed.coin = 'bch';
        addressAndParams = colonSplit[2];
        console.log('Is bch');

      } else if (colonSplit[2] === '') {
        // No colon and no coin specifier.
        addressAndParams = colonSplit[1];
        console.log('No prefix.');

      } else {
        // Something with a colon in the middle that we don't recognise
        return parsed;
      }

      // Remove erroneous leading slashes
      var leadingSlashes = /^\/*([^\/]+(?:.*))$/.exec(addressAndParams);
      if (!leadingSlashes) {
        return parsed;
      }
      addressAndParams = leadingSlashes[1];

      var questionMarkSplit = /^([^\?]*)\??([^\?]*)$/.exec(addressAndParams);
      if (!questionMarkSplit) {
        return parsed;
      }

      var address = questionMarkSplit[1];
      var params = questionMarkSplit[2];
  
      var paramsSplit = params.split('&');
      var others;
      var req;
      paramsSplit.forEach(function onParam(param){
        var valueSplit = param.split('=');
        if (valueSplit.length !== 2) {
          return parsed;
        }

        var key = valueSplit[0];
        var value = valueSplit[1];
        switch(key) {
          case 'amount':
            if (parseFloat(value)) {
              parsed.amount = value;
            } else {
              return parsed;
            }  
          break;

          case 'label':
            parsed.label = value;
          break;

          case 'message':
            parsed.message = value;
          break;

          case 'r':
            // Could use a more comprehesive regex to test URL validity, but then how would we know
            // which part of the validatiion it failed?
            if (value.startsWith('https://')) {
              parsed.url = value;
            } else {
              return parsed;
            }
          break;

          default:
            if (key.startsWith('req-')) {
              req = req || {};
              req[key] = value;
            } else {
              others = others || {};
              others[key] = value;
            }
        }

      });

      parsed.others = others;
      parsed.req = req;
        
      // Need to do bitpay format as well? Probably
      if (address) {
        // Just a rough validation to exclude half-pasted addresses, or things obviously not bitcoin addresses
        var cashAddrRe = /^((?:q|p)[a-z0-9]{41})|((?:Q|P)[A-Z0-9]{41})$/;
        var legacyRe = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
        var legacyTestnetRe = /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

        if (legacyRe.test(address)) {
          parsed.address = address;
          parsed.legacyAddress = address;
          parsed.testnet = false;

        } else if (legacyTestnetRe.test(address)) {
          parsed.address = address;
          parsed.legacyAddress = address;
          parsed.testnet = true;

        } else if (cashAddrRe.test(address)) {
          var cashAddr = 'bitcoincash:' + address.toLowerCase();
          parsed.address = cashAddr;
          parsed.coin = 'bch';

          var bchAddresses = bitcoinCashJsService.readAddress(cashAddr);
          parsed.legacyAddress = bchAddresses['legacy'];

          parsed.testnet = false;  

        } // TODO: Check for private key


        // TODO: identify different types of addresses

        // TODO: Check for a private key here too
      }

      // If has no address, must have Url.
      parsed.isValid = !!(parsed.address || parsed.url);

      return parsed;
    }

  }  

})();