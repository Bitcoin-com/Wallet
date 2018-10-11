'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('kycGetVerifiedController', kycGetVerifiedController);

  function kycGetVerifiedController(addressbookService, externalLinkService, bitcoinCashJsService, bitcore, bitcoreCash, bwcError, clipboardService, configService, feeService, gettextCatalog, $interval, $ionicHistory, $ionicModal, ionicToast, lodash, $log, ongoingProcess, platformInfo, popupService, profileService, $scope, sendFlowService, shapeshiftService, soundService, $state, $timeout, txConfirmNotification, txFormatService, walletService) {
    console.log('kycGetVerifiedController');
    var vm = this;

    vm.goBack = goBack;

    function goBack() {
      
    }
  }


})();
