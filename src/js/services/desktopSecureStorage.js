'use strict';

angular.module('copayApp.services')
    .factory('desktopSecureStorageService', function (platformInfo, $timeout, $log, lodash) {
      var isNW = platformInfo.isNW;
      var root = {};
      var serviceName = 'Bitcoin.com';
      if (!isNW)
        $log.debug('This is not an NW.js app, keytar not available');
      else
        var keytar = require('keytar');
      root.get = function (k, cb) {
        return keytar.getPassword(serviceName, k).then(function(result) {
          return cb(null, result);
        });
      };

      /**
       * Same as setItem, but fails if an item already exists
       */
      root.create = function (name, value, callback) {
        root.get(name,
            function (err, data) {
              if (data) {
                return callback('EEXISTS');
              } else {
                return root.set(name, value, callback);
              }
            });
      };

      root.set = function (k, v, cb) {
        if (lodash.isObject(v)) {
          v = JSON.stringify(v);
        }
        if (v && !lodash.isString(v)) {
          v = v.toString();
        }

        keytar.deletePassword(serviceName, k).then(function (result) {
          keytar.setPassword(serviceName, k, v).then(function (val) {
            console.log(val);
          }).catch(function (err) {
            console.log(err);
          }).finally(function () {
            return cb();
          });
        });
      };

      root.remove = function (k, cb) {
        keytar.deletePassword(serviceName, k).then(function(result) {
          return cb();
        });
      };

      return root;
    });
