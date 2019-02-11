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
    vm.didPushContactSupport = didPushContactSupport;
    vm.onPrivacyPolicy = onPrivacyPolicy;
    vm.onTermsOfUse = onTermsOfUse;
    vm.onVerificationSelect = onVerificationSelect;
    

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
              _goBack();
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
            _goBack();
          });
        }
      );
    }

    function _goBack() {
      $ionicHistory.goBack();
      bitAnalyticsService.postEvent('buy_bitcoin_screen_close', [{}, {}, {}], ['leanplum']);
    }

    function _onBeforeEnter(event, data) {
      if ($window.StatusBar) {
        $window.StatusBar.styleDefault();
        $window.StatusBar.backgroundColorByHexString('#F0F0F0');
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

    function didPushContactSupport() {
      var url = 'https://www.bitcoin.com/wallet-support';
      var optIn = true;
      var title = null;
      var message = gettextCatalog.getString('Help and support information is available at the website.');
      var okText = gettextCatalog.getString('Open');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    }

    function didPushBuyInstantly() {
      $state.go('tabs.buybitcoin-amount');
    }

    function onPrivacyPolicy() {
      externalLinkService.open('https://www.moonpay.io/privacy_policy?mobile=true', false);
    }

    function onTermsOfUse() {
      externalLinkService.open('https://www.moonpay.io/terms_of_use?mobile=true', false);
    }

    function onVerificationSelect() {
      kycFlowService.start();
    }
  }


})();
