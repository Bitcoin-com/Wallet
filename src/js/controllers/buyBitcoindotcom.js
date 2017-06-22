'use strict';

angular.module('copayApp.controllers').controller('buyBitcoindotcomController',
  function($scope, $timeout, $ionicModal, $log, $state, $ionicHistory, lodash, bitcoincomService, externalLinkService, popupService) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var buyBitcoindotcom = function() {
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      buyBitcoindotcom();
    });
  });
