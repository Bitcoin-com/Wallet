'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('qrReaderService', qrReaderService);

  function qrReaderService(
    gettextCatalog
    , $log
    , $timeout
    , platformInfo
    , $q
    , $rootScope
    , $window
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
      openSettings: openSettings
      , startReading: startReading
      , stopReading: stopReading
      , checkPermission: checkPermission
    };

    return service;

    function openSettings() {
      var deferred = $q.defer();

      qrReader.openSettings(
        function onSuccess(result) {
          console.log('qrreader openSettings() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader openSettings() error:', error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

    function startReading() {
      var deferred = $q.defer();

      qrReader.startReading(
        function onSuccess(result) {
          console.log('qrreader startReading() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader startReading() error:', error);

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

      qrReader.stopReading(
        function onSuccess(result) {
          console.log('qrreader stopReading() result:', result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader stopReading() error:', error);

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

      qrReader.checkPermission(
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
