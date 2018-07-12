'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $rootScope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService, platformInfo, bwcError, gettextCatalog, scannerService, configService, bitcoinCashJsService, $ionicNavBarDelegate, clipboardService) {
  var clipboardHasAddress = false;
  var clipboardHasContent = false;
  var originalList;
  $scope.displayBalanceAsFiat = true;
  $scope.walletSelectorTitleForce = true;

  $scope.addContact = function() {
    $state.go('tabs.settings').then(function() {
      $state.go('tabs.addressbook').then(function() {
        $state.go('tabs.addressbook.add');
      });
    });
  };

  $scope.pasteClipboard = function() {
    if ($scope.clipboardHasAddress || $scope.clipboardHasContent) {
      clipboardService.readFromClipboard(function(text) {
        $scope.formData.search = text;
        $scope.findContact($scope.formData.search);
      });
    }
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    clipboardService.readFromClipboard(function(text) {
      if (text.length > 200) {
        text = text.substring(0, 200);
      }

      $scope.clipboardHasAddress = false;
      $scope.clipboardHasContent = false;
      if ((text.indexOf('bitcoincash:') === 0 || text[0] === 'C' || text[0] === 'H' || text[0] === 'p' || text[0] === 'q') && text.replace('bitcoincash:', '').length === 42) { // CashAddr
        $scope.clipboardHasAddress = true;
      } else if ((text[0] === "1" || text[0] === "3" || text.substring(0, 3) === "bc1") && text.length >= 26 && text.length <= 35) { // Legacy Addresses
        $scope.clipboardHasAddress = true;
      } else if (text.length > 1) {
        $scope.clipboardHasContent = true;
      }
    });

    $ionicNavBarDelegate.showBar(true);
    if (!$scope.hasWallets) {
      $scope.checkingBalance = false;
      return;
    }
    updateHasFunds();
    updateContactsList(function() {
      updateList();
    });
  });

  var wallets;
  var walletsBch;
  var walletsBtc;
  var walletToWalletFrom = false;

  $scope.onWalletSelect = function(wallet) {
    if (!$scope.walletToWalletFrom) {
      $scope.walletToWalletFrom = wallet;
      if (wallet.coin === 'bch') {
        $scope.showWalletsBch = true;
      } else if (wallet.coin === 'btc') {
        $scope.showWalletsBtc = true;
      }
      $scope.walletSelectorTitleTo = gettextCatalog.getString('Send to');
    } else {
      walletService.getAddress(wallet, true, function(err, addr) {
        return $state.transitionTo('tabs.send.amount', {
          displayAddress: $scope.walletToWalletFrom.coin === 'bch' ? bitcoinCashJsService.translateAddresses(addr).cashaddr : addr,
          recipientType: 'wallet',
          fromWalletId: $scope.walletToWalletFrom.walletId,
          toAddress: addr,
          coin: $scope.walletToWalletFrom.coin
        });
      });

    }
  };

  $scope.showWalletSelector = function() {
    $scope.walletToWalletFrom = false;
    $scope.walletSelectorTitleFrom = gettextCatalog.getString('Send from');
    $scope.showWallets = true;
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 1) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.startsWith(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  var hasWallets = function() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.walletsBch = profileService.getWallets({
      onlyComplete: true,
      coin: 'bch'
    });
    $scope.walletsBtc = profileService.getWallets({
      onlyComplete: true,
      coin: 'btc'
    });
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;
  };

  var updateHasFunds = function() {

    if ($rootScope.everHasFunds) {
      $scope.hasFunds = true;
      return;
    }

    $scope.hasFunds = false;
    var index = 0;
    lodash.each($scope.wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {

        ++index;
        if (err && !status) {
          $log.error(err);
          // error updating the wallet. Probably a network error, do not show
          // the 'buy bitcoins' message.

          $scope.hasFunds = true;
        } else if (status.availableBalanceSat > 0) {
          $scope.hasFunds = true;
          $rootScope.everHasFunds = true;
        }

        if (index == $scope.wallets.length) {
          $scope.checkingBalance = false;
          $timeout(function() {
            $scope.$apply();
          });
        }
      });
    });
  };

  var updateContactsList = function(cb) {
    var config = configService.getSync();
    var defaults = configService.getDefaults();
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      if (!$scope.hasContacts) return cb();

      var completeContacts = [];
      lodash.each(ab, function(v, k) {
        completeContacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
          recipientType: 'contact',
          coin: v.coin,
          displayCoin:  (v.coin == 'bch'
              ? (config.bitcoinCashAlias || defaults.bitcoinCashAlias)
              : (config.bitcoinAlias || defaults.bitcoinAlias)).toUpperCase(),
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });
      originalList = completeContacts;
      return cb();
    });
  };

  var updateList = function() {
    $scope.list = lodash.clone(originalList);
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.searchInFocus = function() {
    $scope.searchFocus = true;
  };

  $scope.searchBlurred = function() {
    if ($scope.formData.search == null || $scope.formData.search.length == 0) {
      $scope.searchFocus = false;
    }
  };

  $scope.goToAmount = function(item) {
    $timeout(function() {
      item.getAddress(function(err, addr) {
        if (err || !addr) {
          //Error is already formated
          return popupService.showAlert(err);
        }

        if (item.recipientType && item.recipientType == 'contact') {
          if (addr.indexOf('bch') == 0 || addr.indexOf('btc') == 0) {
            addr = addr.substring(3);
          }
        }

        $log.debug('Got toAddress:' + addr + ' | ' + item.name);
        return $state.transitionTo('tabs.send.amount', {
          recipientType: item.recipientType,
          displayAddress: item.coin == 'bch' ? bitcoinCashJsService.translateAddresses(addr).cashaddr : addr,
          toAddress: addr,
          toName: item.name,
          toEmail: item.email,
          toColor: item.color,
          coin: item.coin
        });
      });
    });
  };

  // This could probably be enhanced refactoring the routes abstract states
  $scope.createWallet = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.add.create-personal');
    });
  };

  $scope.buyBitcoin = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.buyandsell');
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.showWalletsBch = $scope.showWalletsBtc = $scope.showWallets = false;

    $scope.checkingBalance = true;
    $scope.formData = {
      search: null
    };
    originalList = [];
    hasWallets();

    configService.whenAvailable(function(_config) {
      $scope.displayBalanceAsFiat = _config.wallet.settings.priceDisplay === 'fiat';
    });

  });
});
