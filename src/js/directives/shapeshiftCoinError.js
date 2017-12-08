'use strict';

angular.module('copayApp.directives').directive('shapeshiftCoinError', function(shapeshiftApiService) {
    return {
        require:['^shapeshiftCoinTrader'],
        restrict: 'E',
        transclude: true,
        scope: {
            depositInfo : '=ssError'
        },
        link: function(scope, element, attrs, controllers) {

        },
        templateUrl: 'views/includes/shapeshift-coin-error.html'
    }
});
