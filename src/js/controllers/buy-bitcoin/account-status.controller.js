'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAccountStatusController', accountStatusController);

  function accountStatusController(gettextCatalog, $log, popupService, $scope) {
    var vm = this;

    // Functions
    vm.getStarted = getStarted;
    vm.goBack = goBack;

    function initVariables() {
      
    }

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);


    function getStarted() {
      $log.debug('getStarted() with email: ' + vm.email);

    }

    function goBack() {
    }

    

    function onBeforeEnter(event, data) {
      initVariables();
    }
  }


})();
