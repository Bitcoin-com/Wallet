'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWelcomeController', buyBitcoinWelcomeController);

  function buyBitcoinWelcomeController(kycFlowService, $log, $scope) {
    var vm = this;

    // Functions
    vm.getStarted = getStarted;
    vm.goBack = goBack;

    function initVariables() {
      vm.email = 'bla';
    }

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);


    function getStarted() {
      $log.debug('getStarted() with email: ' + vm.email);
    }

    function goBack() {
      kycFlowService.goBack();
    }

    

    function onBeforeEnter(event, data) {
      initVariables();
    }
  }


})();
