
(function() {
  'use strict';


  angular.module('copayApp.services').factory('encryptionService', function($log, secureStorageService) {
    var keySize = 512;
    var iterations = 1500;
    var storageKey = 'encryptionKey';

    var service = {
      decrypt: decrypt,
      encrypt: encrypt,
      removeKeyIfExists: removeKeyIfExists
    };
    return service;

    /**
     * Returns a CryptoJS.WordArray
     */
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

    /**
     * Generates its own Initialization Vector, which is returned.
     * @param {string, Base64 encoded} str 
     * @param {CryptoJS.WordArray} key 
     * @returns {*} The ciphertext created, and the IV used.
     */
    function _encryptUsingCryptoJS(str, key) {
      var iv  = CryptoJS.lib.WordArray.random(16);

      var cipherParams = CryptoJS.AES.encrypt(str, key, { iv: iv });
      var ciphertextWords = cipherParams.ciphertext.toString(CryptoJS.enc.Base64);
      var ivHex = iv.toString(CryptoJS.enc.Hex);
      
      // Just for testing - do we get back what we put in?
      /*
      decrypt(ciphertext, {iv: ivHex}, function onDecryptionTest(err, decrypted){
        if (err) {
          $log.error('Failed to decrypt encrypted.', err);
          
        } else {
          $log.debug('Freshly decrypted:', JSON.stringify(decrypted));
        }
      });
      */

      return {
        ciphertext: ciphertextWords.toString(CryptoJS.enc.Base64),
        opts: { 
          iv: ivHex
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

        var decrypted;
        try {
          decrypted = _decryptUsingCryptoJS(str, key, opts.iv);
        } catch (e) {
          // Can get this when using the wrong key: Malformed UTF-8 data
          $log.error('Error when decrypting.', e);
          cb(e, null);
          return;
        }
        cb(null, decrypted);
      });
    };

    function encrypt(str, cb) {

      _getOrCreateKey(function onKey(err, key){
        if (err) {
          cb(err, null);
          return;
        }

        var encrypted = _encryptUsingCryptoJS(str, key);
        cb(null, encrypted);
      });
    };

    function removeKeyIfExists() {
      secureStorageService.remove(storageKey, function onKeyRemoved(err){
        if (err) {
          $log.error('Error removing key.', err);
          return;
        }
        $log.debug('Key removed.');
      });
    }

  });
})();