'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWelcomeController', buyBitcoinWelcomeController);

  function buyBitcoinWelcomeController(
    bitAnalyticsService,
    gettextCatalog,
    $ionicHistory,
    $log,
    moonPayService,
    ongoingProcess,
    popupService,
    $scope,
    $state
  ) {
    var vm = this;

    // Functions
    vm.preAuthenticateCustomer = preAuthenticateCustomer;
    vm.authenticateCustomer = authenticateCustomer;

    function initVariables() {
      vm.securityCodeMode = false;
      vm.email = '';
      vm.securityCode = '';
    }

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", onBeforeLeave);

    function preAuthenticateCustomer() {
      $log.debug('preAuthenticateCustomer() with email: ' + vm.email);
      bitAnalyticsService.postEvent('buy_bitcoin_welcome_screen_tap_on_get_started' ,[{}, {}, {}], ['leanplum']);

      if (!vm.email) {
        var title = gettextCatalog.getString('Unable to Create Customer');
        var message = gettextCatalog.getString('Enter a valid email address.');
        popupService.showAlert(title, message);
        return;
      }

      ongoingProcess.set('creatingCustomerId', true);

      moonPayService.preAuthenticateCustomer(vm.email).then(

        function onPreAuthenticateCustomerSuccess(customer) {
          console.log('Created customer.', customer);
          ongoingProcess.set('creatingCustomerId', false);
          vm.securityCodeMode = true;
        },

        function onPreAuthenticateCustomerError(err) {
          console.error('Error pre-authenticating customer.', err);
          ongoingProcess.set('creatingCustomerId', false);

          var title = gettextCatalog.getString('Error Creating Customer');
          var message = err.message || '';
          popupService.showAlert(title, message);
        }
      );

    }

    function authenticateCustomer() {
      $log.debug('authenticateCustomer() with email: ' + vm.email + 'and security code: ' + vm.securityCode);
      bitAnalyticsService.postEvent('buy_bitcoin_welcome_screen_tap_on_get_started' ,[{}, {}, {}], ['leanplum']);

      if (!vm.securityCode) {
        var title = gettextCatalog.getString('Unable to Verify Email');
        var message = gettextCatalog.getString('Enter a valid security code.');
        popupService.showAlert(title, message);
        return;
      }

      ongoingProcess.set('verifyingEmail', true);

      moonPayService.authenticateCustomer(vm.email, vm.securityCode).then(

        function onAuthenticateCustomerSuccess(customer) {
          console.log('Email verified.', customer);
          ongoingProcess.set('verifyingEmail', false);
          $ionicHistory.clearHistory();
          $state.go('tabs.home').then(function () {
            $ionicHistory.clearHistory();
            $state.go('tabs.buybitcoin');
          }); 
        },

        function onAuthenticateCustomerError(err) {
          console.error('Error authenticating customer.', err);
          ongoingProcess.set('verifyingEmail', false);

          var title = gettextCatalog.getString('Error Verifying Email');
          var message = err.message || '';
          popupService.showAlert(title, message);
        }
      );

    }

    function onBeforeEnter(event, data) {
      initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_welcome_screen_open' ,[{}, {}, {}], ['leanplum']);
    }

    function onBeforeLeave(event, data) {
      bitAnalyticsService.postEvent('buy_bitcoin_welcome_screen_close' ,[{}, {}, {}], ['leanplum']);
    }
  }


})();
