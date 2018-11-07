'use strict';

(function(){
/**
 * @desc payment method directive for buy bitcoin with moonpay
 * @example <payment-method-item value="fee.value" pm="pm"></payment-method-item>
 */
  angular
    .module('bitcoincom.directives')
    .directive('paymentMethodItem', function() {
      return {
        restrict: 'E',
        scope: {
          pm: '=pm'
        },
        templateUrl: 'views/includes/payment-method-item.html',
        controller: paymentMethodItemController
      }
    });

  function paymentMethodItemController($scope) {
    $scope.vm = {};
    var vm = $scope.vm;

    vm.getIconPathFromName = getIconPathFromName;

    function getIconPathFromName(name) {
      switch(name.toUpperCase()) {
        case "VISA": 
          return "img/buy-bitcoin/icon-visa.svg"
        case "MASTERCARD": 
          return "img/buy-bitcoin/icon-mastercard.svg"
        default:
          return "img/buy-bitcoin/icon-generic-card.svg";
      }
    }
  }
})();