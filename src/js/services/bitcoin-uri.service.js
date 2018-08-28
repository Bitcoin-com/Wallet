'use strict';

// https://en.bitcoin.it/wiki/BIP_0072

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitcoinUriService', bitcoinUriService);
    
  function bitcoinUriService(bitcoinCashJsService, bwcService, $log) {
    var bch = bitcoinCashJsService.getBitcoinCashJs();
    var bitcore = bwcService.getBitcore();
    var cashAddrRe = /^((?:q|p)[a-z0-9]{41})|((?:Q|P)[A-Z0-9]{41})$/;

    var service = {
     parse: parse 
    };

    return service;

    function generateTestData() {
      var privateKey = new bch.PrivateKey('testnet');
      var address1 = privateKey.toAddress();
      console.log('legacy pub:', address1.toString());
      //var addrss = bitcoinCashJsService.readAddress(address1);
      //console.log('generated:', addrss.cashaddr);
      //bch.Address.fromString(address1, 'testnet');
      console.log('generated:', address1.toString('cashaddr'));
     
    }
    

    function isValidCashAddr(address, network) {
      

      var isValid = false;

      var prefix = network === 'testnet' ? 'bchtest:' : 'bitcoincash:';

      try {
        if (cashAddrRe.test(address)) {
          // bitcoinCashJs.Address.isValid() assumes legacy address for string data, so does not work with cashaddr.
          var bchAddresses = bitcoinCashJsService.readAddress(address.toLowerCase());
          if (bchAddresses) {
            var legacyAddress = bchAddresses.legacy;
            if (bch.Address.isValid(legacyAddress, network)) {
              isValid = true;
            }
          }
        }
      } catch (e) {
        // Nop - Must not be a valid cashAddr.
        $log.error('Error validating address.', e);
      }
      console.log(address,'isValidCashAddr:', isValid);
      return isValid;
    }
    

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
        parsed.test = false;
        addressAndParams = colonSplit[2];
        console.log('Is bch');

      } else if (/^(?:bchtest)$/.test(preColonLower)) {
        parsed.coin = 'bch';
        parsed.testnet = true;
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
            // which part of the validation it failed?
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
        var addressLowerCase = address.toLowerCase();
        var bch = bitcoinCashJsService.getBitcoinCashJs();
        // Just a rough validation to exclude half-pasted addresses, or things obviously not bitcoin addresses
        var cashAddrRe = /^((?:q|p)[a-z0-9]{41})|((?:Q|P)[A-Z0-9]{41})$/;
        
        //var legacyRe = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
        //var legacyTestnetRe = /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

        if (bitcore.Address.isValid(address, 'livenet')) {
          parsed.address = address;
          parsed.legacyAddress = address;
          parsed.testnet = false;

        } else if (bitcore.Address.isValid(address, 'testnet')) {
          parsed.address = address;
          parsed.legacyAddress = address;
          parsed.testnet = true;

          // bitcoinCaashJs.Address.isValid() assumes legacy address for string data, so does not work with cashaddr.
       // } else if (isValidCashAddr(addressLowerCase, 'livenet')) {
        } else if (cashAddrRe.test(address) && parsed.testnet) {
          var cashAddr = 'bchtest:' + addressLowerCase;
          parsed.address = cashAddr;
          parsed.coin = 'bch';
          // TODO: Get legacy address

          
        } else if (cashAddrRe.test(address)) {
          var cashAddr = 'bitcoincash:' + addressLowerCase;
          parsed.address = cashAddr;
          parsed.coin = 'bch';

          var bchAddresses = bitcoinCashJsService.readAddress(cashAddr);
          parsed.legacyAddress = bchAddresses['legacy'];

          parsed.testnet = false;  

        } 
          
      }



        // TODO: Check for a private key here too
      

      // If has no address, must have Url.
      parsed.isValid = !!(parsed.address || parsed.url);

      return parsed;
    }

  }  

})();