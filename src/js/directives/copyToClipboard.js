'use strict';

angular.module('copayApp.directives')
  .directive('copyToClipboard', function(clipboardService, ionicToast, gettextCatalog) {
    return {
      restrict: 'A',
      scope: {
        copyToClipboard: '=copyToClipboard'
      },
      link: function(scope, elem, attrs, ctrl) {
        elem.bind('mouseover', function() {
          elem.css('cursor', 'pointer');
        });

        elem.bind('click', function() {
          var data = scope.copyToClipboard;
          clipboardService.copyToClipboard(data);

          var msg = gettextCatalog.getString('Copied to clipboard');
          scope.$apply(function () {
            ionicToast.show(msg, 'bottom', false, 1000);
          });

        });
      }
    }
  });
