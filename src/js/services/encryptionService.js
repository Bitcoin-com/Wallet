
'use strict';

angular.module('copayApp.services').factory('encryptionService', function($log, secureStorageService) {
  var root = {};

  var keySize = 512;
  var iterations = 1500;
  var storageKey = 'encryptionKey';

  // need a function to get the key
  var password = 'password';

  function _generateKey() {
    var salt = CryptoJS.lib.WordArray.random(128/8);
    var passphrase = CryptoJS.lib.WordArray.random(128/8);
    var key = CryptoJS.PBKDF2(passphrase, salt, { keySize: keySize/32, iterations: iterations });

    $log.debug('Generated key: ' + key);
    return key;
  }

  /**
   * 
   * @param {*} cb 
   */
  function _getOrCreateKey(cb) {
    // TODO: Get from secure storage
    secureStorageService.get(storageKey, function onKeyRetrieved(keyErr, keyHex) {
      if (keyErr) {
        cb(keyErr, null);
        return;
      }

      if (keyHex) {
        var key = CryptoJS.enc.Hex.parse(keyHex);
        cb(null, key);
        return;
      }

      key = _generateKey();
      var keyHex = CryptoJS.enc.Hex.stringify(key);
      secureStorageService.set(storageKey, keyHex, function onKeyStored(storeErr) {
        if (storeErr) {
          $log.error('Error storing key.', storeErr);
          cb(storeErr, null);
          return;
        }

        cb(null, key);
      });
      
    });
  };

  function _decryptUsingCryptoJS(str, key, iv) {
    var plaintext = CryptoJS.AES.decrypt(str, key, { iv: iv});
    return plaintext;
  }


  function _encryptUsingCryptoJS(str, key) {
    var iv  = CryptoJS.lib.WordArray.random(16);

    var cipherParams = CryptoJS.AES.encrypt(str, key, { iv: iv });
    $log.debug('cipherText: ' + cipherParams.ciphertext);

    return {
      ciphertext: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
      opts: { 
        iv: iv.toString(CryptoJS.enc.Hex)
      }
    };
  }

  root.decrypt = function(str, opts, cb) {
    _getOrCreateKey(function onKey(err, key) {
      if (err) {
        $log.error('Failed to get or create key.', err);
        cb(err, null);
        return;
      }

      var decrypted = _decryptUsingCryptoJS(str, key, opts.iv);
      cb(null, decrypted);
    });
  };

  root.encrypt = function(str, cb) {
    $log.debug('*** crypto   exists: ' + !!crypto);
    $log.debug('*** CryptoJS exists: ' + !!CryptoJS);

    _getOrCreateKey(function onKey(err, key){
      if (err) {
        cb(err, null);
        return;
      }

      var encrypted = _encryptUsingCryptoJS(str, key);
      cb(null, encrypted);
    });
  };
    

  root.encryptedObjectFromString = function(str) {
    try {
      var parsed = JSON.parse(str);
    } catch(e) {
      return null;
    }

    if (parsed.encryptionVersion) {
      return parsed;
    } else {
      return null;
    }
  };

  var JsonFormatter = {
    stringify: function (cipherParams) { 
      // create json object with ciphertext 
      var jsonObj = { 
        ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
      }; 
      // optionally add iv and salt 
      if (cipherParams.iv) {
        jsonObj.iv = cipherParams.iv.toString(); 
      } 
      
      if (cipherParams.salt) { 
        jsonObj.s = cipherParams.salt.toString(); 
      } 
      
      // stringify json object 
      return JSON.stringify(jsonObj); 
    }, 
    parse: function (jsonStr) { 
      // parse json string 
      var jsonObj = JSON.parse(jsonStr); 
      // extract ciphertext from json object, and create cipher params object 
      var cipherParams = CryptoJS.lib.CipherParams.create({ 
        ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct) 
      }); 
      
      // optionally extract iv and salt 
      if (jsonObj.iv) { 
        cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv) 
      } 
      
      if (jsonObj.s) { 
        cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s) 
      } 
      
      return cipherParams; 
    } 
  }; 
  
  /*
  var encrypted = CryptoJS.AES.encrypt("Message", "Secret Passphrase", { format: JsonFormatter });
  alert(encrypted); // {"ct":"tZ4MsEnfbcDOwqau68aOrQ==","iv":"8a8c8fd8fe33743d3638737ea4a00698","s":"ba06373c8f57179c"} 
  
  var decrypted = CryptoJS.AES.decrypt(encrypted, "Secret Passphrase", { format: JsonFormatter }); 
  alert(decrypted.toString(CryptoJS.enc.Utf8)); // Message
  */

  return root;
});