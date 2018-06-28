
(function() {
  'use strict';


  angular.module('copayApp.services').factory('encryptionService', function($log, secureStorageService) {
    var keySize = 512;
    var iterations = 1500;
    var storageKey = 'encryptionKey';

    var service = {
      decrypt: decrypt,
      encrypt: encrypt
    };
    return service;

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

    /**
     * 
     * @param {string, Base64 encoded} str 
     * @param {CryptoJS.WordArray} key 
     * @param {string, hex} iv 
     */
    function _decryptUsingCryptoJS(str, key, iv) {
      $log.debug('decrypt() str: ' + str);
      $log.debug('decrypt() using iv:' + iv + ', key: ' + JSON.stringify(key));
      
      var ivWords = CryptoJS.enc.Hex.parse(iv);
      var plaintext = CryptoJS.AES.decrypt(str, key, { iv: ivWords });
      $log.debug('plaintext', JSON.stringify(plaintext));

      var plaintextWords = CryptoJS.lib.WordArray.create();
      plaintextWords.init(plaintext.words, plaintext.sigBytes);
      $log.debug('plaintextWords', JSON.stringify(plaintextWords));
      var plaintextString = plaintextWords.toString(CryptoJS.enc.Utf8);
      $log.debug('plaintextString:  ', JSON.stringify(plaintextString));

      return plaintextString;
    }


    function _encryptUsingCryptoJS(str, key) {
      $log.debug('encrypt() str: ' + str);
      var iv  = CryptoJS.lib.WordArray.random(16);

      $log.debug('Encrypting profile: ', JSON.stringify(str));

      var cipherParams = CryptoJS.AES.encrypt(str, key, { iv: iv });
      var ciphertext = cipherParams.ciphertext.toString(CryptoJS.enc.Base64);
      var iv = iv.toString(CryptoJS.enc.Hex);
      $log.debug('ciphertext: ' + ciphertext);
      $log.debug('iv: ' + iv);
      
      // Just for testing - do we get back what we put in?
      decrypt(ciphertext, {iv: iv}, function onDecryptionTest(err, decrypted){
        if (err) {
          $log.error('Failed to decrypt encrypted.', err);
          
        } else {
          $log.debug('Freshly decrypted:', JSON.stringify(decrypted));
        }


      });
      

      return {
        ciphertext: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
        opts: { 
          iv: iv.toString(CryptoJS.enc.Hex)
        }
      };
    }

    function decrypt(str, opts, cb) {
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

    function encrypt(str, cb) {
      $log.debug('encrypt()', JSON.stringify('str'));
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

  });
})();