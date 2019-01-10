'use strict';

angular.module('bitcoincom.services').service('cameraPreviewService', function(
  $log
  , platformInfo
  , $rootScope
  , $window
  ) {

  var isDesktop = !platformInfo.isCordova;
  var CameraPreview = $window.CameraPreview;
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
    , camera: CameraPreview ? CameraPreview.CAMERA_DIRECTION.BACK : 0
    , toBack: true
    , tapPhoto: false
    , tapFocus: true
    , previewDrag: false
  };

  var defaultDocumentSettings = {
    x: 0
    , y: 0
    , width: $window.screen.width
    , height: $window.screen.height
    , camera: CameraPreview ? CameraPreview.CAMERA_DIRECTION.BACK : 0
    , toBack: true
    , tapPhoto: false
    , tapFocus: true
    , previewDrag: false
  }

  this.startCamera = function (options) {
    if (isDesktop) {
      this.startDesktopCamera();
      return;
    }

    CameraPreview.startCamera(options, [function onStartCameraSuccess() {
      console.log('Camera Preview Started!');
      return;
    }, function onStartCameraError(err) {
      $log.debug('Camera Preview Failed to start on request');
    }]);
  }

  this.startSelfieCamera = function() {
    var options = defaultCameraSettings;
    if (isDesktop) {
      this.startDesktopCamera();
      return;
    }

    options.camera = CameraPreview.CAMERA_DIRECTION.FRONT;
    this.startCamera(options);
  }

  this.startDocumentCamera = function() {
    var options = defaultDocumentSettings;
    if (isDesktop) {
      this.startDesktopCamera();
      return;
    }
    
    options.camera = CameraPreview.CAMERA_DIRECTION.BACK;
    this.startCamera(options);
  }

  this.startDesktopCamera = function () {
    var constraints = {
      video: true
    };

    var elements = document.querySelectorAll('video');
    console.log(elements);
    var video = elements[elements.length - 1];
    
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      $rootScope.$apply(function () {
        video.srcObject = stream;
      });
    });
  }

  this.stopCamera = function () {
    if (isDesktop) return;
    return CameraPreview.stopCamera(
      function onStopCameraSuccess() {
        return;
      },
      function onCameraStopError(err) {
        $log.debug('Camera Preview Failed to stop on request');
      }
    );
  }

  this.takePicture = function (options, callback) {
    if (isDesktop) {
      var elements = document.querySelectorAll('video');
      var video = elements[elements.length - 1];
      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      var base64PictureData = canvas.toDataURL('image/jpeg', 0.8);
      return callback(base64PictureData);
    }
    CameraPreview.takePicture(options, function(base64PictureData){
      callback('data:image/jpeg;base64,' + base64PictureData);
    });
  }

  function setPreviewSize() {

  }

  // getCameraCharacteristics

});
