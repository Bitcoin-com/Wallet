(function() {
  'use strict';

  angular
      .module('copayApp.services')
      .factory('jsonEncryptionService', jsonEncryptionService);

  function jsonEncryptionService($log) {
    var currentVersion = 1;

    var service = {
      isEncrypted: isEncrypted,
      parse: parse,
      stringify: stringify
    };
    return service;

    function isEncrypted(jsonStr) {
      try {
        var jsonObj = JSON.parse(jsonStr);
      } catch (e) {
        $log.error('Failed to parse JSON when looking for encypted data.', e);
        return false;
      }
      return jsonObj.version && jsonObj.encryptedData;
    }

    function parse(jsonStr) {

      var jsonObj = JSON.parse(jsonStr);

      if (!(jsonObj.version && jsonObj.version === currentVersion)) {
        throw new Error('Incompatible version.');
      }

      var encryptedData = jsonObj.encryptedData;
      // extract ciphertext from json object, and create cipher params object 
      //var ciphertext = CryptoJS.enc.Base64.parse(encryptedData.ciphertext) 
      //var iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      var ciphertext = encryptedData.ciphertext;
      var iv = encryptedData.iv;

      return {
        ciphertext: ciphertext,
        opts: {
          iv: iv
        }
      } 
    }

    /**
     * 
     * @param {string, Base64 encoded} ciphertext
     * @param {*} opts So it flexible enough to handle other schemes in future.
     * @throws If cipherParams does not include the iv.
     */
    function stringify(ciphertext, opts) { 
      var iv = opts.iv;

      if(!iv) {
        throw new Error('Must include iv.');
      }
    
      var encryptedData = {
        ciphertext: ciphertext,
        iv: iv
      }; 
      
      return JSON.stringify({
        version: currentVersion,
        encryptedData: encryptedData
      }); 
    } 
  };
})();