'use strict';

angular.module('copayApp.services').factory('secureStorageService', function($log, appConfigService, platformInfo) {
  var root = {};

  function CordovaSs() {
    var isReady = false;
    var initialisationFailed = false;
    var pending = [];
    
    var storage = null;


    this.get = function(key, cb) {
      if (!isReady) {
        if (initialisationFailed) {
          cb(new Error("Secure storage initialisation failed."));
        } else {
          pending.push(function(){ root.get(key, cb); });
        }
        return
      }

      storage.get(
        function (value) { 
          cb(null, value);
        },
        function (error) { 
          if (error.message === 'Failure in SecureStorage.get() - The specified item could not be found in the keychain' || // iOS
            error.message === 'Key [_SS_profile] not found.') { // Android
            // The callback expects no error, but also no value, if it cannot be found.
            cb(null);
          } else {
            cb(new Error(error));
          }
        },
        key);
    }

    this.set = function(key, value, cb) {
      if (!isReady) {
          if (initialisationFailed) {
            cb(new Error("Secure storage initialisation failed."));
          } else {
            pending.push(function(){ root.set(key, value, cb); });
          }
          return
      }
  
      storage.set(
        function (value) { 
          cb();
        },
        function (error) { 
          cb(new Error(error));
        },
        key, value);
    }

    if (platformInfo.isCordova) {
      storage = new cordova.plugins.SecureStorage(
      function () {
          console.log('ss Success');
          isReady = true;
          for (var i = 0; i < pending.length; i++) {
            pending[i]();
          }
          spending = [];
        },
      function (error) { 
        console.log('ss Error ' + error); 
        initialisationFailed = true;
      },
      appConfigService.packageNameId);
    }
  
  }

  var cordovaSs = new CordovaSs();

  root.get = function(key, cb) {
    cordovaSs.get(key, cb);
  };

  root.set = function(key, value, cb) {
    cordovaSs.set(key, value, cb);
  };


  return root;
});

