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

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.titleLabel = gettextCatalog.getString('Passport'); // TODO: Add logic to describe other cases
    }

    function onAccept() {
      // Submit image to API
      if( currentState.documents.length === 0) {
        $log.debug('Error: document not supplied!');
        return;
      }

      file = currentState.documents[currentState.documents.length - 1];
      moonPayService.uploadDocument(file, currentState.documentType, currentState.countryCode, currentState.side).then(
        function onSuccess() {
          // TODO: Update State to reflect success of document upload
          kycFlowService.goNext(currentState);
        },
        function onError(err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to upload image. Please try again.'));
        });
    }

    function onRetry() {
      // TODO: Update state service
      kycFlowService.goBack();
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_document_capture_screen_close' ,[], ['leanplum']);
    }
  }
})();
