'use strict';

(function () {

angular
  .module('copayApp.controllers')
  .controller('tabHomeController', tabHomeController);

  function tabHomeController (
    moonPayService
    , $rootScope
    , $timeout
    , $scope
    , $state
    , $stateParams
    , $ionicScrollDelegate
    , $window
    , gettextCatalog
    , lodash
    , popupService
    , ongoingProcess
    , externalLinkService
    , latestReleaseService
    , profileService
    , walletService
    , configService
    , $log
    , platformInfo
    , sendFlowService
    , storageService
    , txpModalService
    , appConfigService
    , startupService
    , addressbookService
    , bwcError
    , nextStepsService
    , buyAndSellService
    , homeIntegrationsService
    , bitpayCardService
    , timeService
    , $ionicNavBarDelegate
    , bitcoincomService
    ) {

    var wallet;
    var listeners = [];
    var notifications = [];
    var isBuyBitcoinAllowed = false;

    $scope.externalServices = {};
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = appConfigService.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;
    $scope.showServices = false;

    $scope.vm = {
      onSettings: onSettings
      , onWallet: onWallet
      , onBuyBitcoin: onBuyBitcoin
    };

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.enter", onEnter);
    $scope.$on("$ionicView.afterEnter", onAfterEnter);
    $scope.$on("$ionicView.leave", onLeave);

    moonPayService.getCountryByIpAddress().then(function onGetCountrByIpAddress(user) {
      isBuyBitcoinAllowed = user && user.isAllowed || false;
    });


    function onAfterEnter () {
      startupService.ready();
    };

    function onBeforeEnter (event, data) {

      if ($window.StatusBar) {
        $window.StatusBar.styleDefault();
        StatusBar.backgroundColorByHexString('#FBFCFF');
      }

      if (!$scope.homeTip) {
        storageService.getHomeTipAccepted(function onGetHomeTipAccepted(error, value) {
          $scope.homeTip = (value == 'accepted') ? false : true;
        });
      }

      latestReleaseService.checkLatestRelease(function onCheckLatestRelease(err, newReleaseData) {
        if (err) {
          $log.warn(err);
          return;
        }
        if (newReleaseData) {
          $scope.newRelease = true;
          $scope.newReleaseText = gettextCatalog.getString('There is a new version of {{appName}} available', {
            appName: $scope.name
          });
          $scope.newReleaseNotes = newReleaseData.releaseNotes;
        }
      });
    }

    function onEnter(event, data) {
      $ionicNavBarDelegate.showBar(true);
      updateAllWallets();

      addressbookService.list(function onList(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};
      });

      listeners = [
        $rootScope.$on('bwsEvent', function onBwsEvent(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();

        }),
        $rootScope.$on('Local/TxAction', function onAction(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();
        }),
        // BWS transaction events don't fire on $rootScope.  This handler
        // is here to update the balance in the UI when a CashShuffle
        // transaction completes in the background.
        $rootScope.$on('cashshuffle-update-ui', function onAction(event, coinData, wallet) {

          if (wallet) {
            console.log('Updating balances after cashshuffle event', wallet);
            updateWallet(wallet);
          }

        })
      ];

      $scope.buyAndSellItems = buyAndSellService.getLinked();
      $scope.homeIntegrations = homeIntegrationsService.get();

      bitpayCardService.get({}, function onGet(err, cards) {
        $scope.bitpayCardItems = cards;
      });

      configService.whenAvailable(function onWhenAvailable(config) {
        $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) getNotifications();

        if (config.hideNextSteps.enabled) {
          $scope.nextStepsItems = null;
        } else {
          $scope.nextStepsItems = nextStepsService.get();
        }

        $scope.showServices = true;

        $timeout(function onTimeout() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    }
    
    function onSettings() {
      $state.go('tabs.settings', {});
    }

    function onBuyBitcoin() {
      if (isBuyBitcoinAllowed) {
        moonPayService.start();
      } else {
        var os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';
        externalLinkService.open('https://purchase.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os);
      }
    }

    function onLeave (event, data) {
      lodash.each(listeners, function onEach(x) {
        x();
      });
    }

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };

    $scope.startFreshSend = function() {
      sendFlowService.start();
    }

    $scope.showUpdatePopup = function() {
      latestReleaseService.showUpdatePopup();
    };

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        $state.transitionTo('tabs.wallet.tx-details', {
          txid: n.txid,
          walletId: n.walletId
        });
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) {
          txpModalService.open(txp);
        } else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(wallet, n.txpId, function onGetTxp(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    function onWallet(wallet) {
      if (!wallet.isComplete()) {
        return $state.go('tabs.copayers', {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go('tabs.wallet', {
        walletId: wallet.credentials.walletId
      });
    };

    function updateTxps() {
      profileService.getTxps({
        limit: 3
      }, function onGetTxps(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function onTimeout() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      })
    };

    function updateAllWallets(cb) {
      var wallets = [];
      $scope.walletsBtc = profileService.getWallets({coin: 'btc'});
      $scope.walletsBch = lodash.sortByOrder(profileService.getWallets({coin: 'bch'}), ['isCashShuffleWallet']);

      lodash.each($scope.walletsBtc, function onEach(wBtc) {
        wallets.push(wBtc);
      });

      lodash.each($scope.walletsBch, function onEach(wBch) {
        wallets.push(wBch);
      });

      if (lodash.isEmpty(wallets)) return;

      var i = wallets.length;
      var j = 0;

      lodash.each(wallets, function onEach(wallet) {
        walletService.invalidateCache(wallet); // Temporary solution, to have the good balance, when we ask to reload the wallets.
        walletService.getStatus(wallet, {}, function onGetStatus(err, status) {
          if (err) {

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
          } else {
            wallet.error = null;
            wallet.status = status;

            // TODO service refactor? not in profile service
            profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function onSetLastKnownBalance() {});
          }
          if (++j == i) {
            updateTxps();
            if (cb !== undefined) {
              cb();
            }
          }
          $scope.walletsWithFunds = profileService.getWallets({hasFunds: true});
        });
      });
    };

    function updateWallet(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function onGetStatus(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();
      });
    };

    function getNotifications() {
      profileService.getNotifications({
        limit: 3
      }, function onGetNotifications(err, notifications, total) {
        if (err) {
          $log.error(err);
          return;
        }

        if (!notifications) return;

        var txIdList = [];

        for (var i=0; i<notifications.length; i++) {
            var txId = notifications[i].txid;
            if (txIdList.includes(txId)) {
                notifications.splice(i, 1);
                i = i - 1;
            } else {
                txIdList.push(txId)
            }
        }

        $scope.notifications = notifications;
        $timeout(function onTimeout() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    $scope.hideHomeTip = function() {
      storageService.setHomeTipAccepted('accepted', function onSetHomeTipAccepted() {
        $scope.homeTip = false;
        $timeout(function onTimeout() {
          $scope.$apply();
        })
      });
    };


    $scope.onRefresh = function() {
      $timeout(function onTimeout() {
        $scope.$broadcast('scroll.refreshComplete');
      }, 300);
      updateAllWallets();
    };

  }
})();
