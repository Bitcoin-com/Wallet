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
    vm.onNext = onNext;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.titleLabel = gettextCatalog.getString('Passport'); // TODO: Add logic to describe other cases

      cameraPreviewService.startCamera();
    }

    function onCapture() {
      // Store Image in Screenshot

      // Navigate to Verify
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
