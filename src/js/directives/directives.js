'use strict';
angular.module('copayApp.directives')
  .directive('validAddress', ['$rootScope', 'bitcore', 'bitcoreCash', 'bitcoinCashJsService',
    function($rootScope, bitcore, bitcoreCash, bitcoinCashJsService) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          // Bitcoin address
          var URI = bitcore.URI;
          var Address = bitcore.Address

          // Bitcoin Cash address
          var URICash = bitcoreCash.URI;
          var AddressCash = bitcoreCash.Address

          var validator = function(value) {

            if (value.indexOf('bitcoincash:') >= 0 || value[0] == 'C' || value[0] == 'H' || value[0] == 'p' || value[0] == 'q') {
              if (value.indexOf('bitcoincash:') < 0) {
                value = 'bitcoincash:' + value;
              }
              value = bitcoinCashJsService.readAddress(value).legacy;
            }

            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // Bip21 uri
            var uri, isAddressValidLivenet, isAddressValidTestnet;
            if (/^bitcoin:/.test(value)) {
              var isUriValid = URI.isValid(value);
              if (isUriValid) {
                uri = new URI(value);
                isAddressValidLivenet = Address.isValid(uri.address.toString(), 'livenet')
                isAddressValidTestnet = Address.isValid(uri.address.toString(), 'testnet')
              }
              ctrl.$setValidity('validAddress', isUriValid && (isAddressValidLivenet || isAddressValidTestnet));
              return value;
            } else if (/^bitcoincash:/.test(value)) {
              var isUriValid = URICash.isValid(value);
              if (isUriValid) {
                uri = new URICash(value);
                isAddressValidLivenet = AddressCash.isValid(uri.address.toString(), 'livenet')
              }
              ctrl.$setValidity('validAddress', isUriValid && (isAddressValidLivenet));
              return value;
            }

            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular Address: try Bitcoin and Bitcoin Cash
            var regularAddressLivenet = Address.isValid(value, 'livenet');
            var regularAddressTestnet = Address.isValid(value, 'testnet');
            var regularAddressCashLivenet = AddressCash.isValid(value, 'livenet');
            ctrl.$setValidity('validAddress', (regularAddressLivenet || regularAddressTestnet || regularAddressCashLivenet));
            return value;
          };


          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validAmount', ['configService',
    function(configService) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var settings = configService.getSync().wallet.settings;
            var vNum = Number((value * settings.unitToSatoshi).toFixed(0));
            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }



            if (typeof vNum == "number" && vNum > 0) {
              if (vNum > Number.MAX_SAFE_INTEGER) {
                ctrl.$setValidity('validAmount', false);
              } else {
                var decimals = Number(settings.unitDecimals);
                var sep_index = ('' + value).indexOf('.');
                var str_value = ('' + value).substring(sep_index + 1);
                if (sep_index >= 0 && str_value.length > decimals) {
                  ctrl.$setValidity('validAmount', false);
                  return;
                } else {
                  ctrl.$setValidity('validAmount', true);
                }
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', function(bitcore) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var validator = function(value) {
          if (value.length > 0) {
            var m = value.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/);
            ctrl.$setValidity('walletSecret', m ? true : false);
          }
          return value;
        };

        ctrl.$parsers.unshift(validator);
      }
    };
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.formData.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService', 'lodash',
    function(addressbookService, lodash) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var addr = attrs.address;
          addressbookService.get(addr, function(err, ab) {
            if (ab) {
              var name = lodash.isObject(ab) ? ab.name : ab;
              element.append(name);
            } else {
              element.append(addr);
            }
          });
        }
      };
    }
  ])
  .directive('ignoreMouseWheel', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('mousewheel', function(event) {
          element[0].blur();
          $timeout(function() {
            element[0].focus();
          }, 1);
        });
      }
    }
  })
  .directive('validDate', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl) {
        ctrl.$validators.validDate = function(modelValue, viewValue) {
          // Expected Format is DD/MM/YYYY
          if (ctrl.$isEmpty(modelValue)) {
            // consider empty models to be valid
            return true;
          }
          var now = new Date();
          if (viewValue.match(/\d{2}\/\d{2}\/\d{4}/g)) {
            var split = viewValue.split(/\//);
            return parseInt(split[0]) <= 31 &&
              parseInt(split[0]) > 0 &&
              parseInt(split[1]) <= 12 &&
              parseInt(split[1]) > 0 &&
              (parseInt(split[1])) > 0;
          }

          return false;
        };
      }
    };
  })
  .directive('validExpiration', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl) {
        ctrl.$validators.validExpiration = function(modelValue, viewValue) {
          if (ctrl.$isEmpty(modelValue)) {
            // consider empty models to be valid
            return true;
          }
          var now = new Date();
          if (viewValue.match(/\d{2}\/\d{2}/g)) {
            var split = viewValue.split(/\//);
            return parseInt(split[0]) <= 12 &&
              parseInt(split[0]) > 0 &&
              (2000 + parseInt(split[1])) >= now.getFullYear();
          }

          return false;
        };
      }
    };
  })
  .directive('maskedDate', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        // Masks expirations to the format of 0000 0000 0000 0000

        function addSpaces(value) {
          if(typeof(value) == typeof(undefined)) {
            return value;
          }

          var parsedValue = value.toString()
            .replace(/[^\d]/g, '')
            .replace(/^(\d{2})$/g, '$1//')
            .replace(/^(\d{2})(\d?.)$/g, '$1/$2')
            .replace(/^(\d{2})\/(\d{2})$/g, '$1/$2//')
            .replace(/^(\d{2})(\d{2})(\d+)$/g, '$1/$2/$3')
            .replace(/\/$/, '');
          return parsedValue.slice(0,10);
        }

        function removeSpaces(value) {
          if (typeof(value) == typeof(undefined)) {
            return value;
          }
            
          var parsedValue = value.toString().replace(/\s/g, '');
          return parsedValue;
        }

        function parseViewValue(value) {
          var viewValue = addSpaces(value);
          ngModel.$viewValue = viewValue;
          ngModel.$render();

          // Return what we want the model value to be
          return removeSpaces(viewValue);
        }

        function formatModelValue(value) {
          var modelValue = removeSpaces(value);
          ngModel.$modelValue = modelValue;
          return addSpaces(modelValue);
        }

        ngModel.$parsers.push(parseViewValue);
        ngModel.$formatters.push(formatModelValue);
      }
    }
  })
  .directive('maskedCreditCard', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        // Masks expirations to the format of 0000 0000 0000 0000

        function addSpaces(value) {
          if(typeof(value) == typeof(undefined)) {
            return value;
          }

          var parsedValue = value.toString()
            .replace(/[^\d]/g, '')
            .replace(/(.{4})/g, '$1 ').trim()
            .replace(/\/$/, '');
          return parsedValue.slice(0,19);
        }

        function removeSpaces(value) {
          if (typeof(value) == typeof(undefined)) {
            return value;
          }
            
          var parsedValue = value.toString().replace(/\s/g, '');
          return parsedValue;
        }

        function parseViewValue(value) {
          var viewValue = addSpaces(value);
          ngModel.$viewValue = viewValue;
          ngModel.$render();

          // Return what we want the model value to be
          return removeSpaces(viewValue);
        }

        function formatModelValue(value) {
          var modelValue = removeSpaces(value);
          ngModel.$modelValue = modelValue;
          return addSpaces(modelValue);
        }

        ngModel.$parsers.push(parseViewValue);
        ngModel.$formatters.push(formatModelValue);
      }
    }
  })
  .directive('maskedExpiration', function() {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ngModel) {
        // Masks expirations to the format of MM/YY

        function addSpaces(value) {
          if(typeof(value) == typeof(undefined)) {
            return value;
          }

          var parsedValue = value.toString()
            .replace(/[^\d]/g, '')
            .replace(/^(\d{2})$/g, '$1//').trim()
            .replace(/^(\d{2})(\d+)$/g, '$1/$2').trim()
            .replace(/\/$/, '');
          return parsedValue.slice(0,5);
        }

        function removeSpaces(value) {
          if (typeof(value) == typeof(undefined)) {
            return value;
          }
            
          var parsedValue = value.toString().replace(/\s/g, '').replace(/\//g, '');
          return parsedValue;
        }

        function parseViewValue(value) {
          var viewValue = addSpaces(value);
          ngModel.$viewValue = viewValue;
          ngModel.$render();

          // Return what we want the model value to be
          return removeSpaces(viewValue);
        }

        function formatModelValue(value) {
          var modelValue = removeSpaces(value);
          ngModel.$modelValue = modelValue;
          return addSpaces(modelValue);
        }

        ngModel.$parsers.push(parseViewValue);
        ngModel.$formatters.push(formatModelValue);
      }
    }
  });
