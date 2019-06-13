'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function(
  satoshiDiceService
  , $scope
  , $rootScope
  , $interval
  , $timeout
  , $filter
  , $log
  , $ionicModal
  , $ionicPopover
  , $state
  , $stateParams
  , $ionicHistory
  , profileService
  , lodash
  , configService
  , platformInfo
  , walletService
  , txpModalService
  , externalLinkService
  , popupService
  , addressbookService
  , sendFlowService
  , storageService
  , $ionicScrollDelegate
  , $window
  , bwcError
  , gettextCatalog
  , timeService
  , feeService
  , appConfigService
  , rateService
  , walletHistoryService
  , moonPayService
  ) {
  // Desktop can display 13 rows of transactions, bump it up to a nice round 15.
  var DISPLAY_PAGE_SIZE = 15;
  var currentTxHistoryDisplayPage = 0;
  var completeTxHistory = []
  var listeners = [];

  // For gradual migration for doing it properly
  $scope.vm = {
    allowInfiniteScroll: false,
    gettingCachedHistory: true,
    gettingInitialHistory: true,
    updatingTxHistory: false,
    fetchedAllTxHistory: false,
    //updateTxHistoryError: false
    updateTxHistoryFailed: false,

    getSatoshiDiceIconUrl: getSatoshiDiceIconUrl,
    openWalletSettings: openWalletSettings
  };

  // Need flag for when to allow infinite scroll at bottom
  // - ie not when loading initial data and there is no more cached data

  $scope.amountIsCollapsible = false;
  $scope.color = '#888888';
  
  $scope.filteredTxHistory = [];
  $scope.isCordova = platformInfo.isCordova;
  $scope.isAndroid = platformInfo.isAndroid;
  $scope.isIOS = platformInfo.isIOS;
  $scope.isSearching = false;
  $scope.openTxpModal = txpModalService.open;
  $scope.requiresMultipleSignatures = false;
  $scope.showBalanceButton = false;
  $scope.status = null;
  // Displaying 50 transactions when entering the screen takes a while, so only display a subset
  // of everything we have, not the complete history.
  $scope.txHistory = [];                 // This is what is displayed
  $scope.txHistorySearchResults = [];
  $scope.txps = [];
  $scope.updatingStatus = false;
  $scope.updateStatusError = null;
  $scope.updatingTxHistoryProgress = 0;
  $scope.wallet = null;
  $scope.walletId = '';
  $scope.walletNotRegistered = false;
  $scope.isBuyBitcoinAllowed = false
  $scope.walletBackgroundUrl = ""

  $scope.walletColorMap = [
      '../img/colors/cinnabar.png',
      '../img/colors/carrot-orange.png',
      '../img/colors/light-salmon.png',
      '../img/colors/metallic-gold.png',
      '../img/colors/feijoa.png',
      '../img/colors/shamrock.png',
      '../img/colors/light-orange.png',
      '../img/colors/dark-grey.png',
      '../img/colors/turquoise-blue.png',
      '../img/colors/cornflower-blue.png',
     '../img/colors/free-speech-blue.png',
     '../img/colors/deep-lilac.png',
     '../img/colors/free-speech-magenta.png',
    '../img/colors/brilliant-rose.png',
    '../img/colors/light-slate-grey.png'
  ]

  moonPayService.getCountryByIpAddress().then(function onGetCountrByIpAddress(user) {
    $scope.isBuyBitcoinAllowed = user.isAllowed;
  });

  var channel = "ga";
  if (platformInfo.isCordova) {
    channel = "firebase";
  }
  var log = new window.BitAnalytics.LogEvent("wallet_details_open", [{}, {}, {}], [channel, 'leanplum']);
  window.BitAnalytics.LogEventHandlers.postEvent(log);

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  var setPendingTxps = function(txps) {
    if (!txps) {
      $scope.txps = [];
      return;
    }
    $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
  };

  var analyzeUtxosDone;

  var analyzeUtxos = function() {
    if (analyzeUtxosDone) return;

    feeService.getFeeLevels($scope.wallet.coin, function(err, levels) {
      if (err) return;
      walletService.getLowUtxos($scope.wallet, levels, function(err, resp) {
        if (err || !resp) return;
        analyzeUtxosDone = true;
        $scope.lowUtxosWarning = resp.warning;
      });
    });
  };

  var updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = null;
    $scope.walletNotRegistered = false;
    $scope.vm.fetchedAllTxHistory = false;

    walletService.getStatus($scope.wallet, {
      force: !!force,
    }, function(err, status) {
      $scope.updatingStatus = false;
      if (err) {
        if (err === 'WALLET_NOT_REGISTERED') {
          $scope.walletNotRegistered = true;
        } else {
          $scope.updateStatusError = bwcError.msg(err, gettextCatalog.getString('Could not update wallet'));
        }
        $scope.status = null;
      } else {
        setPendingTxps(status.pendingTxps);
        if (!$scope.status || status.balance.totalAmount != $scope.status.balance.totalAmount) {
            $scope.status = status;
        }
      }

      $timeout(function() {
        $scope.$apply();
      });

      analyzeUtxos();

    });
  };

  function openWalletSettings() {
    $state.go('tabs.preferences', {'walletId': $scope.wallet.id, 'backToDetails': true});
  }

  $scope.openSearchModal = function() {
    $scope.color = $scope.wallet.color;
    $scope.isSearching = true;
    $scope.txHistorySearchResults = [];
    $scope.filteredTxHistory = [];

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.isSearching = false;
      $scope.searchModal.hide();
    };

    $scope.openTx = function(tx) {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $scope.close();
      $scope.openTxModal(tx);
    };
  };

  $scope.openTxModal = function(btx) {
    $scope.btx = lodash.cloneDeep(btx);
    $scope.walletId = $scope.wallet.id;
    $state.transitionTo('tabs.wallet.tx-details', {
      txid: $scope.btx.txid,
      walletId: $scope.walletId
    });
  };

  $scope.openBalanceModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/wallet-balance.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.walletBalanceModal = modal;
      $scope.walletBalanceModal.show();
    });

    $scope.close = function() {
      $scope.walletBalanceModal.hide();
    };
  };

  $scope.recreate = function() {
    walletService.recreate($scope.wallet, function(err) {
      if (err) return;
      $timeout(function() {
        walletService.startScan($scope.wallet, function() {
          $scope.updateAll(true, true);
          $scope.$apply();
        });
      });
    });
  };

  function applyCurrencyAliases(txHistory) {
    var defaults = configService.getDefaults();
    var configCache = configService.getSync();

    lodash.each(txHistory, function onTx(tx) {
      tx.amountUnitStr = $scope.wallet.coin == 'btc'
                        ? (configCache.bitcoinAlias || defaults.bitcoinAlias)
                        : (configCache.bitcoinCashAlias || defaults.bitcoinCashAlias);

      tx.amountUnitStr = tx.amountUnitStr.toUpperCase();
    });
  }

  function formatTxHistoryForDisplay(txHistory) {
    applyCurrencyAliases(txHistory);

    var config = configService.getSync();
    var fiatCode = config.wallet.settings.alternativeIsoCode;
    lodash.each(txHistory, function(t) {
      var r = rateService.toFiat(t.amount, fiatCode, $scope.wallet.coin);
      t.alternativeAmountStr = r.toFixed(2) + ' ' + fiatCode;
    });
  }


  function updateTxHistoryFromCachedData() {
    $scope.vm.gettingCachedHistory = true;
    walletHistoryService.getCachedTxHistory($scope.wallet.id, function onGetCachedTxHistory(err, txHistory){
      $scope.vm.gettingCachedHistory = false;
      if (err) {
        // Don't display an error because we are also requesting the history.
        $log.error('Error getting cached tx history.', err);
        return;
      }

      if (!txHistory) {
        $log.debug('No cached tx history.');
        return;
      }

      formatTxHistoryForDisplay(txHistory);

      completeTxHistory = txHistory;
      showHistory(false);
      $scope.$apply();
    });
  }

  function fetchAndShowTxHistory(getLatest, flushCacheOnNew) {
    $scope.vm.updatingTxHistory = true;

    walletHistoryService.updateLocalTxHistoryByPage($scope.wallet, getLatest, flushCacheOnNew, function onUpdateLocalTxHistoryByPage(err, txHistory, fetchedAllTransactions) {
      $scope.vm.gettingInitialHistory = false;
      $scope.vm.updatingTxHistory = false;
      $scope.$broadcast('scroll.infiniteScrollComplete');

      if (err) {
        $log.error('pagination Failed to get history.', err);
        $scope.vm.updateTxHistoryFailed = true;
        return;
      }

      if (fetchedAllTransactions) {
        $scope.vm.fetchedAllTxHistory = true;
      }

      formatTxHistoryForDisplay(txHistory);

      completeTxHistory = txHistory;
      showHistory(true);
      $scope.$apply();
    });
  }

  
  function showHistory(showAll) {
    if (completeTxHistory) {
      $scope.txHistory = showAll ? completeTxHistory : completeTxHistory.slice(0, (currentTxHistoryDisplayPage + 1) * DISPLAY_PAGE_SIZE);
      $scope.vm.allowInfiniteScroll = !$scope.vm.fetchedAllTxHistory && !(completeTxHistory.length === $scope.txHistory.length && $scope.vm.gettingInitialHistory);
    } else {
      $scope.vm.allowInfiniteScroll = false;
    }
  }
  

  $scope.getDate = function(txCreated) {
    var date = new Date(txCreated * 1000);
    return date;
  };

  $scope.isFirstInGroup = function(index) {
    if (index === 0) {
      return true;
    }
    var curTx = $scope.txHistory[index];
    var prevTx = $scope.txHistory[index - 1];
    return !$scope.createdDuringSameMonth(curTx, prevTx);
  };

  $scope.isLastInGroup = function(index) {
    if (index === $scope.txHistory.length - 1) {
      return true;
    }
    return $scope.isFirstInGroup(index + 1);
  };

  $scope.createdDuringSameMonth = function(curTx, prevTx) {
    return timeService.withinSameMonth(curTx.time * 1000, prevTx.time * 1000);
  };

  $scope.createdWithinPastDay = function(time) {
    return timeService.withinPastDay(time);
  };

  $scope.isDateInCurrentMonth = function(date) {
    return timeService.isDateInCurrentMonth(date);
  };

  $scope.isUnconfirmed = function(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  };

  // on-infinite="showMore()"
  $scope.showMore = function() {
    // Check if we have more than we are displaying
    if (completeTxHistory.length > $scope.txHistory.length) {
      currentTxHistoryDisplayPage++;
      showHistory(false);
      $scope.$broadcast('scroll.infiniteScrollComplete');
      return;
    }

    if ($scope.vm.updatingTxHistory) {
      return;
    }

    fetchAndShowTxHistory(false, false);
  };

  // on-refresh="onRefresh()"
  $scope.onRefresh = function() {
    $timeout(function() {
      $scope.$broadcast('scroll.refreshComplete');
    }, 300);
    $scope.updateAll(true, false);
  };

  $scope.updateAll = function(forceStatusUpdate, flushTxCacheOnNew)  {
    updateStatus(forceStatusUpdate);
    //updateTxHistory(cb);
    fetchAndShowTxHistory(true, flushTxCacheOnNew);
  };

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag($scope.wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  };

  var prevPos;
  $scope.txHistoryPaddingBottom = 0;
  function getScrollPosition() {
    var scrollPosition = $ionicScrollDelegate.getScrollPosition();

    $timeout(function() {
      getScrollPosition();
    }, 200);

    if (!scrollPosition) {
      return;
    }
    var pos = scrollPosition.top;
    if (pos > 0) {
      $scope.txHistoryPaddingBottom = "200px";
    }
    if (pos === prevPos) {
      return;
    }
    prevPos = pos;
    $scope.scrollPosition = pos;
  }

  var scrollWatcherInitialized;

  $scope.$on("$ionicView.enter", function(event, data) {
    scrollWatcherInitialized = true;
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if ($window.StatusBar) {
      $window.StatusBar.styleDefault();
    }

    configService.whenAvailable(function (config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;

      $timeout(function () {
        $scope.$apply();
      });
    });

    $scope.walletId = data.stateParams.walletId;
    $scope.wallet = profileService.getWallet($scope.walletId);
    $scope.walletBackgroundUrl = $scope.walletBackgroundUrl = $scope.wallet.colorIndex;
    console.log('')
    if (!$scope.wallet) return;
    $scope.status = $scope.wallet.status;
    $scope.requiresMultipleSignatures = $scope.wallet.credentials.m > 1;

    $scope.vm.gettingInitialHistory = true;

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);
      $scope.addressbook = ab || {};
    });

    listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId) {
        if (walletId == $scope.wallet.id && e.type != 'NewAddress')
          $scope.updateAll(false, false);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        if (walletId == $scope.wallet.id)
          $scope.updateAll(false, false);
      }),
    ];
  });

  var refreshInterval = null;

  $scope.$on("$ionicView.afterEnter", function onAfterEnter(event, data) {
    updateTxHistoryFromCachedData();
    $scope.updateAll(true, true);
    // refreshAmountSection();
    refreshInterval = $interval($scope.onRefresh, 10 * 1000);
    $timeout(function() {
      getScrollPosition();
    }, 1000);
  });

  $scope.$on("$ionicView.afterLeave", _onAfterLeave);
  $scope.$on("$ionicView.leave", _onLeave);

  function getSatoshiDiceIconUrl() {
    return satoshiDiceService.iconUrl;
  }

  function _onAfterLeave(event, data) {
    if (refreshInterval !== null) {
      $interval.cancel(refreshInterval);
      refreshInterval = null;
    }
    if ($window.StatusBar) {
      $window.StatusBar.backgroundColorByHexString('#FBFCFF');
    }
  }

  function _onLeave(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  }

  function _callLeaveHandlers() {
    _onLeave();
    _onAfterLeave();
  }

  function setAndroidStatusBarColor() {
    var SUBTRACT_AMOUNT = 15;
    var walletColor = "#ffffff";
    var rgb = hexToRgb(walletColor);
    var keys = Object.keys(rgb);
    keys.forEach(function(k) {
      if (rgb[k] - SUBTRACT_AMOUNT < 0) {
        rgb[k] = 0;
      } else {
        rgb[k] -= SUBTRACT_AMOUNT;
      }
    });
    var statusBarColorHexString = rgbToHex(rgb.r, rgb.g, rgb.b);
    if ($window.StatusBar)
      $window.StatusBar.backgroundColorByHexString(statusBarColorHexString);
  }

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  $scope.goToSend = function() {
    _callLeaveHandlers(); // During testing these weren't automatically called
    sendFlowService.start({
      coin: $scope.wallet.coin,
      fromWalletId: $scope.wallet.id
    });
    
  };
  $scope.goToReceive = function() {
    _callLeaveHandlers(); // During testing these weren't automatically called
    $state.go('tabs.home', {
      walletId: $scope.wallet.id
    }).then(function () {
      $ionicHistory.clearHistory();
      $state.go('tabs.receive', {
        walletId: $scope.wallet.id
      });
    });
  };
  
  $scope.goToBuy = function() {
    if ($scope.isBuyBitcoinAllowed) {
      moonPayService.start();
    } else {
      var os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';
      externalLinkService.open('https://purchase.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os);
    }
  };
});
