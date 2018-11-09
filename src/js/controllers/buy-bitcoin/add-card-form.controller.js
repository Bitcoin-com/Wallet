'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAddCardFormController', addCardFormController);

  function addCardFormController(
    moonPayService,
    popupService,
    $scope
  ) {
    var vm = this;

    // Functions
    vm.didPushBack = didPushBack;
    vm.didPushAdd = didPushAdd;

    vm.handleCardNumberChange = handleCardNumberChange;
    vm.handleSecurityChange = handleSecurityChange;

    var addCardInfoText = "Verify and complete your card information.";
    var contactingText = "Contacting the card issuer.";

    function didPushAdd() {
      // Check if the card is valid
      if (!isValidForm()) {
        var title = "Unable to Add Card";
        var message = getFormErrors();
        popupService.showAlert(title, message);
        return;
      }

      var splitExpirationDate = vm.card.expiration.trim().split('/');
      var card = {
        number: vm.card.number.trim(),
        expiryMonth: parseInt(splitExpirationDate[0]),
        expiryYear: parseInt(splitExpirationDate[1]),
        cvc: vm.card.cvc.trim()
      }

      vm.subtext = contactingText;
      // Send to moon pay
      moonPayService.createCard(card).then(function(card) {
        $scope.$ionicGoBack();
      }, function (err) {
        // Handle the error
        var title = "Unable to Add card";
        var message = err;
        popupService.showAlert(title, message);
        console.log(err);
        return;
      });
    }

    function didPushBack() {
      $scope.$ionicGoBack();
    }

    function handleCardNumberChange() {
      if(!vm.card.number) {
        return;
      }
      // Clean up string
      vm.card.number = vm.card.number.replace(/\D/g,'');
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
      return vm.card.cvc && vm.card.cvc.length === 3;
    }

    function isValidExpiration() {
      var now = new Date();
      if (vm.card.expiration && vm.card.expiration.match(/\d{2}\/\d{4}/,'')) {
        var split = vm.card.expiration.split(/\//);
        return parseInt(split[0]) <= 12 &&
          parseInt(split[0]) > 0 &&
          parseInt(split[1]) >= now.getFullYear();
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
        return "Card number is invalid. Check your card and try again."
      }
      if(!isValidSecurityCode()) {
        return "CVC number is invalid. Check your card and try again."
      }
      if(!isValidExpiration()) {
        return "Expiration date is invalid. Check your card and try again."
      }
      return false;
    }

    function isValidCard(card) {
      var now = new Date();
      return card.number.length === 16 && 
      card.cvc.length === 3 && 
      card.expiryMonth > 0 &&
      card.expiryMonth <= 12 &&
      card.expiryYear >= now.getFullYear();
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
