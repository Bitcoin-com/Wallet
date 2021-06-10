'use strict';

angular.module('copayApp.controllers').controller('preferencesAdvancedController', function($scope, $timeout, $state, $stateParams, profileService, $ionicNavBarDelegate) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.network = wallet.network;
  $scope.wallet = wallet;

  $scope.goToAddresses = function() {
    $state.go('tabs.preferences.addresses', {
      walletId: $stateParams.walletId,
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });

  $timeout(function() {
    $scope.$apply();
  }, 1);
});
