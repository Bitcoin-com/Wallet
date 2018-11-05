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
    
    // Variables
    vm.subtext = "Enter your card information."
    vm.card = {};

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
        console.log('not valid')
        return;
      } else {

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

    function isValidCard(card) {
      return card.number.length === 16 && card.cvc.length === 3 && card.expiration.length === 7;
    }

    function _initVariables() {
      vm.subtext = "Enter your card information.";
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

  }


})();
