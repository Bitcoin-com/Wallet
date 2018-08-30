'use strict';

// https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
// https://github.com/bitcoin/bips/blob/master/bip-0072.mediawiki

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitcoinUriService', bitcoinUriService);
    
  function bitcoinUriService(bitcoinCashJsService, bwcService, $log) {
    var bch = bitcoinCashJsService.getBitcoinCashJs();
    var bitcore = bwcService.getBitcore();

    var service = {
     parse: parse 
    };

    return service;
    
    function bitpayAddrOnMainnet(address) {
      var Address = bch.Address;
      var BitpayFormat = Address.BitpayFormat;

      var mainnet = bch.Networks.mainnet;

      var result = null;
      if (address[0] == 'C') {
        try {
          result = Address.fromString(address, mainnet, 'pubkeyhash', BitpayFormat);
        } catch (e) {};

      } else if (address[0] == 'H') {
        try {
          result = Address.fromString(address, mainnet, 'scripthash', BitpayFormat);
        } catch (e) {};

      }
      return result;
    }

    function cashAddrOnMainnet(address) {
      var Address = bch.Address;
      var CashAddrFormat = Address.CashAddrFormat;

      var mainnet = bch.Networks.mainnet;

      var prefixed = 'bitcoincash:' + address;
      var result = null;
      if (address[0] == 'q') {
        try {
          result = Address.fromString(prefixed, mainnet, 'pubkeyhash', CashAddrFormat);
        } catch (e) {};

      } else if (address[0] == 'p') {
        try {
          result = Address.fromString(prefixed, mainnet, 'scripthash', CashAddrFormat);
        } catch (e) {};

      }
      return result;
    }

    function cashAddrOnTestnet(address) {
      var Address = bch.Address;
      var CashAddrFormat = Address.CashAddrFormat;

      var testnet = bch.Networks.testnet;

      var prefixed = 'bchtest:' + address;
      var result = null;
      if (address[0] == 'q') {
        try {
          result = Address.fromString(prefixed, testnet, 'pubkeyhash', CashAddrFormat);
        } catch (e) {};

      } else if (address[0] == 'p') {
        try {
          result = Address.fromString(prefixed, testnet, 'scripthash', CashAddrFormat);
        } catch (e) {};

      }
      return result;
    }
    

    /*
    For parsing:
      BIP21
      BIP72

    returns: 
    {
      amount: '',
      coin: '',
      copayInvitation: '',
      isValid: false,
      label: '',
      message: '',
      other: {
        somethingIDontUnderstand: 'Its value'
      },
      privateKey: {
        encrypted: '',
        wif: ''
      }'',
      publicAddress: {
        bitpay: '',
        cashAddr: '',
        legacy: '',
      },
      req: {
        "req-param0": '',
        "req-param1": ''
      },
      testnet: false,
      url: '' // For BIP70 
    }

    Only fields that are present in the data are defined in the returned object. Both privateKey and publicAddress only have 1 field defined, if they exist at all.
    The exception to this is the coin property, which is determined from other data, such as the prefix or address type.

    */

    function parse(data) {
      var parsed = {
        isValid: false
      };

      if (typeof data !== 'string') {
        return parsed;
      }

      // Identify prefix
      var trimmed = data.trim();
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
  
      if (params.length > 0) {
        var paramsSplit = params.split('&');
        var others;
        var req;
        var paramCount = paramsSplit.length;
        for(var i = 0; i < paramCount; i++) {
          var param = paramsSplit[i];
          var valueSplit = param.split('=');
          if (valueSplit.length !== 2) {
            return parsed;
          }

          var key = valueSplit[0];
          var value = valueSplit[1];
          var decodedValue = decodeURIComponent(value);
          switch(key) {
            case 'amount':
            var amount = parseFloat(decodedValue);
              if (amount) { // Checking for NaN, or no numbers at all etc.
                parsed.amount = decodedValue;
              } else {
                return parsed;
              }  
            break;

            case 'label':
              parsed.label = decodedValue;
            break;

            case 'message':
              parsed.message = decodedValue;
            break;

            case 'r':
              // Could use a more comprehesive regex to test URL validity, but then how would we know
              // which part of the validation it failed?
              if (decodedValue.startsWith('https://')) {
                parsed.url = decodedValue;
              } else {
                return parsed;
              }
            break;

            default:
              if (key.startsWith('req-')) {
                req = req || {};
                req[key] = decodedValue;
              } else {
                others = others || {};
                others[key] = decodedValue;
              }
          }

        };
      }

      parsed.others = others;
      parsed.req = req;
      
      
      if (address) {
        var addressLowerCase = address.toLowerCase();
        var copayInvitationRe = /^[0-9A-HJ-NP-Za-km-z]{70,80}$/;
        //var legacyRe = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
        //var legacyTestnetRe = /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
        var privateKeyEncryptedRe = /^6P[1-9A-HJ-NP-Za-km-z]{56}$/;
        var privateKeyForUncompressedPublicKeyRe = /^5[1-9A-HJ-NP-Za-km-z]{50}$/;
        var privateKeyForUncompressedPublicKeyTestnetRe = /^9[1-9A-HJ-NP-Za-km-z]{50}$/;
        var privateKeyForCompressedPublicKeyRe = /^[KL][1-9A-HJ-NP-Za-km-z]{51}$/;
        var privateKeyForCompressedPublicKeyTestnetRe = /^[c][1-9A-HJ-NP-Za-km-z]{51}$/;
      
        var bitpayAddrMainnet = bitpayAddrOnMainnet(address);
        var cashAddrTestnet = cashAddrOnTestnet(addressLowerCase);
        var cashAddrMainnet = cashAddrOnMainnet(addressLowerCase);
        var privateKey = '';

        if (parsed.testnet && cashAddrTestnet) {
          parsed.address = addressLowerCase;
          parsed.coin = 'bch';
          parsed.publicAddress = {
            cashAddr: addressLowerCase
          };
          parsed.isValid = true;
          
        } else if (cashAddrMainnet) {
          parsed.coin = 'bch';
          parsed.publicAddress = {
            cashAddr: addressLowerCase
          };
          parsed.testnet = false;
          parsed.isValid = true;  

        } else if (bitcore.Address.isValid(address, 'livenet')) {
          parsed.publicAddress = {
            legacy: address
          };
          parsed.testnet = false;
          parsed.isValid = true;

        } else if (bitcore.Address.isValid(address, 'testnet')) {
          parsed.publicAddress = {
            legacy: address
          };
          parsed.testnet = true;
          parsed.isValid = true;

        } else if (bitpayAddrMainnet) {
          parsed.coin = 'bch';
          parsed.publicAddress = {
            bitpay: address
          };
          parsed.testnet = false;
          parsed.isValid = true;

        } else if (copayInvitationRe.test(address) ) {
          parsed.copayInvitation = address;
          parsed.isValid = true;

        } else if (privateKeyForUncompressedPublicKeyRe.test(address) || privateKeyForCompressedPublicKeyRe.test(address)) {
          privateKey = address;
          try {
            new bitcore.PrivateKey(privateKey, 'livenet');
            parsed.privateKey = { wif: privateKey };
            parsed.testnet = false;
            parsed.isValid = true;
          } catch (e) {}

        } else if (privateKeyForUncompressedPublicKeyTestnetRe.test(address) || privateKeyForCompressedPublicKeyTestnetRe.test(address)) {
          privateKey = address;
          try {
            new bitcore.PrivateKey(privateKey, 'testnet');
            parsed.privateKey = { wif: privateKey };
            parsed.testnet = true;
            parsed.isValid = true;
          } catch (e) {}

        } else if (privateKeyEncryptedRe.test(address)) {
          parsed.privateKey = { encrypted: address };
          parsed.isValid = true;
        }
          
      } else {
        parsed.isValid = !!parsed.url; // BIP72
      }

      return parsed;
    }

  }  

})();