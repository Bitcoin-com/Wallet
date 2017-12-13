'use strict';

angular.module('copayApp.controllers').controller('servicesController', function($scope, $ionicScrollDelegate, $timeout) {

  $scope.hide = false;

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

});
