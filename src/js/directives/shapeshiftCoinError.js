'use strict';

angular.module('copayApp.directives').directive('sideshiftCoinError', function(sideshiftApiService) {
    return {
        require:['^sideshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            depositInfo : '=ssError'
        },
        link: function(scope, element, attrs, controllers) {

        },
        templateUrl: 'views/includes/sideshift-coin-error.html'
    }
});
