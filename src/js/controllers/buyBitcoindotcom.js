'use strict';

angular.module('copayApp.controllers').controller('buyBitcoindotcomController',
  function($scope, platformInfo, externalLinkService) {

    $scope.os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var buyBitcoindotcom = function() {
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      buyBitcoindotcom();
    });
  });
