'use strict';

/**
 * @desc amount directive that can be used to display formatted financial values
 * @example <amount value="12.49382901" currency="BCH"></amount>
 */
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
        var decimalPlaces = {
          '0': ['BIF', 'CLP', 'DJF', 'GNF', 'ILS', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'],
          '3': ['BHD', 'IQD', 'JOD', 'KWD', 'OMR', 'TND'],
          '8': ['BCH', 'BTC']
        };

        var numberWithCommas = function(x) {
          return parseFloat(x).toLocaleString();
        };

        var buildAmount = function(start, middle, end) {
          $scope.start = start;
          $scope.middle = middle;
          $scope.end = end;
        };

        var getDecimalPlaces = function(currency) {
          if (decimalPlaces['0'].indexOf($scope.currency.toUpperCase()) > -1) return '0';
          if (decimalPlaces['3'].indexOf($scope.currency.toUpperCase()) > -1) return '3';
          if (decimalPlaces['8'].indexOf($scope.currency.toUpperCase()) > -1) return '8';
          return '2';
        };

        switch (getDecimalPlaces($scope.currency)) {
          case '0':
            var valueFormatted = numberWithCommas(Math.round(parseFloat($scope.value)));
            buildAmount(valueFormatted, '', '');
            break;

          case '2':
            var valueProcessing = parseFloat(parseFloat($scope.value).toFixed(2));
            var valueFormatted = numberWithCommas(valueProcessing);
            buildAmount(valueFormatted, '', '');
            break;

          case '3':
            var valueProcessing = parseFloat(parseFloat($scope.value).toFixed(3));
            var valueFormatted = numberWithCommas(valueProcessing);
            buildAmount(valueFormatted, '', '');
            break;

          case '8':
            var valueFormatted = parseFloat($scope.value).toFixed(8);
            if (parseFloat($scope.value) == 0) {
              buildAmount('0', '', '');
            } else {
              buildAmount(valueFormatted, '', '');
              var start = numberWithCommas(valueFormatted.slice(0, -5));
              var middle = valueFormatted.slice(-5, -2);
              var end = valueFormatted.substr(valueFormatted.length - 2);
              buildAmount(start, middle, end);
            }
            break;
        }
      }]
    };
  }
]);