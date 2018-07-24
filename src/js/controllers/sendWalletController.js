'use strict';

angular.module('copayApp.controllers').controller('sendWalletController', sendWalletController);

function sendWalletController(gettextCatalog, configService, $filter, $ionicHistory, $ionicModal, $ionicScrollDelegate, lodash, $log, nodeWebkitService, rateService, $scope, $state, $stateParams, $timeout, txFormatService, platformInfo, popupService, profileService, walletService, $window) {
  var vm = this;

  vm.headerTitle = '';
  vm.isSendFrom = true;
  vm.walletsBch = [];
  vm.walletsBtc = [];
  vm.walletsEmpty = [];

  vm.useWallet = useWallet;

  $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

  var fromWalletId = '';
  var thirdParty = null;

  function onBeforeEnter(event, data) {
    thirdParty = data.stateParams.thirdParty

    fromWalletId =data.stateParams.fromWalletId;
    vm.isSendFrom = !!fromWalletId;

    if (vm.isSendFrom) {
      vm.headerTitle = gettextCatalog.getString('From');
    } else {
      vm.headerTitle = gettextCatalog.getString('To');
    }

    vm.walletsBch = profileService.getWallets({
      coin: 'bch',
      hasFunds: true
    });
    vm.walletsBtc = profileService.getWallets({
      coin: 'btc',
      hasFunds: true
    });
    vm.walletsEmpty = profileService.getWallets({
      hasFunds: false
    });

    // Will make this generic for other third party services later, but
    // this is where it will happen
    if (thirdParty && thirdParty.id === 'shapeshift') {

    } else {
      headerTitle = 'Wallet-to-Wallet transfer'
    }
  }

  function useWallet(wallet) {

  }
}