'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinSuccessController', successController);

  function successController($scope) {
    var vm = this;


    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _initVariables() {
      vm.purchasedAmount = 0;
    }

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();
    }

  }
})();
