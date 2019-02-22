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

    var scannerStates = {
      unauthorized: 'unauthorized',
      denied: 'denied',
      unavailable: 'unavailable',
      visible: 'visible'
    };

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
      startReadingWithPermission();
      document.addEventListener("resume", onResume, true);
    });

    $scope.$on("$ionicView.beforeLeave", function() {
      document.removeEventListener("resume", onResume, true);
      qrService.stopReading();
    });

    function onResume() {
      $scope.$apply(function () {
        startReading();
      });
    }

    function handleSuccessfulScan(contents){
      
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
            startReading();
          });
        } else {
          startReading();
        }
      });
      
    }

    $rootScope.$on('incomingDataMenu.menuHidden', function() {
      startReading();
    });

    function onRetry() {
      startReadingWithPermission();
    }

    function onOpenSettings(){
      //scannerService.openSettings();
      qrService.openSettings().then(
        function onOpenSettingsResolved(result) {
          console.log('Open settings resolved with:', result);
        },
        function onOpenSettingsRejected(reason) {
          $log.error('Failed to open settings. ' + reason);

          $scope.canOpenSettings = false;
          
          // TODO: Handle all the different types of errors
          $scope.currentState = scannerStates.unavailable;
        }
      );
    }

    function startReadingWithPermission() {
      qrService.checkPermission().then(function () {
        startReading();
      });
    }

    function startReading() {
      $scope.currentState = scannerStates.visible;
      console.log('Starting QR Service.');
      qrService.startReading().then(
        function onStartReadingResolved(contents) {
          handleSuccessfulScan(contents);
        },
        function onStartReadingRejected(reason) {
          $log.error('Failed to start reading QR code. ' + reason);

          // TODO: Handle all the different types of errors
          $scope.currentState = scannerStates.denied;
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
