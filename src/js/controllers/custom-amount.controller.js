'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('customAmountController', customAmountController);
    
  function customAmountController(
    bitcoinCashJsService
    , configService
    , $ionicHistory
    , $log
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
    vm.altAmountStr = '';
    vm.amountBtc = '';
    vm.amountReceived = '';
    vm.amountReceivedCurrency = '';
    vm.amountUnitStr = '';
    vm.coin = '';
    vm.displayAddress = '';
    vm.selectedPriceDisplay = '';
    vm.showingPaymentReceived = false;
    vm.showingWrongPaymentReceived = false;
    vm.showShareButton = false;
    vm.paymentDelta = 0;

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);
    $scope.$on("$ionicView.beforeLeave", _onBeforeLeave);
    
    var coinsFromSatoshis = 0;
    var listeningAddressLegacy = '';
    var satoshisRequested = 0;

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

      vm.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

      $scope.wallet = profileService.getWallet(walletId);

      _setProtocolHandler();

      walletService.getAddress($scope.wallet, false, function(err, addr) {
        if (!addr) {
          _showErrorAndBack('Error', 'Could not get the address');
          return;
        }

        $scope.bchAddressType = 'cashaddr';
        var bchAddresses = {};

        if ($scope.wallet.coin == 'bch') {
            bchAddresses = bitcoinCashJsService.translateAddresses(addr);
            vm.displayAddress = bchAddresses[$scope.bchAddressType];
            listeningAddressLegacy = bchAddresses['legacy'];
        } else {
            vm.displayAddress = addr;
            listeningAddressLegacy = addr;
        }
        
        vm.coin = $scope.wallet.coin;
        var satoshis = parseInt(data.stateParams.amount, 10);
        var parsedAmount = txFormatService.parseAmount(
          $scope.wallet.coin,
          satoshis,
          'sat');

        satoshisRequested = parsedAmount.amountSat;  

        // Amount in USD or BTC
        var amount = parsedAmount.amount;
        var currency = parsedAmount.currency;
        vm.amountUnitStr = parsedAmount.amountUnitStr;

        configService.whenAvailable(function onConfigAvailable(config) {
          vm.selectedPriceDisplay = config.wallet.settings.priceDisplay;
          coinsFromSatoshis = 1 / config.wallet.settings.unitToSatoshi;

          $timeout(function () {
            $scope.$apply();
          });
        });

        if (currency !== 'BTC' && currency !== 'BCH') {
          // Convert to BTC or BCH
          var amountUnit = txFormatService.satToUnit(satoshisRequested);
          var btcParsedAmount = txFormatService.parseAmount($scope.wallet.coin, amountUnit, $scope.wallet.coin);

          vm.amountBtc = btcParsedAmount.amount;
          vm.altAmountStr = btcParsedAmount.amountUnitStr;
        } else {
          vm.amountBtc = amount; // BTC or BCH
          vm.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.coin, satoshisRequested);
        }

        walletAddressListenerService.listenTo(listeningAddressLegacy, $scope.wallet, $scope, _receivedPayment);
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
      vm.displayAddress = bchAddresses[$scope.bchAddressType];
    }

    function onShareAddress() {
      if (!platformInfo.isCordova) return;
      var protocol = 'bitcoin';
      if ($scope.wallet.coin == 'bch') protocol += 'cash';
      var data = protocol + ':' + vm.displayAddress + '?amount=' + vm.amountBtc;
      window.plugins.socialsharing.share(data, null, null, null);
    }

    function onCopyToClipboard() {
      var protocol = '';
      if ($scope.wallet.coin == 'bch' && $scope.bchAddressType == 'cashaddr') {
        protocol = 'bitcoincash:';
      }
      return protocol + vm.displayAddress + '?amount=' + vm.amountBtc;
    }

    function _receivedPayment(data) {
      data = JSON.parse(data);

      if (data) {
        $log.debug('customAmountController Received payment data: ' + data);

        var satoshisReceived = 0;
        data.outputs.forEach(function onOutput(output) {
          if (output.address === listeningAddressLegacy) {
            satoshisReceived += output.value;
          }
        });

        vm.showingPaymentReceived = satoshisReceived === satoshisRequested;
        vm.showingWrongPaymentReceived = !vm.showingPaymentReceived;
        vm.paymentDelta = satoshisReceived - satoshisRequested;

        vm.amountReceived = (coinsFromSatoshis * satoshisReceived).toFixed(8);
        vm.amountReceivedCurrency = $scope.wallet.coin.toUpperCase();

        $scope.$apply();

        if (vm.selectedPriceDisplay === 'fiat') {
          txFormatService.formatAlternativeStr($scope.wallet.coin, satoshisReceived, function onFormatted(formatted) {
            if (formatted) {
              $scope.$apply(function onApply(){
                vm.amountReceived = formatted;
                vm.amountReceivedCurrency = '';
              });
            }
          });
        }
      }
    }

  }

})();