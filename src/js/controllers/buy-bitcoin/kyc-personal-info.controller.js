'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycPersonalInfoController',
  buyBitcoinKycPersonalInfoController);

  function buyBitcoinKycPersonalInfoController(
    bitAnalyticsService
    , gettextCatalog
    , $log
    , kycFlowService
    , moonPayService
    , popupService
    , moment
    , $scope
    , $ionicHistory
  ) {
    var vm = this;

    // Functions
    vm.goBack = goBack;
    vm.submitForm = submitForm;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _validateAllFields() {
      return _validateDate()
      && _validateAge() 
      && vm.firstName
      && vm.lastName
      && vm.streetAddress1
      && vm.city
      && vm.postalCode
      && vm.country
    }

    function _validateDate() {
      if(vm.dob.length === 10) {
        var split = vm.dob.split('/');
        var day = parseInt(split[0]);
        var month = parseInt(split[1]);
        var year = parseInt(split[2]);

        return (day > 0 &&
          day <= 31 &&
          month > 0 &&
          month <= 12 &&
          year > 0);
      }
      return false;
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

      vm.countries = [];
      // Fetch Countries and Documents
      moonPayService.getAllCountries(true).then(
        function onGetFormDataSuccess(countries) {
          vm.countries = countries;
          var state = kycFlowService.getCurrentStateClone();
          if (state) {
            vm.firstName = state.firstName || '';
            vm.lastName =  state.lastName || '';
            vm.dob = state.dob && moment(state.dob, 'DD/MM/YYYY').format('DD/MM/YYYY') || '';
            vm.streetAddress1 = state.streetAddress1 || '';
            vm.streetAddress2 = state.streetAddress2 || '';
            vm.city = state.city || '';
            vm.postalCode = state.postalCode || '';
            vm.country = state.country || '';
          }
        },
        function onGetFormDataError(err) {
          console.log('Failed to get form data.', err);
        }
      );
    }

    function submitForm() {
      vm.submitted = true;
      if (!_validateAllFields()) {
        $log.debug('Form incomplete.');
        return;
      }
      
      moonPayService.updateCustomer({
        firstName: vm.firstName,
        lastName: vm.lastName,
        dateOfBirth: moment(vm.dob, 'DDMMYYYY').format('YYYY-MM-DD'),
        address: {
          street: vm.streetAddress1,
          subStreet: vm.streetAddress2,
          town: vm.city,
          postCode: vm.postalCode,
          country: vm.country
        }
      }).then(
        function onSuccess() {
          var state = kycFlowService.getCurrentStateClone();
          state.kycIsSubmitted = true;
          kycFlowService.goNext(state);
        },
        function onError() {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'), function() {
            $ionicHistory.goBack();
          });
        }
      );
    }

    function goBack() {
      $ionicHistory.goBack();
    }

    function onBeforeEnter(event, data) {
      if (data.direction == "back") {
        kycFlowService.popState();
      }
      
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_personal_info_screen_open' ,[{}, {}, {}], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_personal_info_screen_close' ,[{}, {}, {}], ['leanplum']);
    }
  }
})();
