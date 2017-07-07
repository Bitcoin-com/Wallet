'use strict';

angular.module('copayApp.controllers').controller('bitcoincomController',
  function($scope, $timeout, $ionicModal, $log, $state, $ionicHistory, lodash, bitcoincomService, externalLinkService, popupService) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var initBitcoincom = function() {
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
        
    });
  });
