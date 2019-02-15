'use strict';

(function(){

angular
  .module('bitcoincom.controllers')
  .controller('sideshiftController', sideshiftController);
  
  function sideshiftController(
    $scope
    , sendFlowService
    , $state
    , $timeout
    , $ionicHistory
    , profileService
    , walletService
    , popupService
    , lodash
    , $ionicNavBarDelegate
  ) {
    var walletsBtc = [];
    var walletsBch = [];

    $scope.showMyAddress = showMyAddress;

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      walletsBtc = profileService.getWallets({coin: 'btc'});
      walletsBch = profileService.getWallets({coin: 'bch'});
      $scope.fromWallets = lodash.filter(walletsBtc.concat(walletsBch), function(w) {
        return (w.status && w.status.balance && w.status.balance.availableAmount > 0);
      });

      $scope.singleFromWallet = $scope.fromWallets.length === 1;
      $scope.fromWalletSelectorTitle = 'From';
      $scope.toWalletSelectorTitle = 'To';
      $scope.showFromWallets = false;
      $scope.showToWallets = false;
      $scope.walletsWithFunds = profileService.getWallets({onlyComplete: true, hasFunds: true});
      $scope.wallets = profileService.getWallets({onlyComplete: true});
      $scope.hasWallets = !lodash.isEmpty($scope.wallets);
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });

    // This could probably be enhanced refactoring the routes abstract states
    $scope.createWallet = function() {
      $state.go('tabs.home').then(function() {
        $state.go('tabs.add.create-personal');
      });
    };

    $scope.buyBitcoin = function() {
      $state.go('tabs.home').then(function() {
        $state.go('tabs.buyandsell');
      });
    };

    $scope.sideshift = function() {    
      var stateParams = {
        thirdParty: {
          id: 'sideshift'
        }
      };
      sendFlowService.start(stateParams);
    }

    function showMyAddress() {
      $state.go('tabs.home').then(function() {
        $state.go('tabs.receive');
      });
    }
  }
})();
