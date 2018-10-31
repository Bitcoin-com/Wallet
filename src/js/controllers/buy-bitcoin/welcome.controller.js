'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWelcomeController', buyBitcoinWelcomeController);

  function buyBitcoinWelcomeController(
    gettextCatalog, 
    $ionicHistory,
    $log, 
    moonPayService, 
    popupService, 
    $scope
    ) {
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

      
      
      /*
      if (!vm.email) {
        var title = 'Title';
        var msg = gettextCatalog('Enter an email address.');
        popupService.showAlert(title, msg, function onAlertShown(){});
        return;
      }
      */
    }
    

    function onBeforeEnter(event, data) {
      initVariables();

      //moonPayService.
    }
  }


})();
