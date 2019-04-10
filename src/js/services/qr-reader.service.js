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
    var isDesktop = !platformInfo.isCordova;
    var qrReader = $window.qrreader;

    var service = {
      errors: errors,
      
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
          // Concatenate with + so that it shows up well in Android Logcat
          console.log('qrreader openSettings() result: ' + result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader openSettings() error: ' + error);

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
          console.log('qrreader startReading() result: ' + result);

          deferred.resolve(result);
        },
        function onError(error) {
          console.error('qrreader startReading() error: ' + error);

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
          console.log('qrReader stopReading() result: ' + result);

          deferred.resolve(result);
        },
        function onError(error) {
          $log.error('qrReader stopReading() error: ' + error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

    function checkPermission() {
      var deferred = $q.defer();

      qrReader.checkPermission(
        function onSuccess(result) {
          console.log('qrReader checkPermission() result: ' + result);

          deferred.resolve(result);
        },
        function onError(error) {
          $log.error('qrReader checkPermission() error: ' + error);

          var errorMessage = errors[error] || error;
          var translatedErrorMessage = gettextCatalog.getString(errorMessage);
          deferred.reject(translatedErrorMessage);
        });

      return deferred.promise;
    }

  }

})();
