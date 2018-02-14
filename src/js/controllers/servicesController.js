'use strict';

angular.module('copayApp.controllers').controller('servicesController', function($scope, $ionicScrollDelegate, $timeout, servicesService) {

  $scope.hide = false;
  $scope.services = servicesService.get();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

});
