'use strict';

angular.module('copayApp.controllers').controller('homeIntegrationsController', function($scope, homeIntegrationsService, $ionicScrollDelegate, $timeout, configService) {
  $scope.hide = false;

  configService.whenAvailable(function(config) {
    $scope.hide = config.homeSectionIsHidden&&config.homeSectionIsHidden['homeIntegrations']?config.homeSectionIsHidden['homeIntegrations']:false;
  });

  $scope.services = homeIntegrationsService.get();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
      configService.set({homeSectionIsHidden: {homeIntegrations: $scope.hide}}, function(err) {
        if (err) $log.debug(err);
      });
    }, 10);
  };

});
