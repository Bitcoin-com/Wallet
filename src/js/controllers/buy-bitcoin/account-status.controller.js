'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAccountStatusController', accountStatusController);

  function accountStatusController(gettextCatalog, $log, popupService, $scope, $state) {
    var vm = this;

    // Functions
    vm.getStarted = getStarted;
    vm.goBack = goBack;
    vm.onBuyInstantly = onBuyInstantly;

    function _initVariables() {
      
    }

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);


    function getStarted() {
      $log.debug('getStarted() with email: ' + vm.email);

    }

    function goBack() {
    }

    

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

    function onBuyInstantly() {
      // TODO: Check if have a payment method set up etc
      $state.go('tabs.buybitcoin-amount');
    }
  }


})();
