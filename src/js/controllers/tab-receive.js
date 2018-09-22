'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($rootScope, $scope, $timeout, $log, $ionicModal, $state, $ionicHistory, $ionicPopover, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService, bwcError, bitcoinCashJsService, $ionicNavBarDelegate, sendFlowService, txFormatService, soundService, clipboardService) {

  var CLOSE_NORMAL = 1000;
  var listeners = [];
  $scope.bchAddressType = { type: 'cashaddr' };
  var bchAddresses = {};
  $scope.showingPaymentReceived = false;

  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  var currentAddressSocket = null;
  var paymentSubscriptionObj = { op:'addr_sub' };

  $scope.displayBalanceAsFiat = true;
  $scope.$on('$ionicView.beforeLeave', onBeforeLeave);

  $scope.requestSpecificAmount = function() {
    sendFlowService.start({
      toWalletId: $scope.wallet.credentials.walletId,
      isRequestAmount: true
    });
  };


  function connectSocket() {
    // Close existing socket if not connected with current address
    if (currentAddressSocket) {
      currentAddressSocket.close([CLOSE_NORMAL]);
    }

    if ($scope.wallet.coin === 'bch') {
      // listen to bch address
      currentAddressSocket = new WebSocket('wss://ws.blockchain.info/bch/inv');
      paymentSubscriptionObj.addr = $scope.addrBchLegacy;
    } else {
      // listen to btc address
      currentAddressSocket = new WebSocket('wss://ws.blockchain.info/inv');
      paymentSubscriptionObj.addr = $scope.addr;
    }

    // create subscription to address
    var msg = JSON.stringify(paymentSubscriptionObj);
    currentAddressSocket.onopen = function (event) {
      currentAddressSocket.send(msg);
    };

    // listen for response
    currentAddressSocket.onmessage = function (event) {
      //console.log("message received:" + event.data);
      receivedPayment(event.data);
    };

    currentAddressSocket.onclose = function(event) {
      if (event.code !== CLOSE_NORMAL) {
        $log.debug('Socket was closed abnormally. Reconnect will be attempted in 1 second.');
        $timeout(function() {
          connectSocket();
        }, 1000);
      }
    };

    currentAddressSocket.onerror = function(err) {
      console.error('Socket encountered error: ', err, 'Closing socket');
      currentAddressSocket.close();
    };
  }

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
      } else {
        $scope.addr = addr;
      }

      connectSocket();

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

  var receivedPayment = function(data) {
    data = JSON.parse(data);
    //example payment data
      /*{
        "op": "utx",
        "x": {
            "lock_time": 0,
            "ver": 1,
            "size": 192,
            "inputs": [
                {
                    "sequence": 4294967295,
                    "prev_out": {
                        "spent": true,
                        "tx_index": 99005468,
                        "type": 0,
                        "addr": "1BwGf3z7n2fHk6NoVJNkV32qwyAYsMhkWf",
                        "value": 65574000,
                        "n": 0,
                        "script": "76a91477f4c9ee75e449a74c21a4decfb50519cbc245b388ac"
                    },
                    "script": "483045022100e4ff962c292705f051c2c2fc519fa775a4d8955bce1a3e29884b2785277999ed02200b537ebd22a9f25fbbbcc9113c69c1389400703ef2017d80959ef0f1d685756c012102618e08e0c8fd4c5fe539184a30fe35a2f5fccf7ad62054cad29360d871f8187d"
                }
            ],
            "time": 1440086763,
            "tx_index": 99006637,
            "vin_sz": 1,
            "hash": "0857b9de1884eec314ecf67c040a2657b8e083e1f95e31d0b5ba3d328841fc7f",
            "vout_sz": 1,
            "relayed_by": "127.0.0.1",
            "out": [
                {
                    "spent": false,
                    "tx_index": 99006637,
                    "type": 0,
                    "addr": "1A828tTnkVFJfSvLCqF42ohZ51ksS3jJgX",
                    "value": 65564000,
                    "n": 0,
                    "script": "76a914640cfdf7b79d94d1c980133e3587bd6053f091f388ac"
                }
            ]
        }
    }*/

    if (data.op == "utx") {
      var watchAddress = $scope.wallet.coin == 'bch' ? $scope.addrBchLegacy : $scope.addr;
      for (var i = 0; i < data.x.out.length; i++) {
        if (data.x.out[i].addr == watchAddress) {
          $scope.paymentReceivedAmount = txFormatService.formatAmount(data.x.out[i].value, 'full');
          $scope.paymentReceivedAlternativeAmount = '';  // For when a subsequent payment is received.
          txFormatService.formatAlternativeStr($scope.wallet.coin, data.x.out[i].value, function(alternativeStr){
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
      }], [channel, "adjust"]);
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

  function onBeforeLeave() {
    currentAddressSocket.close([CLOSE_NORMAL]);
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
});
