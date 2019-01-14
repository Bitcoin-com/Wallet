'use strict';
angular.module('bitcoincom.directives')
  .directive('expirationdate', function(moment) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl) {
        ctrl.$validators.expirationdate = function(modelValue, viewValue) {
          var now = new Date();
          if (modelValue.match(/\d{2}\/\d{4}/,'')) {
            expiration = moment(modelValue, 'MM/YYYY');
            if (moment().diff(expiration, 'months') >= 0) {
              return true
            }
          }
          return false;
        };
      }
    }
  })
  .directive('minage', function(moment) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl) {
        ctrl.$validators.minage = function(modelValue, viewValue) {
          var dob = moment(modelValue, 'DDMMYYYY');
          if (moment().diff(dob, 'years') >= 18) {
            return true
          }
          return false;
        }
      }
    }
  });
