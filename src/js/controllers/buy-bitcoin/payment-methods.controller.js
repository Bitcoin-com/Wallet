'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController(
    moonPayService
    , gettextCatalog, popupService
    , $scope, $state, $ionicHistory
  ) {
    var vm = this;

    // Functions
    vm.addPaymentMethod = addPaymentMethod;
    vm.onEdit = onEdit;
    vm.onDone = onDone;

    // Variables
    vm.editing = false;
    vm.paymentMethod = null;
    vm.paymentMethods = [];
    vm.paymentMethodsAreLoading = true;

    var defaultCardId = '';
    var initialPaymentMethodId = '';

    function addPaymentMethod() {
      $state.go('tabs.buybitcoin-add-card-form');
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    $scope.$on('paymentMethodDelete', _paymentMethodDelete);

    function _initVariables() {
      
      // Get the default payment from moon pay service
      // Here
      // Update the default payment somewhere else by watching the defaultPayment variable.

      moonPayService.getCards().then(
        function onGetCardsSuccess(cards) {
        vm.paymentMethods = cards;
        moonPayService.getDefaultCardId().then(
          function onGetDefaultCardIdSuccess(cardId) {
            if (cardId == null && cards && cards.length > 0) {
              vm.paymentMethod = cards[0];
              defaultCardId = cards[0].id;
              moonPayService.setDefaultCardId(defaultCardId);
            } else {
              for (var i=0; i<cards.length; ++i) {
                if (cards[i].id == cardId) {
                  vm.paymentMethod = cards[i].id;
                  defaultCardId = cardId;
                  break;
                }
              }
            }
            initialPaymentMethodId = vm.paymentMethod.id
            vm.paymentMethodsAreLoading = false;
          },
          function onGetDefaultCardIdError() {
            vm.paymentMethodsAreLoading = false;
          }
        );
      },
      function onGetCardsError(err) {
        var title = gettextCatalog.getString('Error Getting Payment Methods');
        var message = err.message || gettextCatalog.getString('An error occurred when getting your payment methods.');
        var okText = gettextCatalog.getString('Go Back');
        popupService.showAlert(title, message, 
          function onAlertDismissed() {
            $ionicHistory.goBack();
          }, 
          okText
        );
        vm.paymentMethodsAreLoading = false;
      });
    }

   

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = vm.paymentMethod && initialPaymentMethodId !== vm.paymentMethod.id;
      if (defaultWasChanged) {
        moonPayService.setDefaultCardId(vm.paymentMethod.id)
      }
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
    }

    function onDone() {
      vm.editing = false;
    }

    function onEdit() {
      vm.editing = true;
    }

    function _paymentMethodDelete(event, data) {
      var deletedCardId = data.id;
      console.log('_paymentMethodDelete() with id: ' + deletedCardId);

      // Remove from scope variable first
      var deletedCardIndex = -1;
      var paymentMethodCount = vm.paymentMethods.length;
      for (var i = 0; i < paymentMethodCount; i++) {
        if (vm.paymentMethods[i].id === deletedCardId) {
          deletedCardIndex = i;
          break;
        }
      }

      if (deletedCardIndex >= 0) {
        vm.paymentMethods.splice(deletedCardIndex, 1);
      }

      if (deletedCardId === defaultCardId && vm.paymentMethods.length > 0) {
        defaultCardId = vm.paymentMethods[0].id;
        moonPayService.setDefaultCardId(defaultCardId);
        vm.paymentMethod = vm.paymentMethods[0];
      }

      // TODO: Remove from Moonpay using moonPayService
      
    }

  }


})();
