'use strict';

angular.module('copayApp.directives').directive('shapeshiftCoinDepositInfo', function(shapeshiftApiService) {
    return {
        require:['^shapeshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            depositInfo : '=depositInfo',
            DepositStatus :'=depositStatus'
        },
        link: function(scope, element, attrs, controllers) {

        },
        templateUrl: 'views/includes/shapeshift-coin-deposit-info.html'
    }
});
