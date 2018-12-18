'use strict';

angular.module('copayApp.controllers').controller('servicesController', function(externalLinkService, $scope, $ionicScrollDelegate, $timeout, servicesService, configService) {
  $scope.hide = false;

  configService.whenAvailable(function(config) {
    $scope.hide = config.homeSectionIsHidden&&config.homeSectionIsHidden['services']?config.homeSectionIsHidden['services']:false;
  });

  $scope.services = servicesService.get();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
      configService.set({homeSectionIsHidden: {services: $scope.hide}}, function(err) {
        if (err) $log.debug(err);
      });
    }, 10);
  };

  $scope.open = function(url) {
    externalLinkService.open(url, false);
  }

});
