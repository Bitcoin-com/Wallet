'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController(
    moonPayService
    , $scope, $state
  ) {
    var vm = this;

    // Functions
    vm.addPaymentMethod = addPaymentMethod;
    vm.getIconPathFromName = getIconPathFromName;
    
    
    // Variables
    vm.defaultPaymentMethod = 'abc';
    vm.paymentMethods = [];

    var initialDefaultPaymentMethod = '';

    function addPaymentMethod() {
      $state.go('tabs.buybitcoin-add-card-form');
    }

    function getIconPathFromName(name) {
      switch(name.toUpperCase()) {
        case "VISA": 
          return "img/buy-bitcoin/icon-visa.svg"
        case "MASTERCARD": 
          return "img/buy-bitcoin/icon-mastercard.svg"
        default:
          return "img/buy-bitcoin/icon-generic-card.svg";
      }
    }

    function _initVariables() {
      
      // Get the default payment from moon pay service
      // Here
      // Update the default payment somewhere else by watching the defaultPayment variable.
      
      moonPayService.getCards().then(function(cards) {
        vm.paymentMethods = cards;
      });
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = initialDefaultPaymentMethod !== vm.defaultPaymentMethod;
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
    }

  }


})();
