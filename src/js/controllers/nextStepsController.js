'use strict';

angular.module('copayApp.controllers').controller('nextStepsController', function($scope, nextStepsService, $ionicScrollDelegate, $timeout, platformInfo, configService, externalLinkService) {

  $scope.hide = false;

  configService.whenAvailable(function(config) {
    $scope.hide = config.homeSectionIsHidden&&config.homeSectionIsHidden['nextSteps']?config.homeSectionIsHidden['nextSteps']:false;
  });

  $scope.services = nextStepsService.get();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
      configService.set({homeSectionIsHidden: {nextSteps: $scope.hide}}, function(err) {
        if (err) $log.debug(err);
      });
    }, 10);
  };

  $scope.open = function(url) {
    externalLinkService.open(url, false)
  }
});
