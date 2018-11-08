'use strict';

(function(){
/**
 * @desc payment method directive for buy bitcoin with moonpay
 * editing attribute is optional, defaults to false.
 * 
 * @example <payment-method-item editing="vm.editing" pm="pm"></payment-method-item>
 */
  angular
    .module('bitcoincom.directives')
    .directive('paymentMethodItem', function() {
      return {
        restrict: 'E',
        scope: {
          editing: '=editing',
          pm: '=pm',
        },
        templateUrl: 'views/includes/payment-method-item.html',
        controller: paymentMethodItemController
      }
    });

  function paymentMethodItemController($scope) {
    $scope.vm = {};
    var vm = $scope.vm;

    vm.iconPath = getIconPathFromName($scope.pm.brand);
    vm.isEditing = !!$scope.editing;
    //vm.getIconPathFromName = getIconPathFromName;
    vm.onDeleteClicked = onDeleteClicked;

    $scope.onDeleteClicked = onDeleteClicked;

    $scope.$watch('editing', function onWatchEditing(){
      vm.isEditing = $scope.editing;
    });

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

    function onDeleteClicked() {
      console.log('onDeleteClicked()');
      $scope.$emit('paymentMethodDelete', { id: $scope.pm.id });
    }
  }
})();