'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycDocumentCaptureController',
  buyBitcoinKycDocumentCaptureController);

  function buyBitcoinKycDocumentCaptureController(
    bitAnalyticsService
    , gettextCatalog
    , cameraPreviewService
    , kycFlowService
    , $scope
  ) {
    var currentState = {};
    var vm = this;

    // Functions
    vm.goBack = goBack;
    vm.onCapture = onCapture;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.supportedDocumentLabels = {
        'passport': gettextCatalog.getString('Passport')
        ,'national_identity_card': gettextCatalog.getString('National ID')
        ,'driving_licence': gettextCatalog.getString('Driving License')
      }

      vm.canEnableLight = true;
      vm.canChangeCamera = true;
      vm.inPreview = false;

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();
      console.log("Capture - Current State: ", currentState);
      // Title Label
      vm.documentName = vm.supportedDocumentLabels[currentState.documentType];

      vm.titleLabel = vm.documentName + " " + (currentState.documents.length === 0 ? gettextCatalog.getString('Front') : gettextCatalog.getString('Back'));
      cameraPreviewService.startCamera();
    }

    function onCapture() {
      console.log('On Capture');
      // Store Image in Screenshot
      cameraPreviewService.takePicture(null, function onPictureTaken(base64PictureData) {
        console.log('Inside take picture callback');
        cameraPreviewService.stopCamera();
        
        var horizontalPadding = window.innerWidth * 0.05;

        var imgWidth = window.innerWidth - horizontalPadding * 2;
        var imgHeight = imgWidth * 0.755;

        var verticalPadding = 44 + (imgHeight * 0.12) / 2;

        cropDocument('data:image/jpeg;base64,' + base64PictureData, horizontalPadding, verticalPadding, imgWidth, imgHeight).then( function(image) {
          currentState.documents.push(image);
          currentState.inPreview = true;
          kycFlowService.goNext(currentState);
        }).catch(function() {
          console.log("error occured");
        });
        
      }); 
    }
    
    function cropDocument(image, originX, originY, imgWidth, imgHeight) {
      return new Promise(async function( resolve, reject) {
        var tempImage = new Image();
        tempImage.onload = function() {

          var coefX = this.width / window.innerWidth;
          var coefY = this.height / window.innerHeight;

          var coefImg = this.width / this.height;
          var coefScreen = window.innerWidth / window.innerHeight;

          var ratioY = 1 + (coefImg - coefScreen);

          var canvas = document.createElement('canvas');
          var context = canvas.getContext('2d');

          var calWidthImg =  imgWidth * coefX
          var calHeightImg = imgHeight * coefY * ratioY

          canvas.width = calWidthImg;
          canvas.height = calHeightImg;

          context.drawImage(tempImage, originX * coefX, originY * coefY * ratioY, calWidthImg, calHeightImg, 0, 0, calWidthImg, calHeightImg);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }

        tempImage.src = image;
      });
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      //if (data.direction == "back") {
      //  kycFlowService.popState();
      //}
      _initVariables();

      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      cameraPreviewService.stopCamera();
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_close' ,[], ['leanplum']);
    }
  }
})();
