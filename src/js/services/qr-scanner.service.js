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
      permissionDenied: 'ERROR_PERMISSION_DENIED',
      scanningUnsupported: 'ERROR_SCANNING_UNSUPPORTED',
      openSettingsUnavailable: 'ERROR_OPEN_SETTINGS_UNAVAILABLE',

      // Android
      cameraFailedToStart: 'ERROR_CAMERA_FAILED_TO_START',
      cameraSecurityException: 'ERROR_CAMERA_SECURITY_EXCEPTION',
      cameraUnavailable: 'ERROR_CAMERA_UNAVAILABLE',
      detectorDependenciesUnavailable: 'ERROR_DETECTOR_DEPENDENCIES_UNAVAILABLE',
      googlePlayServicesUnavailable: 'ERROR_GOOGLE_PLAY_SERVICES_UNAVAILABLE',
      readAlreadyStarted: 'ERROR_READ_ALREADY_STARTED',
      errorUiSetupFailed: 'ERROR_UI_SETUP_FAILED'

      // Desktop


      // iOS
    };

    var qrService = $window.QRScanner;
    var scanDeferred = null;

    var service = {
      errors: errors,

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

      qrService.getStatus(function onStatus(status) {
        var result = '';
        if (status.authorized) {
          result = 'PERMISSION_GRANTED';
        } else if (status.authorized) {
          result = 'PERMISSION_DENIED';
        } else if (status.restricted) {
          result = 'PEMISSION_RESTRICTED'
        } else {
          result = 'PERMISSION_NOT_DETERMINED';
        }

        console.log('Desktop QR scanner returning permission "' + result + '"');
        deferred.resolve(result);
      });
      

      return deferred.promise;
    }

  }

})();
