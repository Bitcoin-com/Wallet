angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, $ionicHistory, feeService, popupService, gettextCatalog, platformInfo, configService, profileService, $state, lodash, bitcore, bitcoreCash, ongoingProcess, txFormatService, $stateParams, walletService, rateService) {

    var _ = lodash;

    function _scanFunds(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        if ($scope.btcWallet) {
          $scope.btcWallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
        } else if ($scope.bchWallet) {
          $scope.bchWallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
        }
      };

      function getBalance(privateKey, coin, cb) {
        if (coin == 'btc') {
          if (!$scope.btcWallet) return cb(null, 0);
          $scope.btcWallet.getBalanceFromPrivateKey(privateKey, cb);
        } else {
          if (!$scope.bchWallet) return cb(null, 0);
          $scope.bchWallet.getBalanceFromPrivateKey(privateKey, cb);
        }
      }

      function getBalances(privateKey, cb) {
        getBalance(privateKey, 'btc', function (err, btcBalance) {
          if (err) return cb(err);
          getBalance(privateKey, 'bch', function (err, bchBalance) {
            if (err) return cb(err);
            return cb(null, btcBalance, bchBalance);
          });
        });
      }

      function checkPrivateKey(privateKey) {
        try {
          new bitcore.PrivateKey(privateKey, 'livenet');
        } catch (err) {
          try {
            new bitcoreCash.PrivateKey(privateKey, 'livenet');
          } catch (err) {
            return false;
          }
        }
        return true;
      }

      getPrivateKey($scope.scannedKey, $scope.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
        if (err) return cb(err);
        if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));

        getBalances(privateKey, function(err, btcBalance, bchBalance) {
          if (err) return cb(err);
          return cb(null, privateKey, btcBalance, bchBalance);
        });
      });
    };

    $scope.scanFunds = function() {
      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, btcBalance, bchBalance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error scanning funds:'), err || err.toString());
            $state.go('tabs.home');
          } else {
            $scope.privateKey = privateKey;
            $scope.btcBalance = btcBalance;
            $scope.bchBalance = bchBalance;

            if ($scope.btcWallet) {
              $scope.btcBalanceText = txFormatService.formatAmountStr($scope.btcWallet.coin, btcBalance);
              $scope.btcFiatBalance = rateService.toFiat(btcBalance, $scope.fiatCode, 'btc').toFixed(2);
            }

            if ($scope.bchWallet) {
              $scope.bchBalanceText = txFormatService.formatAmountStr($scope.bchWallet.coin, bchBalance);
              $scope.bchFiatBalance = rateService.toFiat(bchBalance, $scope.fiatCode, 'bch').toFixed(2);
            }

            $scope.readyToShow = true;
          }
          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(wallet, cb) {
      var opts = { 'coin': wallet.coin };

      walletService.getAddress(wallet, true, function(err, destinationAddress) {
        if (err) return cb(err);
        wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, opts, function(err, testTx) {
          if (err) return cb(err);
          var rawTxLength = testTx.serialize().length;
          feeService.getCurrentFeeRate(wallet.coin, wallet.network, function(err, feePerKb) {
            opts.fee = Math.round((feePerKb * rawTxLength) / 2000);
            wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, opts, function(err, tx) {
              if (err) return cb(err);
              wallet.broadcastRawTx({
                rawTx: tx.serialize(),
                network: wallet.network
              }, function(err, txid) {
                if (err) return cb(err);
                return cb(null, destinationAddress, txid);
              });
            });
          });
        });
      });
    };

    $scope.sweepWallet = function(coin) {
      var wallet = coin == 'btc' ? $scope.btcWallet : $scope.bchWallet;
      ongoingProcess.set('sweepingWallet', true);
      $scope.sending = true;

      $timeout(function() {
        _sweepWallet(wallet, function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);
          $scope.sending = false;
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error sweeping wallet:'), err || err.toString());
          } else {
            $scope.sendStatus = 'success';
          }
          $scope.$apply();
        });
      }, 100);
    }

    $scope.onSuccessConfirm = function() {
      $state.go('tabs.home');
    };

    $scope.onBtcWalletSelect = function(wallet) {
      $scope.btcWallet = wallet;
    }

    $scope.onBchWalletSelect = function(wallet) {
      $scope.bchWallet = wallet;
    }

    $scope.showBtcWalletSelector = function() {
      if ($scope.singleBtcWallet) return;
      $scope.walletSelectorTitle = gettextCatalog.getString('Transfer to');
      $scope.showBtcWallets = true;
    }

    $scope.showBchWalletSelector = function() {
      if ($scope.singleBchWallet) return;
      $scope.walletSelectorTitle = gettextCatalog.getString('Transfer to');
      $scope.showBchWallets = true;
    }

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.scannedKey = (data.stateParams && data.stateParams.privateKey) ? data.stateParams.privateKey : null;
      $scope.isPkEncrypted = $scope.scannedKey ? ($scope.scannedKey.substring(0, 2) == '6P') : null;
      $scope.sendStatus = null;
      $scope.error = false;

      var wallets = profileService.getWallets({
        onlyComplete: true,
        network: 'livenet',
      });

      $scope.wallets = wallets;
      $scope.btcWallets = _.filter($scope.wallets, function(w) { return w.coin == 'btc'; });
      $scope.bchWallets = _.filter($scope.wallets, function(w) { return w.coin == 'bch'; });
      $scope.singleBtcWallet = $scope.btcWallets.length == 1;
      $scope.singleBchWallet = $scope.bchWallets.length == 1;
      $scope.noMatchingBtcWallet = $scope.btcWallets.length == 0;
      $scope.noMatchingBchWallet = $scope.bchWallets.length == 0;

      var config = configService.getSync().wallet.settings;
      $scope.fiatCode = config.alternativeIsoCode || 'USD';
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.btcWallet = $scope.btcWallets[0];
      $scope.bchWallet = $scope.bchWallets[0];

      if (!$scope.btcWallet && !$scope.bchWallet) return;
      if (!$scope.isPkEncrypted) $scope.scanFunds();
      else {
        var message = gettextCatalog.getString('Private key encrypted. Enter password');
        popupService.showPrompt(null, message, null, function(res) {
          $scope.passphrase = res;
          $scope.scanFunds();
        });
      }
    });

  });
