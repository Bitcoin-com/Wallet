'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinWalletsController', walletsController);

  function walletsController(
    moonPayService, profileService
    , gettextCatalog, popupService
    , $scope, $ionicHistory
  ) {
    var vm = this;

    // Variables
    vm.walletId = null;
    vm.wallets = [];

    var initialWalletId = null;

    function _initVariables() {
      
      // Get the default payment from moon pay service
      // Here
      // Update the default payment somewhere else by watching the defaultPayment variable.
      vm.wallets = profileService.getWallets({
        coin: 'bch'
      });
      moonPayService.getDefaultWalletId().then(
        function onGetDefaultWalletIdSuccess(walletId) {
          if (walletId == null && vm.wallets && vm.wallets.length > 0) {
            vm.walletId = wallets[0].id;
            moonPayService.setDefaultWalletId(vm.walletId);
          } else {
            for (var i=0; i<vm.wallets.length; ++i) {
              if (vm.wallets[i].id == walletId) {
                vm.walletId = vm.wallets[i].id;
                break;
              }
            }
          }
          initialWalletId = vm.walletId
        }
      );
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }

    function _onBeforeLeave(event, data) {
      var defaultWasChanged = initialWalletId !== vm.walletId;
      if (defaultWasChanged) {
        moonPayService.setDefaultWalletId(vm.walletId)
      }
      console.log('onBeforeExit(), defaultWasChanged: ' + defaultWasChanged);
    }

  }


})();
