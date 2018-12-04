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

    function _validateAllFields() {
      return _validateAge() 
      && vm.firstName
      && vm.lastName
      && vm.buildingNumber
      && vm.streetAddress
      && vm.city
      && vm.postalCode
    }

    function _validateAge() {
      if (vm.dob) {
        var dob = moment(vm.dob, 'DD/MM/YYYY');
        if (moment().diff(dob, 'years') >= 18) {
          return true
        }
      }
      console.log('Age is: ', moment().diff(dob, 'years'));
      return false;
    }

    function _initVariables() {

      vm.submitted = false;

      currentState = kycFlowService.getCurrentStateClone();

      vm.firstName = currentState.firstName ? currentState.firstName : '';
      vm.lastName = currentState.lastName ? currentState.lastName : '';
      vm.dob = currentState.dob ? currentState.dob : '';
      vm.buildingNumber = currentState.buildingNumber ? currentState.buildingNumber : '';
      vm.streetAddress = currentState.streetAddress ? currentState.streetAddress : '';
      vm.city = currentState.city ? currentState.city : ''; 
      vm.postalCode = currentState.postalCode ? currentState.postalCode : ''; ;
      vm.country = currentState.country ? currentState.country : '';
    }

    function onNext() {
      vm.submitted = true;
      if (!_validateAllFields()) {
        $log.debug('Form incomplete.');
        return;
      }
      // Save current state
      currentState.firstName = vm.firstName
      currentState.lastName = vm.lastName
      currentState.dob = vm.dob
      currentState.buildingNumber = vm.buildingNumber
      currentState.streetAddress = vm.streetAddress
      currentState.city = vm.city
      currentState.postalCode = vm.postalCode
      currentState.country = vm.country;

      kycFlowService.goNext(currentState);
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
