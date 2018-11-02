'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController($scope) {
    var vm = this;

    // Functions
    vm.addPaymentMethod = addPaymentMethod;
    vm.getIconPathFromName = getIconPathFromName;
    
    
    // Variables
    vm.defaultPaymentMethod = 'abc';

    vm.paymentMethods = [
      {
        id: 'abc',
        name: 'Visa',
        partialCardNumber: '••• 2244',
        expiryDate: '12/21'
      },
      {
        id: 'def',
        name: 'Visa',
        partialCardNumber: '••• 2144',
        expiryDate: '08/17',
        isDefault: true
      },
      {
        id: 'ghi',
        name: 'Mastercard',
        partialCardNumber: '••• 8743',
        expiryDate: '09/22'
      }
    ];

    var initialDefaultPaymentMethod = '';

    function addPaymentMethod() {
      console.log('addPaymentMethod()');
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
      vm.defaultPaymentMethod = 'def';
      initialDefaultPaymentMethod = vm.defaultPaymentMethod;
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
