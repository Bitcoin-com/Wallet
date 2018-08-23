'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess, bannerService, communityService, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, sendFlowService, storageService, txpModalService, appConfigService, startupService, addressbookService, bwcError, nextStepsService, buyAndSellService, homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService, bitcoincomService, pricechartService, firebaseEventsService, servicesService, shapeshiftService, $ionicNavBarDelegate, signVerifyMessageService) {
    var wallet;
    var listeners = [];
    var notifications = [];
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
    $scope.bannerIsLoading = true;
    $scope.bannerImageUrl = '';
    $scope.bannerUrl = '';


    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    $scope.$on("$ionicView.enter", onEnter);
    $scope.$on("$ionicView.afterEnter", onAfterEnter);
    $scope.$on("$ionicView.leave", onLeave);

    function onAfterEnter () {
      startupService.ready();

      bannerService.getBanner(function (banner) {
        $scope.bannerImageUrl = banner.imageURL;
        $scope.bannerUrl = banner.url;
        $scope.bannerIsLoading = false;
      });
    };

    function onBeforeEnter (event, data) {

      if (!$scope.homeTip) {
        storageService.getHomeTipAccepted(function(error, value) {
          $scope.homeTip = (value == 'accepted') ? false : true;
        });
      }

      if ($scope.isNW) {
        latestReleaseService.checkLatestRelease(function(err, newRelease) {
          if (err) {
            $log.warn(err);
            return;
          }
          if (newRelease) {
            $scope.newRelease = true;
            $scope.updateText = gettextCatalog.getString('There is a new version of {{appName}} available', {
              appName: $scope.name
            });
          }
        });
      }
    };

    function onEnter(event, data) {
      $ionicNavBarDelegate.showBar(true);
      updateAllWallets();

      addressbookService.list(function(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};
      });

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();

        }),
        $rootScope.$on('Local/TxAction', function(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();
        })
      ];


      $scope.buyAndSellItems = buyAndSellService.getLinked();
      $scope.homeIntegrations = homeIntegrationsService.get();

      bitpayCardService.get({}, function(err, cards) {
        $scope.bitpayCardItems = cards;
      });

      configService.whenAvailable(function(config) {
        $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) getNotifications();

        if (config.hideNextSteps.enabled) {
          $scope.nextStepsItems = null;
        } else {
          $scope.nextStepsItems = nextStepsService.get();
        }

        $scope.showServices = true;

        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    function onLeave (event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    };

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };

    $scope.startFreshSend = function() {
      sendFlowService.clear();
      $state.go('tabs.send');
    }

    $scope.openExternalLink = function() {
      var url = 'https://github.com/Bitcoin-com/Wallet/releases/latest';
      var optIn = true;
      var title = gettextCatalog.getString('Update Available');
      var message = gettextCatalog.getString('An update to this app is available. For your security, please update to the latest version.');
      var okText = gettextCatalog.getString('View Update');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openBannerUrl = function() {
      externalLinkService.open($scope.bannerUrl, false);
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
          walletService.getTxp(wallet, n.txpId, function(err, txp) {
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

    $scope.openWallet = function(wallet) {
      if (!wallet.isComplete()) {
        return $state.go('tabs.copayers', {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go('tabs.wallet', {
        walletId: wallet.credentials.walletId
      });
    };

    var updateTxps = function() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      })
    };

    var updateAllWallets = function(cb) {
      var wallets = [];
      $scope.walletsBtc = profileService.getWallets({coin: 'btc'});
      $scope.walletsBch = profileService.getWallets({coin: 'bch'});

      lodash.each($scope.walletsBtc, function(wBtc) {
        wallets.push(wBtc);
      });

      lodash.each($scope.walletsBch, function(wBch) {
        wallets.push(wBch);
      });

      if (lodash.isEmpty(wallets)) return;

      var i = wallets.length;
      var j = 0;

      lodash.each(wallets, function(wallet) {
        walletService.invalidateCache(wallet); // Temporary solution, to have the good balance, when we ask to reload the wallets.
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {

            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

            $log.error(err);
          } else {
            wallet.error = null;
            wallet.status = status;

            // TODO service refactor? not in profile service
            profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function() {});
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

    var updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();
      });
    };

    var getNotifications = function() {
      profileService.getNotifications({
        limit: 3
      }, function(err, notifications, total) {
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
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    $scope.hideHomeTip = function() {
      storageService.setHomeTipAccepted('accepted', function() {
        $scope.homeTip = false;
        $timeout(function() {
          $scope.$apply();
        })
      });
    };


    $scope.onRefresh = function() {
      $timeout(function() {
        $scope.$broadcast('scroll.refreshComplete');
      }, 300);
      updateAllWallets();
    };

  });
