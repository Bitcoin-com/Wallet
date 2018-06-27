'use strict';

angular.module('copayApp.services').factory('encryptionService', function($log) {
  var root = {};

  //lazy creation of cipher and decipher?

  // need a function to get the key
  var password = 'password';

  function _getGetOrCreateKey() {

    //crytpo.scrypt()
    //crypto.createCipheriv()
  };

  function encryptUsingcrypto(str) {
    var cipher = crypto.createCipher('aes256', password);

    cipher.on('readable', () => {
      var data = cipher.read();
      if (data) {
        encrypted += data.toString('hex');
      }
    });
    
    cipher.on('end', () => {
      console.log('Encrypted 1: ' + encrypted);
      //cb();
    });

    //cipher.write(str);
    cipher.write(str);
    cipher.end();
  }

  function encryptUsingCryptoJS(str) {
    var ciphertext = CryptoJS.AES.encrypt(str, password);
    $log.debug('cipherText: ' + ciphertext);
  }

  root.encrypt = function(str, cb) {
    $log.debug('*** crypto   exists: ' + !!crypto);
    $log.debug('*** CryptoJS exists: ' + !!CryptoJS);

    encryptUsingCryptoJS('I am a secret.');

/*
  //  var ciphertext = CryptoJS.AES.encrypt(str, password);
    var cipher = crypto.createCipher('aes256', password);

    cipher.on('readable', () => {
      var data = cipher.read();
      if (data) {
        encrypted += data.toString('hex');
      }
    });
    
    cipher.on('end', () => {
      console.log('Encrypted: ' + encrypted);
      //cb();
    });

    //cipher.write(str);
    cipher.write('I am secret');
    cipher.end();
    */
    
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

  return root;
});