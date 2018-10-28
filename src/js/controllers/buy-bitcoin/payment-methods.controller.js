'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinPaymentMethodsController', paymentMethodsController);

  function paymentMethodsController($scope) {
    var vm = this;

    function _initVariables() { 
    }

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);
    

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

  }


})();
