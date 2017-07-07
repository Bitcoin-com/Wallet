'use strict';

angular.module('copayApp.controllers').controller('buyandsellController', function($scope, $ionicHistory, buyAndSellService, lodash, externalLinkService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.services = buyAndSellService.get();

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    }

    $scope.$on("$ionicView.enter", function(event, data) {

    });

    if (lodash.isEmpty($scope.services))
      $ionicHistory.goBack();
  });
});
