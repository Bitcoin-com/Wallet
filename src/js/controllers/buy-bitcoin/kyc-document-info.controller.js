'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycDocumentInfoController', buyBitcoinKycDocumentInfoController);

  function buyBitcoinKycDocumentInfoController(
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
    var vm = this;
    vm.countriesAreLoading = true;
    vm.country = '';
    vm.documentType = '';

    // Functions
    vm.onCountrySelect = onCountrySelect;
    vm.onStartPhotograph = onStartPhotograph;

    vm.supportedDocumentLabels = {
      'passport': gettextCatalog.getString('Passport')
      ,'national_identity_card': gettextCatalog.getString('National ID')
      ,'driving_licence': gettextCatalog.getString('Driving License') // Check if Typo from Documentation persists
    }

    var currentState = {};

    function _initVariables() {
      vm.email = '';
      vm.countries = [];
      

      // Fetch Countries and Documents
      moonPayService.getAllCountries().then(
        function onGetAllCountriesSuccess(countries) {
          vm.countries = countries;
          vm.countriesAreLoading = false;
        },
        function onGetAllCountriesError(err) {
          console.log('Failed to get countries.', err);
          vm.countriesAreLoading = false;
        }
      );

      currentState = kycFlowService.getCurrentStateClone();
      console.log("Document Info - Current State: ", currentState);
      // Apply current State
      vm.country = currentState.countryCode;
      vm.documentType = currentState.documentType;

    }

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function onCountrySelect() {
      if(!vm.country) {
        vm.supportedDocuments = [];
        vm.documentType = '';
        return;
      }
      
      // Set document Types
      for(var i=0; i < vm.countries.length; i++) {
        if( vm.countries[i]['alpha3'] === vm.country ) {
          vm.supportedDocuments = vm.countries[i]['supportedDocuments'];
          if (vm.supportedDocuments.indexOf(vm.documentType) < 0) {
            vm.documentType = vm.supportedDocuments[0];
          }
          break;
        }
      }
    }

    function onStartPhotograph() {
      if (!vm.country || !vm.documentType) {
        console.log('Form incomplete.');
        return;
      }
      // Save current state
      currentState.countryCode = vm.country;
      currentState.documentType = vm.documentType;
      kycFlowService.goNext(currentState);
    }

    function onBeforeEnter(event, data) {
      if (data.direction == "back") {
        kycFlowService.popState();
      }
      
      _initVariables();

      bitAnalyticsService.postEvent('buy_bitcoin_document_info_screen_open' ,[{}, {}, {}], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_document_info_screen_close' ,[{}, {}, {}], ['leanplum']);
    }
  }
})();
