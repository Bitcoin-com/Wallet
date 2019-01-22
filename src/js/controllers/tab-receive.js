'use strict';

(function(){
  angular
    .module('copayApp.controllers')
    .controller('tabReceiveController', tabReceiveController);

  function tabReceiveController(
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
  ) {
    var listeners = [];
    $scope.bchAddressType = { type: 'cashaddr' };
    var bchAddresses = {};
    $scope.showingPaymentReceived = false;

    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;

    $scope.displayBalanceAsFiat = true;
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);


    $scope.requestSpecificAmount = function() {
      sendFlowService.start({
        toWalletId: $scope.wallet.credentials.walletId,
        isRequestAmount: true
      });
    };


    

    $scope.setAddress = function(newAddr, copyAddress) {
      $scope.addr = null;
      if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) return;
      $scope.generatingAddress = true;
      walletService.getAddress($scope.wallet, newAddr, function(err, addr) {
        $scope.generatingAddress = false;

        if (err) {
          //Error is already formated
          popupService.showAlert(err);
        }

        if ($scope.wallet.coin === 'bch') {
          bchAddresses = bitcoinCashJsService.translateAddresses(addr);
          $scope.addr = bchAddresses[$scope.bchAddressType.type];
          $scope.addrBchLegacy = bchAddresses['legacy'];
          walletAddressListenerService.listenTo($scope.addrBchLegacy, $scope.wallet, $scope, _receivedPayment);
        } else {
          $scope.addr = addr;
          walletAddressListenerService.listenTo($scope.addr, $scope.wallet, $scope, _receivedPayment);
        }

        if (copyAddress === true) {
          try {
            clipboardService.copyToClipboard($scope.wallet.coin == 'bch' && $scope.bchAddressType.type == 'cashaddr' ? 'bitcoincash:' + $scope.addr : $scope.addr);
          } catch (error) {
            $log.debug('Error copying to clipboard:');
            $log.debug(error);
          }
        }

        $timeout(function() {
          $scope.$apply();
        }, 10);
      });
    };

    function _receivedPayment(data) {
      data = JSON.parse(data);
      if (data) {
        var watchAddress = $scope.wallet.coin == 'bch' ? $scope.addrBchLegacy : $scope.addr;
        for (var i = 0; i < data.outputs.length; i++) {
          if (data.outputs[i].address == watchAddress) {
            $scope.paymentReceivedAmount = txFormatService.formatAmount(data.outputs[i].value, 'full');
            $scope.paymentReceivedAlternativeAmount = '';  // For when a subsequent payment is received.
            txFormatService.formatAlternativeStr($scope.wallet.coin, data.outputs[i].value, function(alternativeStr){
              if (alternativeStr) {
                $scope.$apply(function () {
                  $scope.paymentReceivedAlternativeAmount = alternativeStr;
                });
              }
            });
          }
        }
        $scope.paymentReceivedCoin = $scope.wallet.coin;

        var channel = "ga";
        if (platformInfo.isCordova) {
          channel = "firebase";
        }
        var log = new window.BitAnalytics.LogEvent("transfer_success", [{
          "coin": $scope.wallet.coin,
          "type": "incoming"
        }, {}, {}], [channel, 'leanplum']);
        window.BitAnalytics.LogEventHandlers.postEvent(log);

        if ($state.current.name === "tabs.receive") {
          soundService.play('misc/payment_received.mp3');
        } 

        // Notify new tx
        $scope.$emit('bwsEvent', $scope.wallet.id);

        $scope.$apply(function () {
          $scope.showingPaymentReceived = true;
        });

      }
    }

    $scope.displayAddress = function(type) {
      $scope.bchAddressType.type = type;
      $scope.addr = bchAddresses[$scope.bchAddressType.type];
    }

    $scope.goCopayers = function() {
      $ionicHistory.removeBackView();
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.copayers', {
          walletId: $scope.wallet.credentials.walletId
        });
      }, 100);
    };

    
    $scope.openBackupNeededModal = function() {
      $ionicModal.fromTemplateUrl('views/includes/backupNeededPopup.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.BackupNeededModal = modal;
        $scope.BackupNeededModal.show();
      });
    };

    $scope.close = function() {
      $scope.BackupNeededModal.hide();
      $scope.BackupNeededModal.remove();
    };

    $scope.doBackup = function() {
      $scope.close();
      $scope.goToBackupFlow();
    };

    $scope.goToBackupFlow = function() {
      $state.go('tabs.receive.backupWarning', {
        from: 'tabs.receive',
        walletId: $scope.wallet.credentials.walletId
      });
    };

    $scope.shouldShowReceiveAddressFromHardware = function() {
      var wallet = $scope.wallet;
      if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
        return (wallet.credentials.hwInfo.name == walletService.externalSource.intelTEE.id);
      } else {
        return false;
      }
    };

    $scope.showReceiveAddressFromHardware = function() {
      var wallet = $scope.wallet;
      if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
        walletService.showReceiveAddressFromHardware(wallet, $scope.addr, function() {});
      }
    };

    function _onBeforeLeave() {
      console.log('tab-receive _onBeforeLeave()');
      walletAddressListenerService.stop();
    }
  
    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.wallets = profileService.getWallets();
      $scope.singleWallet = $scope.wallets.length == 1;


      if (!$scope.wallets[0]) return;

      var selectedWallet = null;
      if (data.stateParams.walletId) { // from walletDetails
        selectedWallet = checkSelectedWallet(profileService.getWallet(data.stateParams.walletId), $scope.wallets);
      } else {
        // select first wallet if no wallet selected previously
        selectedWallet = checkSelectedWallet($scope.wallet, $scope.wallets);
      }
      $scope.onWalletSelect(selectedWallet);
      $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          // Update current address
          if ($scope.wallet && walletId == $scope.wallet.id && type == 'NewIncomingTx') $scope.setAddress(true);
        })
      ];

      configService.whenAvailable(function(_config) {
        $scope.displayBalanceAsFiat = _config.wallet.settings.priceDisplay === 'fiat';
      });
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.showingPaymentReceived = false;
      $ionicNavBarDelegate.showBar(true);
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      console.log('tab-receive leave');
      lodash.each(listeners, function(x) {
        x();
      });
    });

    var checkSelectedWallet = function(wallet, wallets) {
      if (!wallet) return wallets[0];
      var w = lodash.find(wallets, function(w) {
        return w.id == wallet.id;
      });
      if (!w) return wallets[0];
      return wallet;
    }

    var setProtocolHandler = function() {
      $scope.protocolHandler = walletService.getProtocolHandler($scope.wallet);
    }

    $scope.$watch('showWallets' , function () {
      if ($scope.showingPaymentReceived) {
        $scope.showingPaymentReceived = false;
      }
    });

    $scope.onWalletSelect = function(wallet) {
      $scope.wallet = wallet;
      setProtocolHandler();
      $scope.setAddress();
    };

    $scope.hidePaymentScreen = function() {
      $scope.showingPaymentReceived = false;
    };

    $scope.showWalletSelector = function() {
      if ($scope.singleWallet) return;
      $scope.walletSelectorTitle = gettextCatalog.getString('Select a wallet');
      $scope.showWallets = true;
    };

    $scope.shareAddress = function() {
      if (!$scope.isCordova) return;
      var protocol = 'bitcoin';
      if ($scope.wallet.coin == 'bch') protocol += 'cash';
      window.plugins.socialsharing.share(protocol + ':' + $scope.addr, null, null, null);
    }
    
  }

})();
