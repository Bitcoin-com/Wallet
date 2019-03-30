'use strict';

angular.module('copayApp.directives').directive('sideshiftCoinDepositInfo', function(sideshiftApiService) {
    return {
        require:['^sideshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            depositInfo : '=depositInfo',
            DepositStatus :'=depositStatus'
        },
        link: function(scope, element, attrs, controllers) {

        },
        templateUrl: 'views/includes/sideshift-coin-deposit-info.html'
    }
});
