'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('scannerService', scannerService);

  function scannerService(
    $log
    , $timeout
    , platformInfo
    , $rootScope
    , $window
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

    var initializeStarted = false;
    var initializeCompleted = false;

    var nextHide = null;
    var nextDestroy = null;
    var hideAfterSeconds = 5;
    var destroyAfterSeconds = 60;


    var service = {
      // Functions
      getCapabilities: getCapabilities
      , gentleInitialize: gentleInitialize

      , isInitialized: isInitialized

      , resumePreview: resumePreview
      , pausePreview: pausePreview

      , initialize: initialize
      , reinitialize: reinitialize
      , activate: activate
      , deactivate: deactivate
      , scan: scan
      , openSettings: openSettings
      , toggleLight: toggleLight
      , toggleCamera: toggleCamera
      , useOldScanner: useOldScanner
    };

    return service;

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

    function _logCapabilities() {
      function _orIsNot(bool) {
        return bool ? '' : 'not ';
      }
      $log.debug('A camera is ' + _orIsNot(isAvailable) + 'available to this app.');
      var access = 'not authorized';
      if (hasPermission) access = 'authorized';
      if (isDenied) access = 'denied';
      if (isRestricted) access = 'restricted';
      $log.debug('Camera access is ' + access + '.');
      $log.debug('Support for opening device settings is ' + _orIsNot(canOpenSettings) + 'available on this platform.');
      $log.debug('A light is ' + _orIsNot(canEnableLight) + 'available on this platform.');
      $log.debug('A second camera is ' + _orIsNot(canChangeCamera) + 'available on this platform.');
    }

    /**
     * Immediately return known capabilities of the current platform.
     */
    function getCapabilities() {
      return {
        isAvailable: isAvailable,
        hasPermission: hasPermission,
        isDenied: isDenied,
        isRestricted: isRestricted,
        canEnableLight: canEnableLight,
        canChangeCamera: canChangeCamera,
        canOpenSettings: canOpenSettings
      };
    };

    /**
     * If camera access has been granted, pre-initialize the QRScanner. This method
     * can be safely called before the scanner is visible to improve perceived
     * scanner loading times.
     *
     * The `status` of QRScanner is returned to the callback.
     */
    function gentleInitialize(callback) {
      if (initializeStarted && !isDesktop) {
        QRScanner.getStatus(function(status) {
          _completeInitialization(status, callback);
        });
        return;
      }
      initializeStarted = true;
      $log.debug('Trying to pre-initialize QRScanner.');
      if (!isDesktop) {
        QRScanner.getStatus(function(status) {
          _checkCapabilities(status);
          if (status.authorized) {
            $log.debug('Camera permission already granted.');
            initialize(callback);
          } else {
            $log.debug('QRScanner not authorized, waiting to initalize.');
            _completeInitialization(status, callback);
          }
        });
      } else {
        $log.debug('To avoid flashing the privacy light, we do not pre-initialize the camera on desktop.');
      }
    };

    function initialize(callback) {
      $log.debug('Initializing scanner...');
      QRScanner.prepare(function(err, status) {
        if (err) {
          isAvailable = false;
          $log.error(err);
          // does not return `status` if there is an error
          QRScanner.getStatus(function(status) {
            _completeInitialization(status, callback);
          });
        } else {
          isAvailable = true; // XX SP: Availability can change after permissions are granted after being denied.
          _completeInitialization(status, callback);
        }
      });
    }

    // This could be much cleaner with a Promise API
    // (needs a polyfill for some platforms)

    function _completeInitialization(status, callback) {
      _checkCapabilities(status);
      initializeCompleted = true;
      $rootScope.$emit('scannerServiceInitialized');
      if (typeof callback === "function") {
        callback(status);
      }
    }
    
    function isInitialized() {
      return initializeCompleted;
    };
    
    function initializeStarted() {
      return initializeStarted;
    };

    /**
     * (Re)activate the QRScanner, and cancel the timeouts if present.
     *
     * The `status` of QRScanner is passed to the callback when activation
     * is complete.
     */
    function activate(callback) {
      $log.debug('Activating scanner...');
      QRScanner.show(function(status) {
        initializeCompleted = true;
        _checkCapabilities(status);
        if (typeof callback === "function") {
          callback(status);
        }
      });

      if (nextHide !== null) {
        $timeout.cancel(nextHide);
        nextHide = null;
      }
      if (nextDestroy !== null) {
        $timeout.cancel(nextDestroy);
        nextDestroy = null;
      }
    };

    /**
     * Start a new scan.
     *
     * The callback receives: (err, contents)
     */
    function scan(callback) {
      $log.debug('Scanning...');
      QRScanner.scan(callback);
    };

    function pausePreview() {
      QRScanner.pausePreview();
    };

    function resumePreview() {
      QRScanner.resumePreview();
    };

    /**
     * Deactivate the QRScanner. To balance user-perceived performance and power
     * consumption, this kicks off a countdown which will "sleep" the scanner
     * after a certain amount of time.
     *
     * The `status` of QRScanner is passed to the callback when deactivation
     * is complete.
     */
    function deactivate(callback) {
      $log.debug('Deactivating scanner...');
      QRScanner.cancelScan();
      nextHide = $timeout(_hide, hideAfterSeconds * 1000);
      nextDestroy = $timeout(_destroy, destroyAfterSeconds * 1000);
    };

    // Natively hide the QRScanner's preview
    // On mobile platforms, this can reduce GPU/power usage
    // On desktop, this fully turns off the camera (and any associated privacy lights)
    function _hide() {
      $log.debug('Scanner not in use for ' + hideAfterSeconds + ' seconds, hiding...');
      QRScanner.hide();
    }

    // Reduce QRScanner power/processing consumption by the maximum amount
    function _destroy() {
      $log.debug('Scanner not in use for ' + destroyAfterSeconds + ' seconds, destroying...');
      QRScanner.destroy();
    }

    function reinitialize(callback) {
      initializeCompleted = false;
      QRScanner.destroy();
      initialize(callback);
    };

    /**
     * Toggle the device light (if available).
     *
     * The callback receives a boolean which is `true` if the light is enabled.
     */
    function toggleLight(callback) {
      $log.debug('Toggling light...');
      if (lightEnabled) {
        QRScanner.disableLight(_handleResponse);
      } else {
        QRScanner.enableLight(_handleResponse);
      }

      function _handleResponse(err, status) {
        if (err) {
          $log.error(err);
        } else {
          lightEnabled = status.lightEnabled;
          var state = lightEnabled ? 'enabled' : 'disabled';
          $log.debug('Light ' + state + '.');
        }
        callback(lightEnabled);
      }
    };

    /**
     * Switch cameras (if a second camera is available).
     *
     * The `status` of QRScanner is passed to the callback when activation
     * is complete.
     */
    function toggleCamera(callback) {
      var nextCamera = backCamera ? 1 : 0;

      function cameraToString(index) {
        return index === 1 ? 'front' : 'back'; // front = 1, back = 0
      }
      $log.debug('Toggling to the ' + cameraToString(nextCamera) + ' camera...');
      QRScanner.useCamera(nextCamera, function(err, status) {
        if (err) {
          $log.error(err);
        }
        backCamera = !backCamera;
        lightEnabled = false; // The light is off when we switch camera succesfully
        $log.debug('Camera toggled. Now using the ' + cameraToString(backCamera) + ' camera.');
        callback(status);
      });
    };

    function openSettings() {
      $log.debug('Attempting to open device settings...');
      QRScanner.openSettings();
    };

    function useOldScanner(callback) {
      cordova.plugins.barcodeScanner.scan(
        function(result) {
          callback(null, result.text);
        },
        function(error) {
          callback(error);
        }
      );
    }
  }
})();
