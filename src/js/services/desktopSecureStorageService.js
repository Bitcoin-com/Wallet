'use strict';

angular.module('copayApp.services').factory('desktopSecureStorageService', function($log, appConfigService, platformInfo, lodash) {
  var root = {};
  var storage = null;
  var serviceName = appConfigService.packageNameId;

  if (platformInfo.isNW) {
    storage = require('keytar');
  }

  root.get = function(key, cb) {
    if (!platformInfo.isNW) {
      cb(new Error('desktopSecureStorageService is only available on NW.js desktop.'));
      return;
    }

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