'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($interval, $rootScope, $scope, $timeout, $log, $ionicModal, $state, $ionicHistory, $ionicPopover, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService, bwcError, bitcoinCashJsService, $ionicNavBarDelegate, sendFlowService, txFormatService, soundService, clipboardService) {

  var CLOSE_NORMAL = 1000;
  var listeners = [];
  $scope.bchAddressType = { type: 'cashaddr' };
  var bchAddresses = {};
  $scope.showingPaymentReceived = false;

  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  var balanceChecker = null;
  var currentAddressSocket = null;
  var paymentSubscriptionObj = { op:'addr_sub' };
  var previousTotalBalanceSat = 0;

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
      currentAddressSocket = new WebSocket('wss://bwscash.bitcoin.com/ws/v1/address');
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
    if ($scope.wallet.coin == 'bch') {
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
    } else {
      //We need to keep this for BTC as it is using the old websocket
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
      }], [channel, "adjust", 'leanplum']);
      window.BitAnalytics.LogEventHandlers.postEvent(log);

      if ($state.current.name === "tabs.receive") {
        soundService.play('misc/payment_received.mp3');
      }

      // Notify new tx
      $scope.$emit('bwsEvent', $scope.wallet.id);

      $scope.$apply(function () {
        $scope.showingPaymentReceived = true;
      });

      updateWallet();
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
    if (balanceChecker) {
      $interval.cancel(balanceChecker);
      balanceChecker = null;
    }
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    initVariables();
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
    initVariables();
    setPreviousBalanceFromWallet();
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

  function initVariables() {
    if (balanceChecker) {
      $internval.cancel(balanceChecker);
      balanceChecker = null;
    }
    previousTotalBalanceSat = 0;
  }

  function setPreviousBalanceFromWallet() {
    var wallet = $scope.wallet; // For convenience

    if (wallet.status && wallet.status.isValid) {
      previousTotalBalanceSat = wallet.status.totalBalanceSat;
    } else if (wallet.cachedStatus && wallet.cachedStatus.isValid) {
      previousTotalBalanceSat = wallet.cachedStatus.totalBalanceSat;
    } else {
      $log.warn('Wallet balance not available when receiving.');
    }
  }

  function updateWallet() {
    if ($scope.wallet) {
      $log.debug('Updating wallet:' + $scope.wallet.name);

      balanceChecker = $interval(function onInterval() {
        walletService.invalidateCache($scope.wallet); // Temporary solution, to have the good balance, when we ask to reload the wallets.
        walletService.getStatus($scope.wallet, {}, function onGetStatus(err, status) {
          if (err) {
            $log.error(err);
            return;
          }

          if (status && status.isValid) {
            var totalBalanceSat = status.totalBalanceSat;
            var balanceChanged = totalBalanceSat !== previousTotalBalanceSat;
            previousTotalBalanceSat = totalBalanceSat;
            console.log('totalBalanceSat: ' + totalBalanceSat + ', changed: ' + balanceChanged);
            if (balanceChanged) {
              $scope.wallet.status = status;
              $scope.wallets = profileService.getWallets();
              $timeout(function () {
                $scope.$apply();
              }, 10);
              $interval.cancel(balanceChecker);
            }
          }
        });

      }, 1000);

    }

  }
});
