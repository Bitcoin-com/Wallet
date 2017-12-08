'use strict';

angular.module('copayApp.directives').directive('shapeshiftCoinShiftButton', function(shapeshiftApiService) {
    return {
        require:['^shapeshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            ShiftState : '=shiftState',
            shiftIt : '=shiftIt'
        },
        link: function(scope, element, attrs, controllers) {
            console.log(scope.ShiftState)
        },
        templateUrl: 'views/includes/shapeshift-coin-shift-button.html'
    }
});
