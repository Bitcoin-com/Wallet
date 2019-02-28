'use strict';

angular.module('copayApp.directives').directive('sideshiftCoinShiftButton', function(sideshiftApiService) {
    return {
        require:['^sideshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            ShiftState : '=shiftState',
            shiftIt : '=shiftIt'
        },
        link: function(scope, element, attrs, controllers) {
            console.log(scope.ShiftState)
        },
        templateUrl: 'views/includes/sideshift-coin-shift-button.html'
    }
});
