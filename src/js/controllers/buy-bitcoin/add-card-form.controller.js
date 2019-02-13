'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAddCardFormController', addCardFormController);

  function addCardFormController(
    gettextCatalog,
    moonPayService,
    popupService,
    $scope
  ) {
    var vm = this;

    // Functions
    vm.didPushBack = didPushBack;
    vm.didPushAdd = didPushAdd;

    vm.handleSecurityChange = handleSecurityChange;

    var addCardInfoText = gettextCatalog.getString("Type all your card details below.");
    var contactingText = gettextCatalog.getString("Contacting the card issuer.");
    
    function didPushAdd() {
      // Check if the card is valid
      if (!isValidForm()) {
        var title = gettextCatalog.getString("Unable to Add Card");
        var message = getFormErrors();
        popupService.showAlert(title, message);
        return;
      }

      var splitExpirationDate = [vm.card.expiration.slice(0,2), vm.card.expiration.slice(2)];
      var card = {
        number: vm.card.number.trim(),
        expiryMonth: parseInt(splitExpirationDate[0]),
        expiryYear: 2000 + parseInt(splitExpirationDate[1]),
        cvc: vm.card.cvc.trim()
      }

      vm.subtext = contactingText;
      // Send to moon pay
      moonPayService.createCard(card).then(function(card) {
        $scope.$ionicGoBack();
      }, function (err) {
        // Handle the error
        var title = gettextCatalog.getString("Unable to Add Card");
        var message = err;
        popupService.showAlert(title, message);
        console.log(err);
        return;
      });
    }

    function didPushBack() {
      $scope.$ionicGoBack();
    }

    function handleSecurityChange() {
      if(!vm.card.cvc) {
        return;
      }
      // Clean up string
      vm.card.cvc = vm.card.cvc.replace(/\D/g,'');
    }

    function isValidCardNumber() {
      return vm.card.number && vm.card.number.length === 16;
    }

    function isValidSecurityCode() {
      return vm.card.cvc && vm.card.cvc.length >= 3 && vm.card.cvc.length <= 4;
    }

    function isValidExpiration() {
      var now = new Date();
      if(vm.card.expiration && vm.card.expiration.length === 4) {
        var split = [vm.card.expiration.slice(0,2), vm.card.expiration.slice(2)];
        var month = parseInt(split[0]);
        var year = (2000 + split[1]);
        return month > 0 &&
          month <= 12 &&
          year >= now.getFullYear();
      }
      return false;
    }

    function isValidForm() {
      return isValidCardNumber() &&
        isValidSecurityCode() &&
        isValidExpiration();
    }

    function getFormErrors() {
      if(!isValidCardNumber()) {
        return gettextCatalog.getString("Card number is invalid. Check your card and try again.");
      }
      if(!isValidSecurityCode()) {
        return gettextCatalog.getString("CVC number is invalid. The 3 digits in the back part of your card. 4 digits if you are using AMEX.");
      }
      if(!isValidExpiration()) {
        return gettextCatalog.getString("Expiration date is invalid. Check your card and try again.");
      }
      return false;
    }

    function _initVariables() {
      vm.subtext = addCardInfoText;
      vm.card = { 
        number: '',
        expiration: '',
        cvc: '',
      };
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }
  }
})();
