'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinHomeController', buyBitcoinHomeController);

  function buyBitcoinHomeController(
    gettextCatalog, 
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

      moonPayService.getCustomerId().then(
        function onCustomerIdSuccess(customer) {
          if (customer && customer.id) {
            console.log('Found customer ID: ' + customer.id);
          } else {
            console.log('No customer ID.');
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
  }


})();
