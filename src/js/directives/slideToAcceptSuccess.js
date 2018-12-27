'use strict';

angular.module('copayApp.directives')
  .directive('slideToAcceptSuccess', function($timeout, platformInfo) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/slideToAcceptSuccess.html',
      transclude: true,
      scope: {
        amountWon: '=slideSuccessAmountWon',
        destinationAddress: '=slideSuccessDestinationAddress',
        destinationIsAGame: '=slideSuccessDestinationIsAGame',
        didWin: '=slideSuccessDidWin',
        didLose: '=slideSuccessDidLose',
        isShown: '=slideSuccessShow',
        onConfirm: '&slideSuccessOnConfirm',
        onReplay: '&slideSuccessOnReplay',
        hideOnConfirm: '=slideSuccessHideOnConfirm',
        onShare: '=slideSuccessOnShare',
      },
      link: function(scope, element, attrs) {
        scope.isCordova = platformInfo.isCordova;
        scope.hasShareFunction = typeof scope.onShare === 'function';
        var elm = element[0];
        elm.style.display = 'none';
        
        scope.onReplayButtonClick = onReplayButtonClick;

        scope.$watch('isShown', function() {
          if (scope.isShown) {
            elm.style.display = 'flex';
            $timeout(function() {
              scope.fillScreen = true;
            }, 10);
          }
        });
        
        scope.onConfirmButtonClick = function() {
          scope.onConfirm();
          if (scope.hideOnConfirm) {
            scope.fillScreen = false;
            elm.style.display = 'none';
          }
        };

        
        function onReplayButtonClick() {
          scope.fillScreen = false;
          elm.style.display = 'none';

          scope.onReplay();
        }
        

        scope.onShareButtonClick = function() {
          scope.onShare();
        }
      }
    };
  });
