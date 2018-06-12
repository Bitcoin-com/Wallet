'use strict';

angular.module('copayApp.controllers').controller('communityController', function($scope, communityService, $ionicScrollDelegate, $timeout, platformInfo, configService, externalLinkService) {

  $scope.hide = false;

  configService.whenAvailable(function(config) {
    $scope.hide = config.homeSectionIsHidden&&config.homeSectionIsHidden['community']?config.homeSectionIsHidden['community']:false;
  });

  $scope.services = communityService.get();
  $scope.isCordova = platformInfo.isCordova;

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
      configService.set({homeSectionIsHidden: {community: $scope.hide}}, function(err) {
        if (err) $log.debug(err);
      });
    }, 10);
  };

  $scope.share = function() {
    if (!$scope.isCordova) return;
    var text = 'Visit Wallet.Bitcoin.com and get started using Bitcoin Cash today!';
    window.plugins.socialsharing.share(text, null, null, null);
  }

  $scope.open = function(url) {
    externalLinkService.open(url, false);
  }

});
