'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function tabSendController(
    bitcoinUriService
  , externalLinkService
  , $scope
  , $log
  , $timeout
  , $ionicScrollDelegate
  , addressbookService
  , profileService
  , lodash
  , $state
  , walletService
  , platformInfo
  , sendFlowService
  , gettextCatalog
  , configService
  , $ionicPopup
  , $ionicNavBarDelegate
  , clipboardService
  , incomingDataService
  , moonPayService
) {
  var clipboardHasAddress = false;
  var clipboardHasContent = false;
  var originalList;
  var isBuyBitcoinAllowed = false;
  $scope.displayBalanceAsFiat = true;
  $scope.walletSelectorTitleForce = true;

  moonPayService.getCountryByIpAddress().then(function onGetCountryByIpAddress(user) {
    isBuyBitcoinAllowed = user.isAllowed;
  });

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

    var stateParams = sendFlowService.state.getClone();
    $scope.fromWallet = profileService.getWallet(stateParams.fromWalletId);

    clipboardService.readFromClipboard(function(text) {
      if (text.length > 200) {
        text = text.substring(0, 200);
      }

      $scope.clipboardHasAddress = false;
      $scope.clipboardHasContent = false;
      var parsed = bitcoinUriService.parse(text);
      console.log('parsed', parsed);
      if (parsed.isValid && parsed.publicAddress && parsed.coin === 'bch' && !parsed.testnet) { // CashAddr
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
    if (!search || search.length < 1) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var params = sendFlowService.state.getClone();
    params.data = search;
    sendFlowService.start(params, function onError() {
      var result = lodash.filter(originalList, function(item) {
        var val = item.name;
        return lodash.startsWith(val.toLowerCase(), search.toLowerCase());
      });
  
      $scope.list = result;
    });
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
      
      var stateParams = sendFlowService.state.getClone();
      stateParams.toAddress = toAddress;
      stateParams.coin = item.coin;
      sendFlowService.start(stateParams);
    });
  };

  $scope.startWalletToWalletTransfer = function() {
    console.log('startWalletToWalletTransfer()');
    var params = sendFlowService.state.getClone();
    params.isWalletTransfer = true;
    sendFlowService.start(params);
  }

  // This could probably be enhanced refactoring the routes abstract states
  $scope.createWallet = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.add.create-personal');
    });
  };

  $scope.buyBitcoin = function() {
    if (isBuyBitcoinAllowed) {
      moonPayService.start();
    } else {
      var os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';
      externalLinkService.open('https://purchase.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os);
    }
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
      sendFlowService.state.clear();
    }

  });
});