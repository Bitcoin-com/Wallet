'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('qrScannerService', qrScannerService);

  function qrScannerService(
    gettextCatalog
    , $q
    , $window
  ) {

    var errors = {
      // Common


      // Android


      // Desktop


      // iOS
    };

    var qrService = $window.QRScanner;
    var scanDeferred = null;

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
      console.log('qrscanner openSettings()');

      // Doesn't do anything
      qrService.openSettings();

      // Resolve by default
      deferred.resolve();
      return deferred.promise;
    }

    function startReading() {
      var deferred = $q.defer();
      stopReading().finally(function() {
        qrService.prepare(
          function onPrepare(err, status) {
            if (err) {
              console.error('qrscanner startReading() error:', err);
              var errorMessage = errors[err] || err;
              var translatedErrorMessage = gettextCatalog.getString(errorMessage);
              deferred.reject(translatedErrorMessage);
            } else {
              console.log('qrscanner startReading() status:', status);

              scanDeferred = deferred;
              qrService.scan(function onScan(err, content) {
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(content);
                }
              });
            }
          }
        );

        qrService.show();
      });


      return deferred.promise;
    }

    // No need to wait on this promise unless you want to start again
    // immediately after
    function stopReading() {
      var deferred = $q.defer();
      
      if (scanDeferred) {
        scanDeferred.reject();
        scanDeferred = null;
      }

      QRScanner.destroy(function onDestroy(status){
        console.log('qrscanner stopReading() result:', status);
        deferred.resolve();
      });

      return deferred.promise;
    }

    // No need to wait on this promise unless you want to start again
    // immediately after
    function checkPermission() {
      var deferred = $q.defer();

      // qrService.getStatus(function(status){
      //   if(!status.authorized){
      //     deferred.reject(status);
      //   } else {
      //     deferred.resolve(status);
      //   }
      // });
      deferred.resolve(status);

      return deferred.promise;
    }

  }

})();
