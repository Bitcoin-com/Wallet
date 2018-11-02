'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAddCardFormController', addCardFormController);

  function addCardFormController($scope) {
    var vm = this;

    // Functions
    vm.backButtonPressed = backButtonPressed;
    vm.nextPressed = nextPressed;
    vm.nextIsActive = nextIsActive;
    vm.validateCardNumber = validateCardNumber;
    vm.validateExpirationDate = validateExpirationDate;
    
    // Variables
    vm.currentPage = 0;
    vm.subtext = ""
    vm.card = {};


    var verifyNameText = "Verify and complete your card information.";
    var verifyExpirationText = "Enter your card information.";
    var initialCurrentPage = 0;
    var initialSubtext = verifyNameText;

    function backButtonPressed() {
      if (this.currentPage === 0) {
        $scope.$ionicGoBack();
      } else {
        this.currentPage = this.currentPage - 1;
        this.subtext = this.verifyNameText;
      }
    }
    
    function nextPressed() {
      if(this.currentPage === 0) {
        this.currentPage = 1;
        this.subtext = this.verifyExpirationText;
      } else {
        // Submit to Page
        console.log('nextPressed(), submit form');
      }
    }

    function nextIsActive() {
      if(this.currentPage === 0) {
        return validatePage0()
      }
      return validatePage1();
    }

    function validatePage0() {
      return validateCardNumber() && vm.card.name.length > 0;
    }

    function validatePage1() {
      return validateExpirationDate() && vm.card.security.length >= 3;
    }

    function validateCardNumber() {
      return vm.card.number.length === 19;
    }

    function validateExpirationDate() {
      console.log('validateExpirationDate');
      return true;
    }

    function _initVariables() {
      vm.currentPage = initialCurrentPage;
      vm.subtext = initialSubtext;
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
