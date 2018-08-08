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
  .directive('formattedAmount', function(uxLanguage) {
    return {
      restrict: 'E',
      scope: {
        value: '@',
        currency: '@',
        sizeEqual: '@'
      },
      templateUrl: 'views/includes/formatted-amount.html',
      controller: function($scope, $timeout) {
        $scope.canShow = false;

        $scope.displaySizeEqual = !!$scope.sizeEqual;

        $timeout(function onFormattedAmountTimeout() {

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

          var getDecimalSeparator = function() {
            var testNum = 1.5;
            var testString = testNum.toLocaleString(uxLanguage.getCurrentLanguage());
            // Some environments let you set decimal separators that are more than one character
            var separator = /^1(.+)5$/.exec(testString)[1]
            return separator;
          };
  
          var formatNumbers = function() {
            
            // During watch, may be changed from having a separate currency value,
            // to both being in value. Don't want to use previous currency value.
            // Try to extract currency from value..
            var currencySplit = $scope.value.split(" ");
            if (currencySplit.length === 2) {
              $scope.currency = currencySplit[1];
            }
            $scope.currency = $scope.currency || '';
            

            var parsed = parseFloat($scope.value);
            var valueFormatted = '';
            var valueProcessing = '';
            switch (getDecimalPlaces($scope.currency)) {
              case '0':
                  if (isNaN(parsed)) {
                  buildAmount('-', '', '');
                } else {
                  valueFormatted = localizeNumbers(Math.round(parsed));
                  buildAmount(valueFormatted, '', '');
                }
                break;
    
              case '3':
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '---', '', '');
                } else {
                  valueProcessing = parsed.toFixed(3);
                  valueFormatted = localizeNumbers(valueProcessing, 3);
                  buildAmount(valueFormatted, '', '');
                }
                break;
    
              case '8':
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '---', '', '');
                } else if (parsed === 0) {
                  buildAmount('0', '', '');
                } else {
                  valueFormatted = parsed.toFixed(8);
                  valueFormatted = localizeNumbers(valueFormatted, 8);
                  var start = valueFormatted.slice(0, -5);
                  var middle = valueFormatted.slice(-5, -2);
                  var end = valueFormatted.substr(valueFormatted.length - 2);
                  buildAmount(start, middle, end);
                
                }
                break;
    
              default: // 2
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '--', '', '');
                } else {
                  valueProcessing = parseFloat(parsed.toFixed(2));
                  valueFormatted = localizeNumbers(valueProcessing, 2);
                  buildAmount(valueFormatted, '', '');
                }
                break;
            }
            $scope.canShow = true;
          };
          
          formatNumbers();
          $scope.$watchGroup(['currency', 'value'], function onFormattedAmountWatch() {
            formatNumbers();
          });
        });
      }
    };
  }
);