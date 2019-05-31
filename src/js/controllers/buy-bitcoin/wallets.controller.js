'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWalletsController', walletsController);

  function walletsController(
    moonPayService, profileService, bitAnalyticsService
    , gettextCatalog, popupService
    , $scope, $ionicHistory, $state
  ) {
    var vm = this;

    // Variables
    vm.walletId = null;
    vm.wallets = [];

    // Functions
    vm.goBack = goBack;

    var initialWalletId = null;

    function _initVariables() {
      vm.coin = $state.params.coin;
      
      // Get the default payment from moon pay service
      // Here
      // Update the default payment somewhere else by watching the defaultPayment variable.
      vm.wallets = profileService.getWallets({
        coin: vm.coin
      });
      moonPayService.getDefaultWalletId(vm.coin).then(
        function onGetDefaultWalletIdSuccess(walletId) {
          if (walletId == null && vm.wallets && vm.wallets.length > 0) {
            vm.walletId = wallets[0].id;
            moonPayService.setDefaultWalletId(vm.walletId, vm.coin);
          } else {
            for (var i=0; i<vm.wallets.length; ++i) {
              if (vm.wallets[i].id == walletId) {
                vm.walletId = vm.wallets[i].id;
                break;
              }
            }
          }
          initialWalletId = vm.walletId;
        }
      );
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _onBeforeEnter(event, data) {
      _initVariables();
      bitAnalyticsService.postEvent('buy_bitcoin_choose_wallet_screen_open', [{}, {}, {}], ['leanplum']);
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = initialWalletId !== vm.walletId;
      if (defaultWasChanged) {
        moonPayService.setDefaultWalletId(vm.walletId, vm.coin);
        bitAnalyticsService.postEvent('buy_bitcoin_choose_wallet_screen_new_wallet_chosen', [{}, {}, {}], ['leanplum']);
      }
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
      bitAnalyticsService.postEvent('buy_bitcoin_choose_wallet_screen_close', [{}, {}, {}], ['leanplum']);
    }

    function goBack() {
      $ionicHistory.goBack();
    }

  }


})();
