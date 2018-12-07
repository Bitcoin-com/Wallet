'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('customAmountController', customAmountController);
    
  function customAmountController(
    bitcoinCashJsService
    , configService
    , $ionicHistory
    , platformInfo
    , popupService
    , profileService
    , $scope
    , $timeout
    , txFormatService
    , walletAddressListenerService
    , walletService
    ) {
    var vm = this;
    
    // Functions
    vm.onClose = onClose;
    vm.onCopyToClipboard = onCopyToClipboard;
    vm.onDisplayAddress = onDisplayAddress;
    vm.onShareAddress = onShareAddress;

    // Variables
    vm.showingPaymentReceived = false;

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", _onBeforeLeave);

    var currentAddressSocket = {};
    var paymentSubscriptionObj = { op:"addr_sub" }
    

    function _showErrorAndBack(title, msg) {
      popupService.showAlert(title, msg, function() {
        $scope.close();
      });
    };

    function _setProtocolHandler() {
      $scope.protocolHandler = walletService.getProtocolHandler($scope.wallet);
    }

    function _onBeforeEnter(event, data) {
      var walletId = data.stateParams.toWalletId;

      if (!walletId) {
        _showErrorAndBack('Error', 'No wallet selected');
        return;
      }

      $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

      $scope.wallet = profileService.getWallet(walletId);

      _setProtocolHandler();

      walletService.getAddress($scope.wallet, false, function(err, addr) {
        if (!addr) {
          _showErrorAndBack('Error', 'Could not get the address');
          return;
        }

        $scope.bchAddressType = 'cashaddr';
        var bchAddresses = {};

        var legacyAddress = '';
        if ($scope.wallet.coin == 'bch') {
            bchAddresses = bitcoinCashJsService.translateAddresses(addr);
            $scope.address = bchAddresses[$scope.bchAddressType];
            legacyAddress = bchAddresses['legacy'];
        } else {
            $scope.address = addr;
            legacyAddress = addr;
        }
        
        $scope.coin = $scope.wallet.coin;
        var satoshis = parseInt(data.stateParams.amount, 10);
        var parsedAmount = txFormatService.parseAmount(
          $scope.wallet.coin,
          satoshis,
          'sat');

        // Amount in USD or BTC
        var amount = parsedAmount.amount;
        var currency = parsedAmount.currency;
        $scope.amountUnitStr = parsedAmount.amountUnitStr;

        configService.whenAvailable(function onConfigAvailable(config) {
          $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;

          $timeout(function () {
            $scope.$apply();
          });
        });

        if (currency !== 'BTC' && currency !== 'BCH') {
          // Convert to BTC or BCH
          var amountUnit = txFormatService.satToUnit(parsedAmount.amountSat);
          var btcParsedAmount = txFormatService.parseAmount($scope.wallet.coin, amountUnit, $scope.wallet.coin);

          $scope.amountBtc = btcParsedAmount.amount;
          $scope.altAmountStr = btcParsedAmount.amountUnitStr;
        } else {
          $scope.amountBtc = amount; // BTC or BCH
          $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.coin, parsedAmount.amountSat);
        }

        walletAddressListenerService.listenTo(legacyAddress, $scope.wallet, $scope, _receivedPayment);
      });
    };

    function _onBeforeLeave() {
      walletAddressListenerService.stop();
    }

    function onClose() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $ionicHistory.goBack(-2);
    }

    function onDisplayAddress(type) {
      $scope.bchAddressType = type;
      $scope.address = bchAddresses[$scope.bchAddressType];
    }

    function onShareAddress() {
      if (!platformInfo.isCordova) return;
      var protocol = 'bitcoin';
      if ($scope.wallet.coin == 'bch') protocol += 'cash';
      var data = protocol + ':' + $scope.address + '?amount=' + $scope.amountBtc;
      window.plugins.socialsharing.share(data, null, null, null);
    }

    function onCopyToClipboard() {
      var protocol = '';
      if ($scope.wallet.coin == 'bch' && $scope.bchAddressType == 'cashaddr') {
        protocol = 'bitcoincash:';
      }
      return protocol + $scope.address + '?amount=' + $scope.amountBtc;
    }

    function _receivedPayment(data) {
      data = JSON.parse(data);

      if (data) {
        $scope.showingPaymentReceived = true;
        $scope.$apply();
      }
    }

  }

})();