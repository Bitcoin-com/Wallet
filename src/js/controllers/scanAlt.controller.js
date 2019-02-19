'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('scanAltController',
  scanAltController);

  function scanAltController(
    bitAnalyticsService
    , gettextCatalog
    , cameraPreviewService
    , kycFlowService
    , $scope
    , $q
    , platformInfo
  ) {
    var currentState = {};
    var vm = this;

    // Variables
    vm.isDesktop = !platformInfo.isCordova;
    vm.isSelfie = false;

    // Functions
    vm.goBack = goBack;
    vm.onCapture = onCapture;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.afterEnter", onAfterEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.canEnableLight = true;
      vm.canChangeCamera = true;

      console.log('Inside scan alt');
      cameraPreviewService.startScanCamera();
      
    }

    function onCapture() {
      console.log('On Capture');
      // Store Image in Screenshot
      cameraPreviewService.takeRawPicture(null, function onPictureTaken(base64PictureData) {
        var rawPicture = convertDataURIToBinary(base64PictureData);
        var imgWidth = window.innerWidth; 
        var imgHeight = window.innerHeight;

        const code = jsQR(rawPicture, imgWidth, imgHeight);
        console.log('Printing Code:', code);
        if(code) {
          alert('QR Scanned: ' + code);
        }
      });
    } 
    
    function goBack() {
      $ionicHistory.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
    }

    function onAfterEnter(event, data) {
      
    }

    function onBeforeLeave(event, data) {
      cameraPreviewService.stopCamera();
    }

    function convertDataURIToBinary(dataURI) {
      var marker = ';base64,';
      var base64Index = dataURI.indexOf(marker) + marker.length;
      var base64 = dataURI.substring(base64Index);
      var raw = window.atob(base64);
      var rawLength = raw.length;
      var array = new Uint8Array(new ArrayBuffer(rawLength));
    
      for(i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    }
  }
})();
