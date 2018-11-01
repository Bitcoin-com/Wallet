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

    function _initVariables() {
      
    }

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);


    function getStarted() {
      $log.debug('getStarted() with email: ' + vm.email);

    }

    function goBack() {
    }

    

    function _onBeforeEnter(event, data) {
      _initVariables();

      console.log('Getting customer ID...');

      $state.go('tabs.buybitcoin-welcome');

      /*
      moonPayService.getCustomerId().then(
        function onCustomerIdSuccess(customer) {
          console.log('moonpay onCustomerIdSuccess with: ' + customer);
          if (customer && customer.id) {
            console.log('Found customer ID: ' + customer.id);
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
      */
    }

    function onBuyInstantly() {
      // TODO: Check if have a payment method set up etc
      $state.go('tabs.buybitcoin-amount');
    }
  }


})();
