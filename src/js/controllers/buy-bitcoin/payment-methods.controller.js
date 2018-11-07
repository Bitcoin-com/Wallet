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
    
    // Variables
    vm.paymentMethod = null;
    vm.paymentMethods = [];

    var initialPaymentMethod = null;

    function addPaymentMethod() {
      $state.go('tabs.buybitcoin-add-card-form');
    }

    function _initVariables() {
      
      // Get the default payment from moon pay service
      // Here
      // Update the default payment somewhere else by watching the defaultPayment variable.
      
      moonPayService.getCards().then(function(cards) {
        vm.paymentMethods = cards;
        moonPayService.getDefaultCardId().then(
          function onGetDefaultCardIdSuccess(cardId) {
            if (cardId == null && cards && cards.length > 0) {
              vm.paymentMethod = cards[0];
              moonPayService.setDefaultCardId(cards[0].id);
            } else {
              for (var i=0; i<cards.length; ++i) {
                if (cards[i].id == cardId) {
                  vm.paymentMethod = cards[i].id;
                  break;
                }
              }
            }
            initialPaymentMethod = vm.paymentMethod
          }
        );
      });
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = initialPaymentMethod !== vm.paymentMethod;
      if (defaultWasChanged) {
        moonPayService.setDefaultCardId(vm.paymentMethod)
      }
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
    }

  }


})();
