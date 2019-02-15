'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController(
    moonPayService, bitAnalyticsService
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
    vm.paymentMethodId = null;
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
              vm.paymentMethodId = cards[0];
              defaultCardId = cards[0].id;
              moonPayService.setDefaultCardId(defaultCardId);
            } else {
              for (var i=0; i<cards.length; ++i) {
                if (cards[i].id == cardId) {
                  vm.paymentMethodId = cards[i].id;
                  defaultCardId = cardId;
                  break;
                }
              }
            }
            initialPaymentMethodId = vm.paymentMethodId
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
      bitAnalyticsService.postEvent('buy_bitcoin_choose_payment_method_screen_open', [{}, {}, {}], ['leanplum']);
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = vm.paymentMethodId && initialPaymentMethodId !== vm.paymentMethodId;
      if (defaultWasChanged) {
        moonPayService.setDefaultCardId(vm.paymentMethodId);
        bitAnalyticsService.postEvent('buy_bitcoin_choose_payment_method_screen_new_payment_method_chosen', [{}, {}, {}], ['leanplum']);
      }
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
      bitAnalyticsService.postEvent('buy_bitcoin_choose_payment_method_screen_close', [{}, {}, {}], ['leanplum']);
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

      moonPayService.removeCard(deletedCardId).then(
        function onRemoveCardSuccess(cards) {
          vm.paymentMethods = cards;
    
          if (deletedCardId === defaultCardId && vm.paymentMethods.length > 0) {
            defaultCardId = vm.paymentMethods[0].id;
            moonPayService.setDefaultCardId(defaultCardId);
            vm.paymentMethodId = vm.paymentMethods[0].id;
          }
        },
        function onRemoveCardError(cards) {
        }
      )

      // TODO: Remove from Moonpay using moonPayService
      
    }

  }


})();
