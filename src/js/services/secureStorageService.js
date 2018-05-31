'use strict';

angular.module('copayApp.services').factory('secureStorageService', function(desktopSecureStorageService, localStorageService, $log, mobileSecureStorageService, platformInfo) {
  var root = {};

  // To make wrong code look wrong
  function alteredKeyIndicatingDesireForSecureStorage(key) {
    return key + ":desiredSecure";
  }

  root.get = function(k, cb) {
    if (platformInfo.isMobile) {
      mobileSecureStorageService.get(k, cb);
    } else if (platformInfo.isNW) {
      desktopSecureStorageService.get(k, cb);
    } else { // Browser
      localStorageService.get(alteredKeyIndicatingDesireForSecureStorage(k), cb);
    }
  }

  root.set = function(k, v, cb) {
    if (platformInfo.isMobile) {
      mobileSecureStorageService.set(k, v, cb);
    } else if (platformInfo.isNW) {
      desktopSecureStorageService.set(k, v, cb);
    } else { // Browser
      localStorageService.set(alteredKeyIndicatingDesireForSecureStorage(k), v, cb);
    }
  }
  
  return root;
});