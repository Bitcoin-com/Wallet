'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController($scope) {
    var vm = this;

    // Functions
    vm.addCard = addCard;
    vm.choice = 'B';
    vm.selectPaymentMethod = selectPaymentMethod;

    // Variables
    vm.defaultPaymentMethod = '••• 2244';
    vm.paymentMethods = [
      {
        name: 'Visa',
        partialCardNumber: '••• 2244',
        expiryDate: '12/21'
      },
      {
        name: 'Visa',
        partialCardNumber: '••• 2144',
        expiryDate: '08/17',
        isDefault: true
      },
      {
        name: 'Mastercard',
        partialCardNumber: '••• 8743',
        expiryDate: '09/22'
      }
    ];

    function addCard() {
      console.log('addCard()');
    }

    function _initVariables() { 
    }

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);
    

    function _onBeforeEnter(event, data) {
      _initVariables();
    }


    function selectPaymentMethod(pm) {
      console.log('selectPaymentMethod');
    }
  }


})();
