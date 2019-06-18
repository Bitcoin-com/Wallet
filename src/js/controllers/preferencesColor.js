'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $timeout, $log, $stateParams, $ionicHistory, configService, profileService, $ionicNavBarDelegate) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  var defaults = configService.getDefaults();
  config.colorFor = config.colorFor || {};
  config.colorIndexFor = config.colorIndexFor || {};

  var retries = 3;
  $scope.colorCount = getColorCount();
  setCurrentColorIndex();

  $scope.save = function(i) {
    var color = indexToColor(i);
    if (!color) return;

    var opts = {
      colorFor: {} ,
      colorIndexFor: {}
    };
    opts.colorFor[walletId] = color;
    opts.colorIndexFor[walletId] = i;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };

  function getColorDefault() {
    if ($scope.wallet.coin == 'bch') {
      return defaults.bitcoinCashWalletColor;
    } else {
      return defaults.bitcoinWalletColor;
    }
  };

  function getColorCount() {
    var count = window.getComputedStyle(document.getElementsByClassName('wallet-color-count')[0]).content;
    return parseInt(count.replace(/[^0-9]/g, ''));
  };

  function setCurrentColorIndex() {
    try {
      $scope.currentColorIndex = colorToIndex(config.colorFor[walletId] || getColorDefault());
    } catch(e) {
      // Wait for DOM to render and try again.
      $timeout(function() {
        if (retries > 0) {
          retries -= 1;
          setCurrentColorIndex();
        }
      }, 100);
    }
  };

  function colorToIndex(color) {
    for (var i = 0; i < $scope.colorCount; i++) {
      if (indexToColor(i) == color.toLowerCase()) {
        return i;
      }
    }
    return undefined;
  };

  function indexToColor(i) {
    // Expect an exception to be thrown if can't getComputedStyle().
    return rgb2hex(window.getComputedStyle(document.getElementsByClassName('wallet-color-' + i)[0]).backgroundColor);
  };

  function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });
});
