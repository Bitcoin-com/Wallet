'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinHomeController', buyBitcoinHomeController);

  function buyBitcoinHomeController(
    bitAnalyticsService
    , $filter
    , gettextCatalog
    , $ionicHistory 
    , kycFlowService
    , moonPayService
    , popupService
    , $scope
    , $state
    , $window
    ) {

    var vm = this;

    // Functions
    vm.didPushBuyInstantly = didPushBuyInstantly;
    vm.onVerificationSelect = onVerificationSelect;

    function _initVariables() {
      vm.dailyRemaining = '-';
      vm.monthlyRemaining = '-';

      vm.privacyPolicy = 'tabs.buybitcoin-privacypolicy'
      vm.termsOfService = 'tabs.buybitcoin-tos'
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _getAndPopulateCustomerInfo() {
      moonPayService.getCustomer().then(
        function onGetCustomerSuccess(customer) {
          if (customer) {
            console.log('Moonpay customer:', customer);
            vm.dailyRemaining = $filter('currency')(customer.dailyLimit, '€', 2);
            vm.monthlyRemaining = $filter('currency')(customer.monthlyLimit, '€', 2);
            bitAnalyticsService.setUserAttributes({
              'email': customer.email
            });
          } else {
            $state.go('tabs.buybitcoin-welcome');
            var title = gettextCatalog.getString("Error Getting Customer Information");
            var message = gettextCatalog.getString("Customer information was missing.");
            popupService.showAlert(title, message, function onAlert(){
              _goBack();
            });
          }
        },
        function onGetCustomerError(err) {
          var title = gettextCatalog.getString("Error Getting Customer Information");
          var message = err.message || gettextCatalog.getString("An error occurred when getting your customer information.");
          popupService.showAlert(title, message, function onAlert(){
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
          popupService.showAlert(title, message, function onAlert(){
            _goBack();
          });
          
        }
      );
      bitAnalyticsService.postEvent('buy_bitcoin_screen_open', [{}, {}, {}], ['leanplum']);
    }

    function didPushBuyInstantly() {
      $state.go('tabs.buybitcoin-amount');
    }

    function onVerificationSelect() {
      kycFlowService.start();
    }
  }


})();
