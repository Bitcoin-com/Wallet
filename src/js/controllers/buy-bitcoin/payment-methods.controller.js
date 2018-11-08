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
    
    // Variables
    vm.editing = false;
    vm.paymentMethod = null;
    vm.paymentMethods = [];
    vm.paymentMethodsAreLoading = true;

    var initialPaymentMethod = null;

    function addPaymentMethod() {
      $state.go('tabs.buybitcoin-add-card-form');
    }

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

    function onEdit() {
      vm.editing = !vm.editing;
    }

  }


})();
