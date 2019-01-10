'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinKycStatusController',
  buyBitcoinKycStatusController);

  function buyBitcoinKycStatusController(
    bitAnalyticsService
    , gettextCatalog
    , kycFlowService
    , moonPayService
    , moment
    , ongoingProcess
    , popupService
    , $scope
  ) {
    var currentState = {};
    var vm = this;

    // Functions
    vm.goBack = goBack;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.statusTitle = gettextCatalog.getString('Pending');

      // Identity Check Status
      if(!currentState.status) {
        // Do Submit to Moonpay
        ongoingProcess.set('submitingKycInfo', true);
        moonPayService.getCustomer().then(function onGetCustomerSuccess(customer) {
          var taskList = [];
          // Update Customer
          customer.firstName = currentState.firstName
          customer.lastName = currentState.lastName
          customer.dateOfBirth = moment(currentState.dob, 'DD/MM/YYY').format('YYYY-MM-DD')
          customer.address = {
            'street': currentState.streetAddress1
            , 'town': currentState.city
            , 'postCode': currentState.postalCode
            , 'country': currentState.country
          }
          if (currentState.streetAddress2) {
            customer.address.subStreet = currentState.streetAddress2;
          }
          taskList.push(moonPayService.updateCustomer(customer));
          
          // Upload documents
          currentState.documents.forEach(function(imageFile, index) {
            taskList.push(moonPayService.uploadFile(imageFile, currentState.documentType, currentState.countryCode, index === 0 ? 'front' : 'back'));
          });

          // Block All for Completion
          Promise.all(taskList).then(function onTaskListSuccess(results) {
            moonPayService.getIdentityCheck().then(function onSuccess(response) {
              updateStatusUi(response);
            }).catch(function onError(error) {
              // Activate Retry Button 
              console.log('Moonpay API Errors:', error);
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'));
            }).finally(function onComplete() {
              ongoingProcess.set('submitingKycInfo', false);
            });
          }).catch(function(error) {
            console.log('Moonpay API Errors:', error);
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'));
            // Activate Retry Button
            // TODO: Add Back button logic to popup
            ongoingProcess.set('submitingKycInfo', false);
          });
        })
      } else {
        ongoingProcess.set('fetchingKycStatus', true);
        moonPayService.getIdentityCheck().then(function onSuccess(response) {
          updateStatusUi(response);
          ongoingProcess.set('fetchingKycStatus', false);
        }).catch(function onError(error) {
          // Activate Retry Button  
          ongoingProcess.set('fetchingKycStatus', false);
        });
      }
    }

    function updateStatusUi(response) {
      var statusType;
      if(response.status === 'completed') {
        statusType = response.result === 'clear' ? 'accepted' : 'rejected';
      }
      switch(statusType) {
        case 'accepted':
          vm.statusTitle = gettextCatalog.getString('Verified');
          vm.description = gettextCatalog.getString('Your account has been successfully verified.');
        break;
        case 'rejected':
          vm.statusTitle = gettextCatalog.getString('Rejected');
          vm.description = gettextCatalog.getString('Your verification was denied. Please contact support for additional assistance.');
        break;
        default:
          vm.statusTitle = gettextCatalog.getString('Pending');
          vm.description = gettextCatalog.getString('Your account is currently being verified. This process may take up to 3 business days.');
        break;
      }
    }

    function goBack() {
      kycFlowService.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_kyc_status_screen_open' ,[], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_kyc_status_screen_close' ,[], ['leanplum']);
    }
  }
})();
