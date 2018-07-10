'use strict';

angular.module('copayApp.controllers').controller('tabSendV2Controller', function($scope, $rootScope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService, platformInfo, bwcError, gettextCatalog, scannerService, configService, bitcoinCashJsService, $ionicNavBarDelegate, clipboardService) {
  var clipboardHasAddress = false;
  var clipboardHasContent = false;

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
    updateWalletsList();
    updateContactsList(function() {
      updateList();
    });
  });
















  var originalList;
  var CONTACTS_SHOW_LIMIT;
  var currentContactsPage;

  $scope.sectionDisplay = {
    transferToWallet: false
  };

  var hasWallets = function() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;
  };

  // THIS is ONLY to show the 'buy bitcoins' message
  // does not has any other function.

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

  var updateWalletsList = function() {
    var config = configService.getSync();
    var networkResult = lodash.countBy($scope.wallets, 'network');

    $scope.showTransferCard = $scope.hasWallets && (networkResult.livenet > 1 || networkResult.testnet > 1);

    if ($scope.showTransferCard) {
      var walletsToTransfer = $scope.wallets;
      if (!(networkResult.livenet > 1)) {
        walletsToTransfer = lodash.filter(walletsToTransfer, function(item) {
          return item.network == 'testnet';
        });
      }
      if (!(networkResult.testnet > 1)) {
        walletsToTransfer = lodash.filter(walletsToTransfer, function(item) {
          return item.network == 'livenet';
        });
      }

      var walletList = [];
      lodash.each(walletsToTransfer, function(v) {
        var displayBalanceAsFiat = 
          // BD got v.status as undefined here once during development, just
          // after creating a new wallet.
          v.status && 
          v.status.alternativeBalanceAvailable &&
          config.wallet.settings.priceDisplay === 'fiat';

        walletList.push({
          color: v.color,
          name: v.name,
          recipientType: 'wallet',
          coin: v.coin,
          network: v.network,
          balanceString: displayBalanceAsFiat ?
              v.status.totalBalanceAlternative + ' ' + v.status.alternativeIsoCode : 
              v.cachedBalance,
          getAddress: function(cb) {
            walletService.getAddress(v, false, cb);
          },
        });
      });
      originalList = originalList.concat(walletList);
    }
  }

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
      var contacts = completeContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = completeContacts.length > contacts.length;
      originalList = originalList.concat(contacts);
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

  $scope.openScanner = function() {
    var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

    if (!isWindowsPhoneApp) {
      $state.go('tabs.scan');
      return;
    }

    scannerService.useOldScanner(function(err, contents) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      incomingData.redir(contents);
    });
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateWalletsList();
  };

  $scope.searchInFocus = function() {
    $scope.searchFocus = true;
  };

  $scope.searchBlurred = function() {
    if ($scope.formData.search == null || $scope.formData.search.length == 0) {
      $scope.searchFocus = false;
    }
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
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
    $scope.checkingBalance = true;
    $scope.formData = {
      search: null
    };
    originalList = [];
    CONTACTS_SHOW_LIMIT = 10;
    currentContactsPage = 0;
    hasWallets();
  });
});
