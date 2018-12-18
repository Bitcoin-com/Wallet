'use strict';

angular.module('bitcoincom.services').service('cameraPreviewService', function($log
  , $timeout
  , platformInfo
  , $rootScope
  , $window
  , CameraPreview
  ) {

  var isDesktop = !platformInfo.isCordova;
  var QRScanner = $window.QRScanner;
  var lightEnabled = false;
  var backCamera = true; // the plugin defaults to the back camera

  // Initalize known capabilities
  // Assume camera is available. If init fails, we'll set this to false.
  var isAvailable = true;
  var hasPermission = false;
  var isDenied = false;
  var isRestricted = false;
  var canEnableLight = false;
  var canChangeCamera = false;
  var canOpenSettings = false;

  function _checkCapabilities(status) {
    $log.debug('scannerService is reviewing platform capabilities...');
    // Permission can be assumed on the desktop builds
    hasPermission = (isDesktop || status.authorized) ? true : false;
    isDenied = status.denied ? true : false;
    isRestricted = status.restricted ? true : false;
    canEnableLight = status.canEnableLight ? true : false;
    canChangeCamera = status.canChangeCamera ? true : false;
    canOpenSettings = status.canOpenSettings ? true : false;
    _logCapabilities();
  }

  var defaultCameraSettings = {
    x: 0
    , y: 0
    , width: $window.screen.width
    , height: $window.screen.height
    , camera: CameraPreview.CAMERA_DIRECRTION.BACK
    , toBack: false
    , tapPhoto: false
    , tapFocus: true
    , previewDrag: false
  };

  function _intiSettings() {
    var options = {
      x: 0
      , y: 0
      , width: $window.screen.width
      , height: $window.screen.height
      , camera: CameraPreview.CAMERA_DIRECRTION.BACK
      , toBack: false
      , tapPhoto: false
      , tapFocus: true
      , previewDrag: false
      , disableExifHeaderStripping: true
    };
  }

  function startCamera(options = defaultCameraSettings) {
    CameraPreview.startCamera(options).then( function onStartCameraSuccess() {
      console.log('Camera Preview Started!');
      CameraPreview.show();
    }, function onStartCameraError(err) {
      $log.debug('Camera Preview Failed to start on request');
      });
  }

  function stopCamera() {
    return CameraPreview.stopCamera().then(
      function onStopCameraSuccess() {
        return;
      },
      function onCameraStopError(err) {
        $log.debug('Camera Preview Failed to stop on request');
      }
    )
  }

  function takePicture() {

  }

  function setPreviewSize() {

  }

  // getCameraCharacteristics

});
