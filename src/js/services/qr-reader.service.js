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
      startReading: startReading,
      stopReading: stopReading
    };

    return service;

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

  }

})();
