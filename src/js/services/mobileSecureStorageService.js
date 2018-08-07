'use strict';

angular.module('copayApp.services').factory('mobileSecureStorageService', function($log, appConfigService, platformInfo) {
  var root = {};

  var isReady = false;
  var initialisationFailed = false;
  var pending = [];
  
  var storage = null;

  if (platformInfo.isCordova) {
    storage = new cordova.plugins.SecureStorage(
    function () {
        isReady = true;
        for (var i = 0; i < pending.length; i++) {
          pending[i]();
        }
        pending = [];
      },
    function (error) { 
      initialisationFailed = true;
    },
    appConfigService.packageNameId);
  }

  root.get = function(key, cb) {

    if (!platformInfo.isMobile) {
      cb(new Error('mobileSecureStorageService is only available on mobile.'));
      return;
    }

    if (!isReady) {
      if (initialisationFailed) {
        cb(new Error('mobileSecureStorageService initialisation failed.'));
      } else {
        pending.push(function(){ root.get(key, cb); });
      }
      return;
    }

    storage.get(
      function (value) { 
        cb(null, value);
      },
      function (error) { 
        $log.debug('mss get failed. ' + error);
        if (error.message === 'Failure in SecureStorage.get() - The specified item could not be found in the keychain' || // iOS
          error.message === 'Key [_SS_profile] not found.') { // Android
          // The callback expects no error, but also no value, if it cannot be found.
          cb(null, null);
        } else {
          cb(new Error(error));
        }
      },
      key);
  };

  root.set = function(key, value, cb) {
    
    if (!platformInfo.isMobile) {
      cb(new Error('mobileSecureStorageService is only available on mobile.'));
    } 

    if (!isReady) {
      if (initialisationFailed) {
        cb(new Error('mobileSecureStorageService initialisation failed.'));
      } else {
        pending.push(function(){ root.set(key, value, cb); });
      }
      return;
    }

    storage.set(
      function (value) { 
        cb();
      },
      function (error) { 
        cb(new Error(error));
      },
      key, value);

  };

  return root;
});

