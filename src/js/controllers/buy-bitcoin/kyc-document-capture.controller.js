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
        var horizontalPadding = window.innerWidth * .05;
        var verticalPadding = 44;

        var imgWidth = window.innerWidth - horizontalPadding * 2;
        var imgHeight = imgWidth * 0.755;

        console.log('window');
        console.log(window.innerHeight);
        console.log(window.innerWidth);

        var scaleX = imgWidth / window.innerWidth;
        var scaleY = imgHeight / window.innerHeight;

        cropDocument('data:image/jpeg;base64,' + base64PictureData, horizontalPadding, verticalPadding, imgWidth, imgHeight, scaleX, scaleY).then( function(image) {
          vm.photo = image;
          vm.inPreview = true;
          $scope.$apply();
        }).catch(function() {
          console.log("error occured");
        });
        
      }); 
    }
    
    function cropDocument(image, originX, originY, width, height, scaleX, scaleY) {
      return new Promise(async function( resolve, reject) {
        var tempImage = new Image();
        tempImage.onload = function() {
          console.log('actual size');
          console.log(this.width + 'x' + this.height);


          var canvas = document.createElement('canvas');
          var context = canvas.getContext('2d');
          console.log('canvas');
          console.log(canvas.width);
          console.log(canvas.height);
          var calWidthImg = this.width * scaleX;
          var calHeightImg = this.height * scaleY;
          canvas.width = calWidthImg;
          canvas.height = calHeightImg;
          context.drawImage(tempImage, originX * scaleX, originY * scaleY, calWidthImg, calHeightImg, 0, 0, calWidthImg, calHeightImg);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
        console.log('tempImage 1');
        console.log(tempImage);
        tempImage.src = image;
        console.log('tempImage 2');
        console.log(tempImage);
      });
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
