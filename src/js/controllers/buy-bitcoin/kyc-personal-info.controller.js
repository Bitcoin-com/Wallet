'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycPersonalInfoController',
  buyBitcoinKycPersonalInfoController);

  function buyBitcoinKycPersonalInfoController(
    bitAnalyticsService
    , gettextCatalog
    , $ionicHistory
    , $log
    , kycFlowService
    , moonPayService
    , ongoingProcess
    , popupService
    , $scope
  ) {
    var currentState = {};
    var vm = this;

    vm.firstName = '';
    vm.lastName = '';
    vm.dob = '';
    vm.buildingNumber = '';
    vm.streetAddress = '';
    vm.city = '';
    vm.postal = '';
    vm.country = '';

    // Functions
    vm.goBack = goBack;
    vm.onNext = onNext;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _validateAllFields() {

    }

    function _initVariables() {
      vm.email = '';
      vm.countries = [];
      currentState = kycFlowService.getCurrentStateClone();
    }

    function onNext() {
      if (!_validateAllFields()) {
        console.log('Form incomplete.');
        return;
      }
      // Save current state
      currentState.countryCode = vm.country;
      currentState.documentType = vm.documentType;
      kycFlowService.nextGo(currentState);
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_personal_info_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_ersonal_info_screen_close' ,[], ['leanplum']);
    }
  }
})();
