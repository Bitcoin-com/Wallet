'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycDocumentVerifyController',
  buyBitcoinKycDocumentCaptureController);

  function buyBitcoinKycDocumentCaptureController(
    bitAnalyticsService
    , gettextCatalog
    , $ionicHistory
    , $log
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
    vm.onAccept = onAccept;
    vm.onRetry = onRetry;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.supportedDocumentLabels = {
        'passport': gettextCatalog.getString('Passport')
        ,'national_identity_card': gettextCatalog.getString('National ID')
        ,'driving_licence': gettextCatalog.getString('Driving License')
      }

      currentState = kycFlowService.getCurrentStateClone();
      console.log("Verify - Current State: ", currentState);
      vm.documentName = vm.supportedDocumentLabels[currentState.documentType];

      // Get ImageType
      vm.imageType = 'selfie';
      if(currentState.documentType === 'passport') {
        vm.imageType = currentState.documents.length === 1 ? 'front' : 'selfie';
      } else if(currentState.documents.length < 3) {
        vm.imageType = currentState.documents.length === 1 ? 'front' : 'back';
      }
      console.log('***ImageType: ', vm.imageType);

      // Set Text Content by ImageType
      if(vm.imageType === 'selfie') {
        vm.titleLabel = gettextCatalog.getString('Self Portrait');
        vm.descriptionHeaderLabel = gettextCatalog.getString('Take a Selfie');
        vm.descriptionLabel = gettextCatalog.getString('Make sure your head is entirely within the frame and there is no blur.');
        vm.acceptButtonLabel = gettextCatalog.getString("I look good");
        vm.previewImageClass = 'preview-image-circle';
      } else {
        vm.titleLabel = vm.documentName + " " + (currentState.documents.length === 1 ? gettextCatalog.getString('Front') : gettextCatalog.getString('Back'));
        vm.descriptionLabel = gettextCatalog.getString('Make sure the details on your document are clear and readable with no blur or glare.');
        vm.acceptButtonLabel = gettextCatalog.getString("Yes, it's readable");
        vm.previewImageClass = 'preview-image';
      }

      // Fetch Image from state
      var documents = currentState.documents;
      if(documents.length > 0) {
        vm.photo = documents[documents.length-1];
      }
    }

    function onAccept() {
      currentState.inPreview = false;
      kycFlowService.goNext(currentState);
    }

    function onRetry() {
      kycFlowService.goBack();
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      if (data.direction == "back") {
        kycFlowService.popState();
      }

      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_open' ,[{}, {}, {}], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_close' ,[{}, {}, {}], ['leanplum']);
    }
  }
})();
