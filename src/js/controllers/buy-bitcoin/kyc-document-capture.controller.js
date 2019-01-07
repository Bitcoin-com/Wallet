'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycDocumentCaptureController',
  buyBitcoinKycDocumentCaptureController);

  function buyBitcoinKycDocumentCaptureController(
    bitAnalyticsService
    , gettextCatalog
    , $ionicHistory
    , $log
    , cameraPreviewService
    , kycFlowService
    , moonPayService
    , ongoingProcess
    , popupService
    , moment
    , $scope
  ) {
    var currentState = {};
    var vm = this;

    // Functions
    vm.goBack = goBack;
    vm.onCapture = onCapture;
    vm.onPreviewAccept = onPreviewAccept;
    vm.onPreviewDecline = onPreviewDecline;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.canEnableLight = true;
      vm.canChangeCamera = true;
      vm.inPreview = false;

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.titleLabel = gettextCatalog.getString('Passport'); // TODO: Add logic to describe other cases

      cameraPreviewService.startCamera();
    }

    function onCapture() {
      console.log('On Capture');
      // Store Image in Screenshot
      cameraPreviewService.takePicture(null, function onPictureTaken(base64PictureData) {
        console.log('Inside take picture callback');
        cameraPreviewService.stopCamera();
        vm.photo = cropDocument('data:image/jpeg;base64,' + base64PictureData, 0, 0, 200 , 150 );
        vm.inPreview = true;
      }); 
    }

    function cropDocument(image, originX, originY, width, height) {
      console.log('Performing Crop');
      // var canvas = document.createElement('canvas');
      // var context = canvas.getContext('2d');
      // canvas.width = width;
      // canvas.height = height;
      // context.drawImage(image, 0, 0, width, height);
      // return canvas.toDataURL();
      return image;
    }

    function onPreviewAccept() {
      console.log('On acceptance');
      currentState.documents.push(vm.photo);
      kycFlowService.goNext(currentState);
    }

    function onPreviewDecline() {
      console.log('On decline');
      vm.inPreview = false;
      vm.photo = null;
      cameraPreviewService.startCamera();
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      cameraPreviewService.stopCamera();
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_close' ,[], ['leanplum']);
    }
  }
})();
