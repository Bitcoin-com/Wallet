'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycStatusController',
  buyBitcoinKycStatusController);

  function buyBitcoinKycStatusController(
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
    vm.onRetry = onRetry;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.titleLabel = gettextCatalog.getString('Passport'); // TODO: Add logic to describe other cases
    }

    function onOkay() {
      kycFlowService.exit();
    }

    function onRetry() {
      // TODO: Update state service to do retry flow
      kycFlowService.goNext(currentState);
    }

    function goBack() {
      kycFlowService.exit();
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
