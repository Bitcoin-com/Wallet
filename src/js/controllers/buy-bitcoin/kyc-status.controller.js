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
    , kycFlowService
    , $log
    , moonPayService
    , ongoingProcess
    , popupService
    , $scope
    , $timeout
  ) {
    var currentState = {};
    var vm = this;

    // Variables
    vm.statusTitle = gettextCatalog.getString("You're Being Verified");
    vm.description = gettextCatalog.getString("This shouldn't take too long. We'll let you know soon so you can get started buying bitcoin.");
    vm.graphicUri = "img/buy-bitcoin/processing.png"
    vm.showStatus = false;
    vm.showRetry = false;

    // Functions
    vm.goBack = goBack;
    vm.onRetry = onRetry;

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function _initVariables() {
      vm.files = [];

      currentState = kycFlowService.getCurrentStateClone();

      // Title Label
      vm.statusTitle = gettextCatalog.getString('Pending');

      // Identity Check Status
      if(!currentState.status) {
        // Do Submit to Moonpay
        ongoingProcess.set('submitingKycInfo', true);

        // Block All for Completion
        Promise.all(currentState.documents.map(function(imageFile, index) {
          if (index === currentState.documents.length - 1) {
            return moonPayService.uploadFile(imageFile, 'selfie', currentState.countryCode, null);
          }

          return moonPayService.uploadFile(imageFile, currentState.documentType, currentState.countryCode, index === 0 ? 'front' : 'back');
        })).then(function onTaskListSuccess() {
          return moonPayService.createIdentityCheck();
        })
        .then(function onSuccess(response) {
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

          ongoingProcess.set('submitingKycInfo', false);
        }, function onCreateIdentityFail(error) {
          console.log('Moonpay API Errors:', error);
          // Activate Retry Button
          ongoingProcess.set('submitingKycInfo', false);
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to submit information. Please try again.'), function() {
            $ionicHistory.goBack();
          });
        });
      } else {
        ongoingProcess.set('fetchingKycStatus', true);
        moonPayService.getIdentityCheck().then(function onSuccess(response) {
          updateStatusUi(response);

          if (response.status === 'completed' && response.result === 'rejected') {
            moonPayService.getFiles().then(function onFilesSuccess(files) {
              console.log('files', files);
              $timeout(function onTimeout() {
                vm.files = files;
              }, 0);
              ongoingProcess.set('fetchingKycStatus', false);
            },
            function onFilesError(err) {
              $log.error(err);
              // Activate Retry Button  
              ongoingProcess.set('fetchingKycStatus', false);
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to get information. Please try again.'), function() {
                $ionicHistory.goBack();
              });
            });
          }
          ongoingProcess.set('fetchingKycStatus', false);
        }, function onIdentityCheckError(err) {
          ongoingProcess.set('fetchingKycStatus', false);
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to get information. Please try again.'), function() {
            $ionicHistory.goBack();
          });
        })
      }
    }

    function updateStatusUi(response) {
      var statusType;
      var rejectType;
      if(response.status === 'completed') {
        statusType = response.result === 'clear' ? 'accepted' : 'rejected';
        rejectType = response.rejectType;
      }
      switch(statusType) {
        case 'accepted':
          vm.statusTitle = gettextCatalog.getString("You're Verified!");
          vm.description = gettextCatalog.getString("Your account is now verified. Congrats!");
          vm.graphicUri = "img/buy-bitcoin/verified.png";
          break;
        case 'rejected':
          vm.statusTitle = gettextCatalog.getString('Verification Failed');
          vm.description = gettextCatalog.getString("We're sorry but we're not able to verify you at this time.");
          vm.graphicUri = "img/buy-bitcoin/failed.png";
          if(rejectType === 'retry') {
            vm.showRetry = true;
          }
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

    function onRetry() {
      kycFlowService.retry();
    }
  }
})();
