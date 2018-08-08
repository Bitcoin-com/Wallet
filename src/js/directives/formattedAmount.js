'use strict';

/**
 * @desc amount directive that can be used to display formatted financial values
 * size-equal attribute is optional, defaults to false.
 * @example fee = {
 *  value: 12.49382901,
 *  currency: 'BCH'
 * }
 * @example <formatted-amount value="fee.value" currency="fee.currency"></formatted-amount>
 * @example <formatted-amount value="fee.value" currency="fee.currency" size-equal="true"></formatted-amount>
 */
angular.module('bitcoincom.directives')
  .directive('formattedAmount', function(configService, uxLanguage) {
    return {
      restrict: 'E',
      scope: {
        value: '@',
        currency: '@',
        sizeEqual: '@'
      },
      templateUrl: 'views/includes/formatted-amount.html',
      controller: function($scope, $timeout) {
        if (!$scope.currency && $scope.value) { // If there is no currency available..
          // Try to extract currency from value..
          var currencySplit = $scope.value.split(" ");
          if (currencySplit.length === 2) {
            $scope.value = currencySplit[0];
            $scope.currency = currencySplit[1];
          }
        }

        $scope.displaySizeEqual = !!$scope.sizeEqual;

        configService.whenAvailable(function(config) {
          console.log("WAIT!!");
          $timeout(function() {
            console.log("FIRED!!");
            var decimalPlaces = {
              '0': ['BIF', 'CLP', 'DJF', 'GNF', 'ILS', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'],
              '3': ['BHD', 'IQD', 'JOD', 'KWD', 'OMR', 'TND'],
              '8': ['BCH', 'BTC']
            };
            var localizeNumbers = function(x, minimumFractionDigits = 0, useGrouping = true) {
              return parseFloat(x).toLocaleString(uxLanguage.getCurrentLanguage(), {
                minimumFractionDigits: minimumFractionDigits,
                useGrouping: useGrouping
              });
            };
    
            var buildAmount = function(start, middle, end) {
              $scope.start = start;
              $scope.middle = middle;
              $scope.end = end;
            };
    
            var getDecimalPlaces = function(currency) {
              if (decimalPlaces['0'].indexOf(currency.toUpperCase()) > -1) return '0';
              if (decimalPlaces['3'].indexOf(currency.toUpperCase()) > -1) return '3';
              if (decimalPlaces['8'].indexOf(currency.toUpperCase()) > -1) return '8';
              return '2';
            };
    
            var formatNumbers = function(currency, value) {
              if (isNaN(parseFloat($scope.value))) {
                buildAmount('', '', '');
                return;
              }

              switch (getDecimalPlaces(currency)) {
                case '0':
                  var valueFormatted = localizeNumbers(Math.round(parseFloat(value)));
                  buildAmount(valueFormatted, '', '');
                  break;
      
                case '3':
                  var valueProcessing = parseFloat(parseFloat(value).toFixed(3));
                  var valueFormatted = localizeNumbers(valueProcessing, 3);
                  buildAmount(valueFormatted, '', '');
                  break;
      
                case '8':
                  var valueFormatted = parseFloat(value).toFixed(8);
                  if (parseFloat(value) == 0) {
                    buildAmount('0', '', '');
                  } else {
                    var valueFormatted = localizeNumbers(valueFormatted, 8);
                    var start = valueFormatted.slice(0, -5);
                    var middle = valueFormatted.slice(-5, -2);
                    var end = valueFormatted.substr(valueFormatted.length - 2);
                    buildAmount(start, middle, end);
                  }
                  break;
      
                default:
                  var valueProcessing = parseFloat(parseFloat(value).toFixed(2));
                  var valueFormatted = localizeNumbers(valueProcessing, 2);
                  buildAmount(valueFormatted, '', '');
                  break;
              }
            };
    
            formatNumbers($scope.currency, $scope.value);
            $scope.$watchGroup(['currency', 'value'], function() {
              formatNumbers($scope.currency, $scope.value);
            });
          });
        });
      }
    };
  }
);