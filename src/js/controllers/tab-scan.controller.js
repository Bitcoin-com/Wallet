'use strict';

(function () {

angular
  .module('copayApp.controllers')
  .controller('tabScanController', tabScanController);
  
  function tabScanController(
    gettextCatalog
    , popupService
    , qrReaderService
    , qrScannerService
    , $scope
    , $log
    , $timeout
    , incomingDataService
    , $state
    , $ionicHistory
    , $rootScope
    , $ionicNavBarDelegate
    , platformInfo
    ) {

      var qrPermissionResult = {
        denied: 'PERMISSION_DENIED',
        granted: 'PERMISSION_GRANTED',

        // iOS
        restricted: 'PERMISSION_RESTRICTED',
        notDetermined: 'PERMISSION_NOT_DETERMINED'
      };

    var scannerStates = {
      denied: 'denied',
      unavailable: 'unavailable',
      visible: 'visible'
    };

    var isCheckingPermissions = false;
    var isReading = false;
    var isDesktop = !platformInfo.isCordova;
    var qrService = isDesktop ? qrScannerService : qrReaderService;

    $scope.onOpenSettings = onOpenSettings;
    $scope.onRetry = onRetry;
    $scope.scannerStates = scannerStates;
    $scope.currentState = scannerStates.visible;
    $scope.canOpenSettings = isDesktop ? false : true;

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });

    $scope.$on("$ionicView.afterEnter", function() {
      _checkPermissionThenStartReading();
    });

    $scope.$on("$ionicView.beforeLeave", function() {
      qrService.stopReading();
    });

    function _handleSuccessfulScan(contents){
      
      $log.debug('Scan returned: "' + contents + '"');
      //scannerService.pausePreview();
      // Sometimes (testing in Chrome, when reading QR Code) data is an object
      // that has a string data.result.
      contents = contents.result || contents;
      incomingDataService.redir(contents, function onError(err) {
        if (err) {
          var title = gettextCatalog.getString('Scan Failed');
          popupService.showAlert(title, err.message, function onAlertShown() {
            // Enable another scan since we won't receive incomingDataMenu.menuHidden
            _startReading();
          });
        } else {
          _startReading();
        }
      });
      
    }

    $rootScope.$on('incomingDataMenu.menuHidden', function() {
      _startReading();
    });

    function onRetry() {
      _checkPermissionThenStartReading();
    }

    function onOpenSettings(){
      //scannerService.openSettings();
      qrService.openSettings().then(
        function onOpenSettingsResolved(result) {
          console.log('Open settings resolved with:', result);
          //_checkPermissionThenStartReading();
          // Allow to manually retry the camera
          $scope.canOpenSettings = false;
          
        },
        function onOpenSettingsRejected(reason) {
          $log.error('Failed to open settings. ' + reason);

          $scope.canOpenSettings = false;
          
          // TODO: Handle all the different types of errors
          $scope.currentState = scannerStates.unavailable;
        }
      );
    }

    function _checkPermissionThenStartReading() {
      isCheckingPermissions = true;
      qrService.checkPermission().then(
        function onCheckPermissionSuccess(result) {
          console.log('onPermissionSuccess() ', result);
          isCheckingPermissions = false;
          if (result === qrPermissionResult.granted || result === qrPermissionResult.notDetermined) {
            _startReading();
          } else {
            $scope.currentState = scannerStates.denied;
          }
        },
        function onCheckPermissionFailed(err) {
          isCheckingPermissions = false;
          $log.error('Failed to check permission.', err);
        }
      );
    }

    function _startReading() {
      $scope.currentState = scannerStates.visible;
      isReading = true;
      console.log('Starting QR Service.');
      qrService.startReading().then(
        function onStartReadingResolved(contents) {
          isReading = false;
          _handleSuccessfulScan(contents);
        },
        function onStartReadingRejected(reason) {
          isReading = false;
          $log.error('Failed to start reading QR code. ' + reason);

          if (reason === qrService.errors.permissionDenied) {
            $scope.currentState = scannerStates.denied;
          } else {
            // TODO: Handle all the different types of errors
            $scope.currentState = scannerStates.unavailable;
          }
        });
    }

    $scope.toggleLight = function(){
      /*
      scannerService.toggleLight(function(lightEnabled){
        $scope.lightActive = lightEnabled;
        $scope.$apply();
      });
      */
    };

    $scope.toggleCamera = function(){
      /*
      $scope.cameraToggleActive = true;
      scannerService.toggleCamera(function(status){
      // (a short delay for the user to see the visual feedback)
        $timeout(function(){
          $scope.cameraToggleActive = false;
          $scope.lightActive = false; // The light is off when we switch camera succesfully
          $log.debug('Camera toggle control deactivated.');
        }, 200);
      });
      */
    };

    $scope.canGoBack = function(){
      return $state.params.passthroughMode;
    };


    function goBack(){
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $ionicHistory.backView().go();
    }
    $scope.goBack = goBack;
  }
})();
