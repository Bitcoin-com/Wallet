'use strict';

(function () {

  angular
    .module('bitcoincom.controllers')
    .controller('buyBitcoinHomeController', buyBitcoinHomeController);

  function buyBitcoinHomeController(
    bitAnalyticsService
    , gettextCatalog
    , $ionicHistory
    , externalLinkService
    , kycFlowService
    , moonPayService
    , ongoingProcess
    , popupService
    , $scope
    , $state
    , $window
  ) {

    var vm = this;

    // Functions
    vm.didPushBuyInstantly = didPushBuyInstantly;
    vm.onPrivacyPolicy = onPrivacyPolicy;
    vm.onTermsOfUse = onTermsOfUse;
    vm.onBuyWithoutFees = onBuyWithoutFees;
    vm.onVerificationSelect = onVerificationSelect;
    vm.goBack = goBack;
    

    function _initVariables() {
      vm.customer = null;
      vm.identityCheck = null;
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _getAndPopulateCustomerInfo() {
      ongoingProcess.set('loadingProfile', true);

      Promise.all([moonPayService.getCustomer(), moonPayService.getIdentityCheck()]).then(
        function onGetCustomerInfoSuccess(customerInfo) {
          var customer = customerInfo[0];
          var identityCheck = customerInfo[1];

          ongoingProcess.set('loadingProfile', false);

          console.log('Moonpay customer:', customer, ' identity check:', identityCheck);

          if (!customer) {
            $state.go('tabs.buybitcoin-welcome');
            var title = gettextCatalog.getString("Error Getting Customer Information");
            var message = gettextCatalog.getString("Customer information was missing.");
            popupService.showAlert(title, message, function onAlert() {
              goBack();
            });
            return;
          }

          vm.customer = customer;
          vm.identityCheck = identityCheck;
          // vm.dailyRemaining = $filter('currency')(customer.dailyLimit, '€', 2);
          // vm.monthlyRemaining = $filter('currency')(customer.monthlyLimit, '€', 2);
          bitAnalyticsService.setUserAttributes({
            'email': customer.email
          });
        },
        function onGetCustomerInfoError(err) {
          ongoingProcess.set('loadingProfile', false);
          var title = gettextCatalog.getString("Error Getting Customer Information");
          var message = err.message || gettextCatalog.getString("An error occurred when getting your customer information.");
          popupService.showAlert(title, message, function onAlert() {
            goBack();
          });
        }
      );
    }

    function goBack() {
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
      bitAnalyticsService.postEvent('buy_bitcoin_screen_close', [{}, {}, {}], ['leanplum']);
    }

    function _onBeforeEnter(event, data) {
      if ($window.StatusBar) {
        $window.StatusBar.styleDefault();
        $window.StatusBar.backgroundColorByHexString('#FBFCFF');
      }

      _initVariables();

      moonPayService.getCustomerId().then(
        function onCustomerIdSuccess(customerId) {
          console.log('moonpay onCustomerIdSuccess with: ' + customerId);
          if (customerId) {
            console.log('Found customer ID: ' + customerId);
            _getAndPopulateCustomerInfo();
          } else {
            console.log('No customer ID.');
            $state.go('tabs.buybitcoin-welcome');
          }
        },
        function onCustomerIdError(err) {
          var title = gettextCatalog.getString("Error Getting Customer ID");
          var message = err.message || gettextCatalog.getString("An error occurred when getting your customer information.");
          popupService.showAlert(title, message, function onAlert() {
            _goBack();
          });

        }
      );
      bitAnalyticsService.postEvent('buy_bitcoin_screen_open', [{}, {}, {}], ['leanplum']);
    }

    function didPushBuyInstantly() {
      $state.go('tabs.buybitcoin-amount', { 
        coin: 'bch'
      });
    }

    function onPrivacyPolicy() {
      externalLinkService.open('https://www.moonpay.io/privacy_policy?mobile=true', false);
    }

    function onTermsOfUse() {
      externalLinkService.open('https://www.moonpay.io/terms_of_use?mobile=true', false);
    }

    function onBuyWithoutFees() {
      externalLinkService.open('https://local.bitcoin.com/r/walletapp', false);
    }

    function onVerificationSelect() {
      kycFlowService.start();
    }
  }


})();
