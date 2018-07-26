'use strict';
angular.module('bitcoincom.directives')
    .directive('amount', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            scope: {
              value: '=',
              currency: '='
            },
            templateUrl: 'views/includes/amount.html',
            controller: ['$scope', function($scope) {
                var valueFormatted = parseFloat($scope.value).toFixed(8);
                $scope.start = valueFormatted.slice(0, -5);
                $scope.middle = valueFormatted.slice(-5, -2);
                $scope.end = valueFormatted.substr(valueFormatted.length - 2);
            }]
        };
    }
]);