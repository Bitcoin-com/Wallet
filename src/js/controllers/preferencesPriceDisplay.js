'use strict';

angular.module('copayApp.controllers').controller('preferencesPriceDisplayController', function($scope, $q, $timeout, configService, $ionicNavBarDelegate) {

  $scope.save = function(priceDisplay) {

    if ($scope.noSave) return;

    var opts = {
      wallet: {
        settings: {
          priceDisplay: priceDisplay
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });
  
  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.init();
  });

  $scope.init = function () {
    configService.whenAvailable(function(config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;

      $timeout(function() {
        $scope.$apply();
      });
    });
  };
});
