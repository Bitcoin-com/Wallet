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

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.statusTitle = gettextCatalog.getString('Pending');

      // Identity Check Status
      if(!currentState.status) {
        // Do Submit to Moonpay
        var taskList = [];

        // Update Customer
        var updatedCustomer = {
          firstName: currentState.firstName,
          lastName: currentState.lastName,
          dateOfBirth: moment(currentState.dob, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          address: {
            street: currentState.streetAddress1,
            substreet: currentState.streetAddress2,
            town: currentState.city,
            postCode: currentState.postalCode,
            country: currentState.country
          }
        };
        taskList.push(moonPayService.updateCustomer(updatedCustomer));

        // Upload documents
        currentState.documents.forEach(function(imageFile, index) {
          var package = {
            file: imageFile,
            type: currentState.documentType,
            country: currentState.countryCode,
            side: index === 0 ? 'front' : 'back'
          };
          taskList.push(moonPayService.uploadFile(package));
        });

        Promise.all(taskList).then(function(results) {
          moonPayService.getIdentityCheck().then(function onSuccess(response) {
            updateStatusUi(response)
          }).catch(function onError(error) {
            // Activate Retry Button  
          });
        }).catch(function(errors) {
          console.log();
          // Activate Retry Button
        });
      } else {
        moonPayService.getIdentityCheck().then(function onSuccess(response) {
          updateStatusUi(response)
        }).catch(function onError(error) {
          // Activate Retry Button  
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
      kycFlowService.exit();
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
