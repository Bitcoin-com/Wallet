'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $ionicHistory, txFormatService, platformInfo, configService, profileService, walletService, popupService, bitcoinCashJsService) {

  var showErrorAndBack = function(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

  var setProtocolHandler = function() {
    $scope.protocolHandler = walletService.getProtocolHandler($scope.wallet);
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var walletId = data.stateParams.id;

    if (!walletId) {
      showErrorAndBack('Error', 'No wallet selected');
      return;
    }

    $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

    $scope.wallet = profileService.getWallet(walletId);

    setProtocolHandler();

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }

      $scope.bchAddressType = 'cashaddr';
      var bchAddresses = {};

      if ($scope.wallet.coin == 'bch') {
          bchAddresses = bitcoinCashJsService.translateAddresses(addr);
          $scope.address = bchAddresses[$scope.bchAddressType];
      } else {
          $scope.address = addr;
      }

      $scope.displayAddress = function(type) {
        $scope.bchAddressType = type;
        $scope.address = bchAddresses[$scope.bchAddressType];
      }

      $scope.coin = data.stateParams.coin;
      var parsedAmount = txFormatService.parseAmount(
        $scope.wallet.coin,
        data.stateParams.amount,
        data.stateParams.currency);

      // Amount in USD or BTC
      var amount = parsedAmount.amount;
      var currency = parsedAmount.currency;
      $scope.amountUnitStr = parsedAmount.amountUnitStr;

      if (currency != 'BTC' && currency != 'BCH') {
        // Convert to BTC or BCH
        var config = configService.getSync().wallet.settings;
        var amountUnit = txFormatService.satToUnit(parsedAmount.amountSat);
        var btcParsedAmount = txFormatService.parseAmount($scope.wallet.coin, amountUnit, $scope.wallet.coin);

        $scope.amountBtc = btcParsedAmount.amount;
        $scope.altAmountStr = btcParsedAmount.amountUnitStr;
      } else {
        $scope.amountBtc = amount; // BTC or BCH
        $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.coin, parsedAmount.amountSat);
      }
    });
  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack(-2);
  };

  $scope.shareAddress = function() {
    if (!platformInfo.isCordova) return;
    var protocol = 'bitcoin';
    if ($scope.wallet.coin == 'bch') protocol += 'cash';
    var data = protocol + ':' + $scope.address + '?amount=' + $scope.amountBtc;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    var protocol = '';
    if ($scope.wallet.coin == 'bch' && $scope.bchAddressType == 'cashaddr') {
      protocol = 'bitcoincash:';
    }
    return protocol + $scope.address + '?amount=' + $scope.amountBtc;
  };

});
