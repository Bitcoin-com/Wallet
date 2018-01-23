'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicModal) {

  if ($stateParams.from == 'onboarding') {
    $scope.bchWalletId = $stateParams.bchWalletId;
    $scope.btcWalletId = $stateParams.btcWalletId;
    $scope.fromState = $stateParams.from + '.backupRequest' ;
  } else {
    $scope.walletId = $stateParams.walletId;
    $scope.fromState = $stateParams.from;
  }

  $scope.toState = $stateParams.from + '.backup';

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/screenshotWarningModal.html', {
      scope: $scope,
      backdropClickToClose: true,
      hardwareBackButtonClose: true
    }).then(function(modal) {
      $scope.warningModal = modal;
      $scope.warningModal.show();
    });

    $scope.close = function() {
      $scope.warningModal.remove();
      $timeout(function() {
        if ($stateParams.from == 'onboarding') {
          $state.go($scope.toState, {
            bchWalletId: $scope.bchWalletId,
            btcWalletId: $scope.btcWalletId
          });
        } else {
          $state.go($scope.toState, {
            walletId: $scope.walletId
          });
        }
      }, 200);
    };
  }

  $scope.goBack = function() {
    if ($stateParams.from == 'onboarding') {
      $state.go($scope.fromState, {
        bchWalletId: $scope.bchWalletId,
        btcWalletId: $scope.btcWalletId
      });
    } else {
      $state.go($scope.fromState, {
        walletId: $scope.walletId
      });
    }
  };
});
