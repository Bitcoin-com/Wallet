'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinHomeController', buyBitcoinHomeController);

  function buyBitcoinHomeController(
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
    vm.getStarted = getStarted;
    vm.goBack = goBack;
    vm.onBuyInstantly = onBuyInstantly;

    // Functions - Short because the appear in translatable strings
    vm.onPp = onPrivacyPolicy;
    vm.onTos = onTermsOfService;

    function _initVariables() {
      console.log('home _initVariables()');
      vm.purchasedAmount = '$100';
      vm.weeklyLimit = '$1000';

      vm.privacyPolicy = 'tabs.buybitcoin-privacypolicy'
      vm.termsOfService = 'tabs.buybitcoin-tos'
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);


    function getStarted() {
      $log.debug('getStarted() with email: ' + vm.email);

    }

    function goBack() {
    }

    

    function _onBeforeEnter(event, data) {
      _initVariables();

      //$state.go('tabs.buybitcoin-welcome');
      //return;

      moonPayService.getCustomerId().then(
        function onCustomerIdSuccess(customerId) {
          console.log('moonpay onCustomerIdSuccess with: 1 ' + customerId);
          if (customerId) {
            console.log('Found customer ID: ' + customerId);
          } else {
            console.log('No customer ID.');
            $state.go('tabs.buybitcoin-welcome');
          }
        },
        function onCustomerIdError(err) {
          console.error('Error getting Moonpay customer ID.', err);
          // Put up an alert, or get a new one?
          
        }
      );
      
    }

    function onBuyInstantly() {
      // TODO: Check if have a payment method set up etc
      $state.go('tabs.buybitcoin-amount');
    }

    function onPrivacyPolicy() {
      console.log('pp');
    }

    function onTermsOfService() {
      console.log('tos');
    }
  }


})();
