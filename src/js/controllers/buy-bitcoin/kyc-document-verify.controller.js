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
      vm.documentName = vm.supportedDocumentLabels[currentState.documentType];
      vm.titleLabel = vm.documentName + " " + (currentState.documents.length === 0 ? gettextCatalog.getString('Front') : gettextCatalog.getString('Back'));
      var documents = currentState.documents;
      if(documents.length > 0) {
        vm.photo = documents[documents.length-1];
      }
    }

    function onAccept() {
      currentState.inPreview = false;
      kycFlowService.goNext(currentState);
      _initVariables();
    }

    function onRetry() {
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
