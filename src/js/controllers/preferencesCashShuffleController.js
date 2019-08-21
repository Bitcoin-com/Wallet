'use strict';

(function(){
  angular
    .module('copayApp.controllers')
    .controller('preferencesCashShuffleController', preferencesCashShuffleController);

  function preferencesCashShuffleController(
    bitcoinCashJsService
    , bwcError
    , clipboardService
    , configService
    , gettextCatalog
    , $interval
    , $ionicHistory
    , $ionicModal
    , $ionicNavBarDelegate
    , $ionicPopover
    , lodash
    , $log
    , platformInfo
    , popupService
    , profileService
    , $rootScope
    , $scope
    , sendFlowService
    , soundService
    , $state 
    , storageService
    , $timeout
    , txFormatService
    , walletAddressListenerService
    , walletService
    , $ionicScrollDelegate
    , $filter
    , $stateParams
    , txpModalService
    , externalLinkService
    , addressbookService
    , $window
    , timeService
    , feeService
    , appConfigService
    , rateService
    , walletHistoryService
    , cashshuffleService
  ) {

    $scope.cs = cashshuffleService;

    $scope.useCustomServer = cashshuffleService.preferences.serverStatsUri !== cashshuffleService.defaultServerStatsUri;

    $scope.newServerValue = cashshuffleService.preferences.serverStatsUri;

    $scope.saveButtonText = 'Save';

    $scope.dirtyForm = false;

    $scope.saveCustomShuffleServer = function(restoreTheDefault) {

      try {
        $scope.cs.changeShuffleServer(restoreTheDefault ? $scope.cs.defaultServerStatsUri : $scope.cs.preferences.serverStatsUri);
        $scope.saveButtonText = 'Updated';
      }
      catch(nope) {
        $scope.saveButtonText = 'Save Error';
      }
  
      $timeout(function() {
        $scope.saveButtonText = 'Save';
        $scope.dirtyForm = false;
      }, 3000);

    };

    $scope.$on('$ionicView.enter', function(event, data) {
      $ionicNavBarDelegate.showBar(true);

      $timeout(function() {
        $scope.$apply();
      });

    });

  }
})();
