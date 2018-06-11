'use strict';

angular.module('copayApp.services').factory('desktopSecureStorageService', function($log, appConfigService, platformInfo, lodash, localStorageService) {
  var root = {};
  var storage = null;
  var serviceName = appConfigService.packageNameId;
  var initialisationFailed = false;

  if (platformInfo.isNW) {
    try {
      var os = require('os');
      var arch = (os.arch() === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) ? 'x64':'ia32';
      var file = './keytar/keytar-prebuild-v4.1.1-node-v51-'+process.platform+'-'+arch+'.node';
      storage = require('keytar');
      storage.setKeytarInstance(require(file));
    } catch (e) {
      console.log(e);
      initialisationFailed = true;
    }
  }

  root.get = function(key, cb) {
    if (!platformInfo.isNW) {
      cb(new Error('desktopSecureStorageService is only available on NW.js desktop.'));
      return;
    }

    if (initialisationFailed)
      return localStorageService.get(key, cb);

    storage.getPassword(serviceName, key).then(function(result) {
      return cb(null, result); // XX SP: result is null if no value is found as it should
    }).catch(function (error) {
      cb(new Error(error));
    });
  };

  root.set = function(key, value, cb) {
    if (!platformInfo.isNW) {
      cb(new Error('desktopSecureStorageService is only available on NW.js desktop.'));
      return;
    }

    if (initialisationFailed)
      return localStorageService.set(key, value, cb);

    if (lodash.isObject(value)) {
      value = JSON.stringify(value);
    }
    if (value && !lodash.isString(value)) {
      value = value.toString();
    }

    storage.deletePassword(serviceName, key).then(function (result) {
      storage.setPassword(serviceName, key, value).then(function (value) {
        cb();
      }).catch(function (error) {
        console.log(error);
        cb(new Error(error));
      })
    });
  };

  return root;
});