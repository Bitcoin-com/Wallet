'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAddCardFormController', addCardFormController);

  function addCardFormController(
    moonPayService
    , $scope
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
      var splitExpirationDate = vm.card.expiration.trim().split('/');
      var card = {
        number: vm.card.number.trim(),
        expiryMonth: parseInt(splitExpirationDate[0]),
        expiryYear: parseInt(splitExpirationDate[1]),
        cvc: vm.card.cvc.trim()
      }
     
      // Check if the card is valid
      if (!isValidCard(card)) {
        // Handle error message
        return;
      } else {
        vm.subtext = contactingText;
        // Send to moon pay
        moonPayService.createCard(card).then(function(card) {
          console.log(card)
          $scope.$ionicGoBack();
        }, function (err) {
          // Handle the error
          console.log(err);
        });
      }
    }

    function didPushBack() {
      $scope.$ionicGoBack();
    }

    function handleCardNumberChange() {
      // Clean up string
      if(!vm.card.number) {
        return;
      }
      vm.card.number = vm.card.number.replace(/\D/g,'');
    }

    function handleSecurityChange() {
      // Clean up string
      if(!vm.card.cvc) {
        return;
      }
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
