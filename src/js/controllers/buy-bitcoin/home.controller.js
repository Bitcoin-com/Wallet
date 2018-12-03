'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinHomeController', buyBitcoinHomeController);

  function buyBitcoinHomeController(
    bitAnalyticsService,
    $filter,
    gettextCatalog,
    $ionicHistory, 
    $log, 
    moonPayService,
    popupService, 
    $scope, 
    $state
    ) {

    var vm = this;

    // Functions
    vm.didPushBuyInstantly = didPushBuyInstantly;

    function _initVariables() {
      vm.monthlyLimit = '-';
      vm.monthlyPurchased = '-';

      vm.privacyPolicy = 'tabs.buybitcoin-privacypolicy'
      vm.termsOfService = 'tabs.buybitcoin-tos'
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _getAndPopulateCustomerInfo() {
      moonPayService.getCustomer().then(
        function onGetCustomerSuccess(customer) {
          if (customer) {
            console.log('Moonpay customer:', customer);
            var monthlyPurchased = 0; // TODO: How to get this information?
            vm.monthlyPurchased = $filter('currency')(monthlyPurchased, '$', 2)
            vm.monthlyLimit = $filter('currency')(customer.monthlyLimit, '$', 2)
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
      bitAnalyticsService.postEvent('buy_bitcoin_screen_close', [], ['leanplum']);
      $ionicHistory.goBack();
    }

    function _onBeforeEnter(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_screen_open', [], ['leanplum']);
      _initVariables();

      //$state.go('tabs.buybitcoin-welcome');
      //return;

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
      
    }

    function didPushBuyInstantly() {
      $state.go('tabs.buybitcoin-amount');
    }
  }


})();
