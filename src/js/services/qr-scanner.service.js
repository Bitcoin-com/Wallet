'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('qrScannerService', qrScannerService);

  function qrScannerService(
    gettextCatalog
    , $log
    , $timeout
    , platformInfo
    , $q
    , $rootScope
    , $window
    , scannerService
  ) {

    var errors = {
      // Common


      // Android


      // Desktop


      // iOS
    };
    var isDesktop = !platformInfo.isCordova;
    var qrReader = $window.qrreader;

    var service = {
      // Functions
      openSettings: openSettings,
      startReading: startReading,
      stopReading: stopReading,
      checkPermission: checkPermission
    };

    return service;

    function openSettings() {
      var deferred = $q.defer();

      scannerService.openSettings(
        function onSuccess(result) {
          console.log('qrscanner openSettings() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrscanner openSettings() error:', error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

    function startReading() {
      var deferred = $q.defer();

      scannerService.initialize(
        function onSuccess(result) {
          console.log('qrscanner startReading() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrscanner startReading() error:', error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

    // No need to wait on this promise unless you want to start again
    // immediately after
    function stopReading() {
      var deferred = $q.defer();
      scannerService.deactivate(
        function onSuccess(result) {
          console.log('qrscanner stopReading() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrscanner stopReading() error:', error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

    // No need to wait on this promise unless you want to start again
    // immediately after
    function checkPermission() {
      var deferred = $q.defer();

      scannerService.getCapabilities(
        function onSuccess(result) {
          console.log('qrreader checkPermission() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader checkPermission() error:', error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

  }

})();
