'use strict';

angular.module('copayApp.controllers').controller('communityController', function($scope, communityService, $ionicScrollDelegate, $timeout, platformInfo) {

  $scope.hide = false;
  $scope.services = communityService.get();
  $scope.isCordova = platformInfo.isCordova;

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.share = function() {
    if (!$scope.isCordova) return;
    var text = 'Visit Wallet.Bitcoin.com and get started using Bitcoin Cash today!';
    window.plugins.socialsharing.share(text, null, null, null);
  }

});
