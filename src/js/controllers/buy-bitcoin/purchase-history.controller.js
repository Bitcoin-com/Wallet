'use strict';


(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinPurchaseHistoryController', purchaseHistoryController);

  function purchaseHistoryController($scope) {
    var vm = this;

    vm.focussedEl = false;

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      
    }

    function _onBeforeEnter() {
      
    }

  }
})();
