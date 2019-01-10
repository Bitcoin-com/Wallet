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
    vm.goNext = goNext;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _validateAllFields() {
      return _validateAge() 
      && vm.firstName
      && vm.lastName
      && vm.streetAddress1
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
      console.log('buyBitcoinKycPersonalInfoController onBeforeEnter after back kycflow', currentState);

      vm.firstName = currentState.firstName ? currentState.firstName : 'Satoshi';
      vm.lastName = currentState.lastName ? currentState.lastName : 'Nakamoto';
      vm.dob = currentState.dob ? currentState.dob : '10/12/1990';
      vm.streetAddress1 = currentState.streetAddress1 ? currentState.streetAddress1 : '123 Maple street';
      vm.streetAddress2 = currentState.streetAddress2 ? currentState.streetAddress2 : '';
      vm.city = currentState.city ? currentState.city : 'Tokyo'; 
      vm.postalCode = currentState.postalCode ? currentState.postalCode : '1234';
      vm.country = currentState.country ? currentState.country : '';

      vm.countries = [];
      vm.countriesAreLoading = true;

      // Fetch Countries and Documents
      console.log('Fetching Countries!');
      moonPayService.getAllCountries().then(
        function onGetAllCountriesSuccess(countries) {
          vm.countries = countries;
          vm.countriesAreLoading = false;
          console.log('Fetching Countries - SUCCESS!');
          console.log(countries);
        },
        function onGetAllCountriesError(err) {
          console.log('Failed to get countries.', err);
          vm.countriesAreLoading = false;
        }
      );
    }

    function goNext() {
      vm.submitted = true;
      if (!_validateAllFields()) {
        $log.debug('Form incomplete.');
        return;
      }
      // Save current state
      currentState.firstName = vm.firstName
      currentState.lastName = vm.lastName
      currentState.dob = vm.dob
      currentState.streetAddress1 = vm.streetAddress1
      currentState.streetAddress2 = vm.streetAddress2
      currentState.city = vm.city
      currentState.postalCode = vm.postalCode
      currentState.country = vm.country;
      
      moonPayService.getCustomer().then(
        function onGetCustomerSuccess(customer) {
          if (customer) {

            // Update Customer
            customer.firstName = vm.firstName
            customer.lastName = vm.lastName
            customer.dateOfBirth = moment(vm.dob, 'DD/MM/YYY').format('YYYY-MM-DD')
            customer.address = {
              'street': vm.streetAddress1
              , 'subStreet': vm.streetAddress2
              , 'town': vm.city
              , 'postCode': vm.postalCode
              , 'country': vm.country
            }

            ongoingProcess.set('submitingKycInfo', true);
            moonPayService.updateCustomer(customer).then( 
              function onUpdateSuccess() {
                ongoingProcess.set('submitingKycInfo', false);
                kycFlowService.goNext(currentState);
            }, 
              function onUpdateError(err) {
                ongoingProcess.set('submitingKycInfo', false);
                popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'));
            });
          } else {
            ongoingProcess.set('submitingKycInfo', false);
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to get the customer. Please try again.'));
          }
        }, function onGetCustomerError(err) {
          ongoingProcess.set('submitingKycInfo', false);
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to get the customer. Please try again.'));
        }
      );
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      if (data.direction == "back") {
        kycFlowService.popState();
      }
      
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_personal_info_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_personal_info_screen_close' ,[], ['leanplum']);
    }
  }
})();
