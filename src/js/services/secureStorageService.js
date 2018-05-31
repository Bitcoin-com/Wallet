'use strict';

angular.module('copayApp.services').factory('secureStorageService', function($log, appConfigService, platformInfo) {
  var root = {};

  var ssIsReady = false;
  var ssInitialisationFailed = false;
  var pending = [];

  var ss = new cordova.plugins.SecureStorage(
    function () {
        console.log('ss Success');
        ssIsReady = true;
        for (var i = 0; i < pending.length; i++) {
          pending[i]();
        }
        pending = [];
      },
    function (error) { 
      console.log('ss Error ' + error); 
      ssInitialisationFailed = true;
    },
    appConfigService.packageNameId);

   

  root.get = function(key, cb) {
    $log.debug('secureStorageService.get()');
    if (!ssIsReady) {
        $log.debug("ss not ready.");
        if (ssInitialisationFailed) {
          $log.debug("returning error because initialisation failed.");
          cb(new Error("Secure storage initialisation failed."));
        } else {
          $log.debug("adding get to pending.");
          pending.push(function(){ root.get(key, cb); });
        }
        return
    }
    $log.debug("ss is ready.");

    ss.get(
      function (value) { 
        console.log('ss Success, got ' + value); 
        cb(null, value);
      },
      function (error) { 
        console.log('ss Error "' + error.message + '" ' + JSON.stringify(error)); 

        if (error.message === 'Failure in SecureStorage.get() - The specified item could not be found in the keychain' ||
          error.message === 'Key [_SS_profile] not found.') {
          $log.debug("Sending back null error.");
          // The callback expects no error, but also no value, if it cannot be found.
          cb(null);
        } else {
          cb(new Error(error));
        }
      },
      key);

  };

  root.set = function(key, value, cb) {
    $log.debug('secureStorageService.set()');
    if (!ssIsReady) {
        $log.debug("ss not ready.");
        if (ssInitialisationFailed) {
          $log.debug("returning error because initialisation failed.");
          cb(new Error("Secure storage initialisation failed."));
        } else {
          $log.debug("adding set to pending.");
          pending.push(function(){ root.set(key, value, cb); });
        }
        return
    }
    $log.debug("ss is ready.");

    ss.set(
      function (value) { 
        console.log('ss Success, got ' + value); 
        cb();
      },
      function (error) { 
        console.log('ss Error ' + error); 
        cb(new Error(error));
      },
      key, value);

  };


  return root;
});

