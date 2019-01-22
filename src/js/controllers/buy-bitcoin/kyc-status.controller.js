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
    , $ionicHistory
  ) {
    var currentState = {};
    var vm = this;

    // Variables
    vm.statusTitle = gettextCatalog.getString("You're Being Verified");
    vm.description = gettextCatalog.getString("This shouldn't take too long. We'll let you know soon so you can get started buying bitcoin.");
    vm.graphicUri = "img/buy-bitcoin/processing.svg"
    vm.showStatus = false;

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
          customer.dateOfBirth = moment(currentState.dob, 'DDMMYYY').format('YYYY-MM-DD')
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
            if( index === currentState.documents.length-1) {
              taskList.push(moonPayService.uploadFile(imageFile, 'selfie', currentState.countryCode, null));
            }
            taskList.push(moonPayService.uploadFile(imageFile, currentState.documentType, currentState.countryCode, index === 0 ? 'front' : 'back'));
          });

          // Block All for Completion
          Promise.all(taskList).then(function onTaskListSuccess(results) {
            moonPayService.createIdentityCheck().then(function onSuccess(response) {
              
              try {
                // Clean history
                var historyId = $ionicHistory.currentHistoryId();
                var history = $ionicHistory.viewHistory().histories[historyId];
                for (var i = history.stack.length - 1; i >= 0; i--){
                  if (history.stack[i].stateName == 'tabs.buybitcoin'){
                    $ionicHistory.backView(history.stack[i]);
                  }
                }
              } catch (err) {
                console.log(err);
              }

              updateStatusUi(response);
            }).catch(function onError(error) {
              // Activate Retry Button 
              console.log('Moonpay API Errors:', error);
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'), function() {
                $ionicHistory.goBack();
              });
            }).finally(function onComplete() {
              ongoingProcess.set('submitingKycInfo', false);
            });
          }).catch(function(error) {
            console.log('Moonpay API Errors:', error);
            // Activate Retry Button
            ongoingProcess.set('submitingKycInfo', false);
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'), function() {
              $ionicHistory.goBack();
            });
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
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to get information. Please try again.'), function() {
            $ionicHistory.goBack();
          });
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
          vm.statusTitle = gettextCatalog.getString("You're Verified!");
          vm.description = gettextCatalog.getString("Your account is now verified. Congrats!");
          vm.graphicUri = "img/buy-bitcoin/verified.svg"
          break;
        case 'rejected':
          vm.statusTitle = gettextCatalog.getString('Verification Failed');
          vm.description = gettextCatalog.getString("We're sorry but we're not able to verify you at this time. Please contact support for additional assistance.");
          vm.graphicUri = "img/buy-bitcoin/failed.svg"
          break;
        default:
          break;
      }
      vm.showStatus = true;
    }

    function goBack() {
      $ionicHistory.goBack();
    }

    function onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_kyc_status_screen_open' ,[{}, {}, {}], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_kyc_status_screen_close' ,[{}, {}, {}], ['leanplum']);
    }
  }
})();
