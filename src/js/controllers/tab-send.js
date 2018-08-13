'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $rootScope, $log, $timeout, $ionicScrollDelegate, $ionicLoading, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService, platformInfo, sendFlowService, bwcError, gettextCatalog, scannerService, configService, bitcoinCashJsService, $ionicPopup, $ionicNavBarDelegate, clipboardService) {
  var clipboardHasAddress = false;
  var clipboardHasContent = false;
  var originalList;
  $scope.displayBalanceAsFiat = true;
  $scope.walletSelectorTitleForce = true;

  $scope.addContact = function() {
      $state.go('tabs.send.addressbook');
  };

  $scope.pasteClipboard = function() {
    if ($scope.clipboardHasAddress || $scope.clipboardHasContent) {
      clipboardService.readFromClipboard(function(text) {
        $scope.$apply(function() {
          $scope.formData.search = text; 
          $scope.findContact($scope.formData.search); 
        });
      });
    } else {
      $ionicPopup.alert({
        title: gettextCatalog.getString('Clipboard'),
        template: gettextCatalog.getString('Your Clipboard is empty')
      });
    }
  };

  $scope.$on("$ionicView.enter", function(event, data) {

    var stateParams = sendFlowService.getStateClone();
    $scope.fromWallet = profileService.getWallet(stateParams.fromWalletId);

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
    $scope.walletsWithFunds = profileService.getWallets({
      onlyComplete: true,
      hasFunds: true
    });
    $scope.wallets = profileService.getWallets({
      onlyComplete: true,
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
        }

        if (index === $scope.wallets.length) {
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
              : (config.bitcoinAlias || defaults.bitcoinAlias)).toUpperCase()
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
    if ($scope.formData.search == null || $scope.formData.search.length === 0) {
      $scope.searchFocus = false;
    }
  };

  $scope.sendToContact = function (item) {
    $timeout(function () {
      var toAddress = item.address;

      if (item.recipientType && item.recipientType === 'contact') {
        if (toAddress.indexOf('bch') === 0 || toAddress.indexOf('btc') === 0) {
          toAddress = toAddress.substring(3);
        }
      }

      $log.debug('Got toAddress:' + toAddress + ' | ' + item.name);
      
      var stateParams = sendFlowService.getStateClone();
      stateParams.toAddress = toAddress,
      stateParams.coin = item.coin;
      sendFlowService.pushState(stateParams);

      if (!stateParams.fromWalletId) { // If we have no toAddress or fromWallet
        $state.transitionTo('tabs.send.origin');
      } else {
        $state.transitionTo('tabs.send.amount');
      }

    });
  };

  $scope.startWalletToWalletTransfer = function() {
    console.log('startWalletToWalletTransfer()');
    var params = sendFlowService.getStateClone();
    sendFlowService.pushState(params);
    $state.transitionTo('tabs.send.wallet-to-wallet', {
      fromWalletId: sendFlowService.fromWalletId
    });
  }

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
    console.log(data);
    console.log('tab-send onBeforeEnter sendflow ', sendFlowService.state);
    $scope.isIOS = platformInfo.isIOS && platformInfo.isCordova;
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

    if (data.direction == "back") {
      sendFlowService.clear();
    }

  });
});