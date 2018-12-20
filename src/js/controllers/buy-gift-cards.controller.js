'use strict';

(function () {

angular
  .module('copayApp.controllers')
  .controller('buyGiftCardsController', buyGiftCardsController);

  function buyGiftCardsController (
    $scope
    , $ionicScrollDelegate
    , $timeout
    , servicesService
    , configService
  ) {
    $scope.hide = false;

    configService.whenAvailable(function(config) {
      $scope.hide = config.homeSectionIsHidden&&config.homeSectionIsHidden['buyGiftCards']?config.homeSectionIsHidden['buyGiftCards']:false;
    });

    $scope.toggle = function() {
      $scope.hide = !$scope.hide;
      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
        configService.set({homeSectionIsHidden: {services: $scope.hide}}, function(err) {
          if (err) $log.debug(err);
        });
      }, 10);
    };
  }
})();