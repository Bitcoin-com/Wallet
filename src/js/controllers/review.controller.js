'use strict';

(function () {

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

  function reviewController(
    addressbookService
    , externalLinkService
    , bitcoinCashJsService
    , bitcore
    , bitcoreCash
    , bwcError
    , clipboardService
    , configService
    , feeService
    , gettextCatalog
    , $interval
    , $ionicHistory
    , $ionicModal
    , ionicToast
    , lodash
    , $log
    , ongoingProcess
    , platformInfo
    , popupService
    , profileService
    , satoshiDiceService
    , $scope
    , sendFlowService
    , sideshiftService
    , soundService
    , $state
    , $timeout
    , txConfirmNotification
    , txFormatService
    , walletService
    ) {
    
    var vm = this;

    var sendFlowData;
    var config = null;
    var coin = '';
    var countDown = null;
    var defaults = {};
    var usingCustomFee = false;
    var usingMerchantFee = false;
    var destinationWalletId = '';
    var lastTxId = '';
    var originWalletId = '';
    var priceDisplayIsFiat = true;
    var satoshis = null;
    var toAddress = '';
    var tx = {};
    var txPayproData = null;
    var unitFromSat = 0;

    var FEE_TOO_HIGH_LIMIT_PERCENTAGE = 15;
  
    // Functions
    vm.goBack = goBack;
    vm.onReplay = onReplay;
    vm.onSuccessConfirm = onSuccessConfirm;
    vm.onShareTransaction = onShareTransaction;

    function initVariables() {
      // Private variables
      sendFlowData;
      config = null;
      coin = '';
      countDown = null;
      defaults = {};
      usingCustomFee = false;
      usingMerchantFee = false;
      destinationWalletId = '';
      lastTxId = '';
      originWalletId = '';
      priceDisplayIsFiat = true;
      satoshis = null;
      toAddress = '';
      tx = {};
      txPayproData = null;
      unitFromSat = 0;

      // Public variables
      vm.amountWon = 0.000525;
      vm.buttonText = '';
      vm.destination = {
        address: '',
        balanceAmount: '',
        balanceCurrency: '',
        coin: '',
        color: '',
        currency: '',
        currencyColor: '',
        kind: '', // 'address', 'contact', 'wallet'
        name: ''
      };
      vm.destinationAddress = 'something';
      vm.destinationIsAGame = false;
      vm.didWin = false;
      vm.didLose = false;
      vm.displayAddress = '';
      vm.feeCrypto = '';
      vm.feeFiat = '';
      vm.fiatCurrency = '';
      vm.feeIsHigh = false;
      vm.feeLessThanACent = false;
      vm.isCordova = platformInfo.isCordova;
      vm.memo = '';
      vm.notReadyMessage = '';
      vm.origin = {
        balanceAmount: '',
        balanceCurrency: '',
        currency: '',
        currencyColor: '',
      };
      vm.originWallet = null;
      vm.destinationWallet = null;
      vm.paymentExpired = false;
      vm.personalNotePlaceholder = gettextCatalog.getString('Enter text here');
      vm.primaryAmount = '';
      vm.primaryCurrency = '';
      vm.usingMerchantFee = false;
      vm.readyToSend = false;
      vm.remainingTimeStr = '';
      vm.secondaryAmount = '';
      vm.secondaryCurrency = '';
      vm.sendingTitle = gettextCatalog.getString('You are sending');
      vm.sendStatus = '';
      vm.showAddress = true;
      vm.thirdParty = null;
      vm.wallet = null;
      vm.memoExpanded = false;
    }

    $scope.$on('$ionicView.beforeEnter', onBeforeEnter);

    function onBeforeEnter(event, data) {
      $log.debug('reviewController onBeforeEnter sendflow ', sendFlowService.state);

      // Init before entering on this screen
      initVariables();
      // Then start

      defaults = configService.getDefaults();
      sendFlowData = sendFlowService.state.getClone();
      originWalletId = sendFlowData.fromWalletId;
      satoshis = parseInt(sendFlowData.amount, 10);
      toAddress = sendFlowData.toAddress;
      destinationWalletId = sendFlowData.toWalletId;

      vm.displayAddress = sendFlowData.displayAddress;
      vm.destinationAddress = sendFlowData.displayAddress || sendFlowData.toAddress;
      vm.originWallet = profileService.getWallet(originWalletId);
      vm.origin.currency = vm.originWallet.coin.toUpperCase();
      coin = vm.originWallet.coin;

      if (sendFlowData.thirdParty) {
        vm.thirdParty = sendFlowData.thirdParty;
        switch (vm.thirdParty.id) {
          case 'sideshift':
            initSideshift(function onInitSideshift(err) {
              if (err) {
                // Error stop here
                ongoingProcess.set('connectingSideshift', false);
                popupService.showConfirm(gettextCatalog.getString('SideShift AI Error'), err.toString(), gettextCatalog.getString('Open') + " Sideshift", gettextCatalog.getString('Go Back'), function onConfirm(hasConfirm) {
                  if (hasConfirm) {
                    externalLinkService.open("https://sideshift.ai");
                  }
                  $ionicHistory.goBack();
                });
              } else {
                _next();
              }
            });
            break;
          case 'bip70':
            initBip70();
          default:
            _next();
            break;
        }
      } else {
        _next();
      }

      function _next() {
        configService.get(function onConfig(err, configCache) {
          if (err) {
            $log.err('Error getting config.', err);
          } else {
            config = configCache;
            priceDisplayIsFiat = config.wallet.settings.priceDisplay === 'fiat';
            vm.origin.currencyColor = (vm.originWallet.coin === 'btc' ? defaults.bitcoinWalletColor : defaults.bitcoinCashWalletColor);
            unitFromSat = 1 / config.wallet.settings.unitToSatoshi;
          }
          updateSendAmounts();
          getOriginWalletBalance(vm.originWallet);
          handleDestinationAsAddress(toAddress, coin);
          handleDestinationAsWallet(sendFlowData.toWalletId);
          createVanityTransaction();
        });
      }
    }

    vm.approve = function() {
        
      if (!tx || !vm.originWallet) return;

      if (vm.paymentExpired) {
        popupService.showAlert(null, gettextCatalog.getString('This bitcoin payment request has expired.', function onAlert() {
          $ionicHistory.goBack();
        }));
        vm.sendStatus = '';
        $timeout(function onTimeout() {
          $scope.$apply();
        });
        return;
      }

      ongoingProcess.set('creatingTx', true, statusChangeHandler);
      getTxp(lodash.clone(tx), vm.originWallet, false, function onGetTxp(err, txp) {
        ongoingProcess.set('creatingTx', false, statusChangeHandler);
        if (err) return;

        // confirm txs for more that 20usd, if not spending/touchid is enabled
        function confirmTx(cb) {
          if (walletService.isEncrypted(vm.originWallet))
            return cb();

          var amountUsd = parseFloat(txFormatService.formatToUSD(vm.originWallet.coin, txp.amount));
          return cb();
        };

        function publishAndSign() {
          if (!vm.originWallet.canSign() && !vm.originWallet.isPrivKeyExternal()) {
            $log.info('No signing proposal: No private key');

            return walletService.onlyPublish(vm.originWallet, txp, function onOnlyPublish(err) {
              if (err) setSendError(err);
            }, statusChangeHandler);
          }

          walletService.publishAndSign(vm.originWallet, txp, function onPublishAndSign(err, txp) {
            if (err) return setSendError(err);

            if (config.confirmedTxsNotifications && config.confirmedTxsNotifications.enabled) {
              txConfirmNotification.subscribe(vm.originWallet, {
                txid: txp.txid
              });
            }
            lastTxId = txp.txid;
            _onTransactionCompletedSuccessfully();
          }, statusChangeHandler);
        };

        confirmTx(function(nok) {
          if (nok) {
            vm.sendStatus = '';
            $timeout(function onTimeout() {
              $scope.$apply();
            });
            return;
          }
          publishAndSign();
        });
      });
    };

    vm.chooseFeeLevel = function(tx, wallet) {

      if (wallet.coin == 'bch') return;
      if (usingMerchantFee) return;

      var scope = $rootScope.$new(true);
      scope.network = tx.network;
      scope.feeLevel = tx.feeLevel;
      scope.noSave = true;
      scope.coin = vm.originWallet.coin;

      if (usingCustomFee) {
        scope.customFeePerKB = tx.feeRate;
        scope.feePerSatByte = tx.feeRate / 1000;
      }

      $ionicModal.fromTemplateUrl('views/modals/chooseFeeLevel.html', {
        scope: scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.chooseFeeLevelModal = modal;
        scope.openModal();
      });
      scope.openModal = function() {
        scope.chooseFeeLevelModal.show();
      };

      scope.hideModal = function(newFeeLevel, customFeePerKB) {
        scope.chooseFeeLevelModal.hide();
        $log.debug('New fee level choosen:' + newFeeLevel + ' was:' + tx.feeLevel);

        usingCustomFee = newFeeLevel == 'custom' ? true : false;

        if (tx.feeLevel == newFeeLevel && !usingCustomFee) return;

        tx.feeLevel = newFeeLevel;
        if (usingCustomFee) tx.feeRate = parseInt(customFeePerKB);

        updateTx(tx, vm.originWallet, {
          clearCache: true,
          dryRun: true
        }, function() {});
      };
    };

    function createVanityTransaction() {
      var configFeeLevel = config.wallet.settings.feeLevel ? config.wallet.settings.feeLevel : 'normal';

      // Grab stateParams
      tx = {
        amount: parseInt(sendFlowData.amount),
        sendMax: sendFlowData.sendMax,
        fromWalletId: sendFlowData.fromWalletId,
        toAddress: sendFlowData.toAddress,
        paypro: txPayproData,
        outs: sendFlowData.outs,

        feeLevel: configFeeLevel,
        spendUnconfirmed: config.wallet.spendUnconfirmed,

        // Vanity tx info (not in the real tx)
        recipientType: vm.destination.kind || null,
        toName: vm.destination.name || null,
        toEmail: vm.destination.email || null,
        toColor: vm.destination.color || null,
        network: false,
        coin: vm.originWallet.coin,
        txp: {},
      };

      if (vm.thirdParty && vm.thirdParty.id === "sideshift") {
        //tx.toAddress = vm.thirdParty.toAddress;
        tx.toAddress = bitcoinCashJsService.readAddress(vm.thirdParty.toAddress).legacy;
      }
      
      if (sendFlowData.thirdParty && sendFlowData.thirdParty.requiredFeeRate) {  
        vm.usingMerchantFee = true;
        tx.feeRate = parseInt(sendFlowData.thirdParty.requiredFeeRate);
      }

      if (tx.coin && tx.coin === 'bch') {
        tx.feeLevel = 'normal';
      }

      var B = tx.coin === 'bch' ? bitcoreCash : bitcore;
      var networkName;
      try {
        // Final destination is a wallet, but this transaction must go to an address for the first stage of the exchange.
        if (sendFlowData.thirdParty && sendFlowData.thirdParty.id === 'sideshift') {
          networkName = (new B.Address(tx.toAddress)).network.name;
          tx.network = networkName;
          setupTx(tx);

        } else if (vm.destination.kind === 'wallet') { // This is a wallet-to-wallet transfer
          ongoingProcess.set('generatingNewAddress', true);
          var toWallet = profileService.getWallet(destinationWalletId);

          // We need an address to send to, so we ask the walletService to create a new address for the toWallet.
          walletService.getAddress(toWallet, true, function onWalletAddress(err, addr) {
            if (err) {
              $log.error('Error getting address for wallet.', err);
              throw new Error(err.message);
            }
            ongoingProcess.set('generatingNewAddress', false);
            tx.toAddress = addr;
            networkName = (new B.Address(tx.toAddress)).network.name;
            tx.network = networkName;
            setupTx(tx);
          });
        } else { // This is a Wallet-to-address transfer
          networkName = (new B.Address(tx.toAddress)).network.name;
          tx.network = networkName;
          setupTx(tx);
        }
      } catch (e) {
        $log.error('Error setting up tx', e);
        var message = gettextCatalog.getString('Invalid address');
        popupService.showAlert(null, message, function () {
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
          });
          $state.go('tabs.send').then(function () {
            $ionicHistory.clearHistory();
          });
        });
        return;
      }
    }

    function getOriginWalletBalance(originWallet) {
      var balanceText = getWalletBalanceDisplayText(vm.originWallet);
      vm.origin.balanceAmount = balanceText.amount;
      vm.origin.balanceCurrency = balanceText.currency;
    }

    function getSendMaxInfo(tx, wallet, cb) {
      if (!tx.sendMax) return cb();

      //ongoingProcess.set('retrievingInputs', true);
      walletService.getSendMaxInfo(wallet, {
        feePerKb: tx.feeRate,
        excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
        returnInputs: true,
      }, cb);
    };

    function getTxp(tx, wallet, dryRun, cb) {

      // ToDo: use a credential's (or fc's) function for this
      if (tx.description && !wallet.credentials.sharedEncryptingKey) {
        var msg = gettextCatalog.getString('Could not add message to imported wallet without shared encrypting key');
        $log.warn(msg);
        return setSendError(msg);
      }

      if (tx.amount > Number.MAX_SAFE_INTEGER) {
        var msg = gettextCatalog.getString('Amount too big');
        $log.warn(msg);
        return setSendError(msg);
      }

      var txp = {};

      var toAddress = bitcoinCashJsService.readAddress(tx.toAddress).legacy;

      if(tx.outs.length > 0){
        txp.outputs = tx.outs.map(function(out){
          return {
            'toAddress': out.addr,
            'amount': out.amount,
            'message': vm.memo
          }
        });
      } else {
        txp.outputs = [{
          'toAddress': tx.toAddress,
          'amount': tx.amount,
          'message': vm.memo
        }];
      }

      if (tx.sendMaxInfo) {
        txp.inputs = tx.sendMaxInfo.inputs;
        txp.fee = tx.sendMaxInfo.fee;
      } else {
        if (usingCustomFee || usingMerchantFee) {
          txp.feePerKb = tx.feeRate;
        } else txp.feeLevel = tx.feeLevel;
      }

      txp.message = vm.memo;

      if (tx.paypro) {
        txp.payProUrl = tx.paypro.url;
      }
      txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
      txp.dryRun = dryRun;
      walletService.createTx(wallet, txp, function onCreateTx(err, ctxp) {
        if (err) {
          setSendError(err);
          return cb(err);
        }
        return cb(null, ctxp);
      });
    };

    function getWalletBalanceDisplayText(wallet) {
      var balanceCryptoAmount = '';
      var balanceCryptoCurrencyCode = '';
      var balanceFiatAmount = '';
      var balanceFiatCurrency = '';
      var displayAmount = '';
      var displayCurrency = '';

      var walletStatus = null;
      if (wallet.status && wallet.status.isValid) {
        walletStatus = wallet.status;
      } else if (wallet.cachedStatus && wallet.cachedStatus.isValid) {
        walletStatus = wallet.cachedStatus;
      }

      if (walletStatus) {
        var cryptoBalanceParts = walletStatus.spendableBalanceStr.split(' ');
        balanceCryptoAmount = cryptoBalanceParts[0];
        balanceCryptoCurrencyCode = cryptoBalanceParts.length > 1 ? cryptoBalanceParts[1] : '';

        if (walletStatus.alternativeBalanceAvailable) {
          balanceFiatAmount = walletStatus.spendableBalanceAlternative;
          balanceFiatCurrency = walletStatus.alternativeIsoCode;
        }
      }

      if (priceDisplayIsFiat) {
        displayAmount = balanceFiatAmount ? balanceFiatAmount : balanceCryptoAmount;
        displayCurrency = balanceFiatAmount ? balanceFiatCurrency : balanceCryptoCurrencyCode;
      } else {
        displayAmount = balanceCryptoAmount;
        displayCurrency = balanceCryptoCurrencyCode;
      }

      return {
        amount: displayAmount,
        currency: displayCurrency
      };
    }

    function goBack() {
      sendFlowService.router.goBack();
    }

    function handleDestinationAsAddress(address, originCoin) {
      if (!address) {
        return;
      }

      // Check if the recipient is a contact
      addressbookService.get(originCoin + address, function onGetContact(err, contact) { 
        if (!err && contact) {
          handleDestinationAsAddressOfContact(contact);
        } else {
          if (originCoin === 'bch') {
            vm.destination.address = bitcoinCashJsService.readAddress(address).cashaddr;
          } else {
            vm.destination.address = address;
          }
          vm.destination.kind = 'address';
        }

        _handleSatoshiDiceIntegrationBeforeSending(address);
      });

    }

    function handleDestinationAsAddressOfContact(contact) {
      vm.destination.kind = 'contact';
      vm.destination.name = contact.name;
      vm.destination.email = contact.email;
      vm.destination.color = contact.coin === 'btc' ? defaults.bitcoinWalletColor : defaults.bitcoinCashWalletColor;
      vm.destination.currency = contact.coin.toUpperCase();
      vm.destination.currencyColor = vm.destination.color;
    }

    function handleDestinationAsWallet(walletId) {
      destinationWalletId = walletId;
      if (!destinationWalletId) {
        return;
      }

      var destinationWallet = profileService.getWallet(destinationWalletId);
      vm.destinationWallet = destinationWallet
      vm.destination.coin = destinationWallet.coin;
      vm.destination.color = destinationWallet.color;
      vm.destination.currency = destinationWallet.coin.toUpperCase();
      vm.destination.kind = 'wallet';
      vm.destination.name = destinationWallet.name;

      if (defaults) {
        vm.destination.currencyColor = vm.destination.coin === 'btc' ? defaults.bitcoinWalletColor : defaults.bitcoinCashWalletColor;
      }

      var balanceText = getWalletBalanceDisplayText(destinationWallet);
      vm.destination.balanceAmount = balanceText.amount;
      vm.destination.balanceCurrency = balanceText.currency;
    }

    function _handleSatoshiDiceIntegrationAfterSending() {
      if (!(vm.destinationIsAGame && lastTxId)) {
        return;
      }

      satoshiDiceService.getBetStatus(lastTxId).then(
        function onBetStatusSuccess(payload) {
          if (payload.win) {
            vm.didWin = true;
            vm.amountWon = payload.payout;
          } else {
            vm.didLose = true;
          }
        },
        function onBetStatusError(reason) {
          $log.error('Failed to get the status of the bet.', reason);
        }
      );
    }

    function _handleSatoshiDiceIntegrationBeforeSending() {
      if (vm.originWallet.coin !== 'bch') {
        return;
      }
      
      var address = vm.destinationAddress;
      if (address) {
        // So the address can be parsed properly
        if (address[0] === 'q' || address[0] === 'p') {
          address = 'bitcoincash:' + address;
        }
        var legacyAddress = bitcoinCashJsService.readAddress(address).legacy;
        if (satoshiDiceService.addressIsKnown(legacyAddress)) {
          vm.destinationIsAGame = true;
        }
      }
    }

    function initBip70() {
      vm.sendingTitle = gettextCatalog.getString('You are paying');
      vm.memo = vm.thirdParty.memo;
      vm.memoExpanded = !!vm.memo;
      vm.destination.name = vm.thirdParty.name;

      txPayproData = {
        caTrusted: vm.thirdParty.caTrusted,
        domain: vm.thirdParty.domain,
        expires: vm.thirdParty.expires,
        toAddress: toAddress,
        url: vm.thirdParty.url,
        verified: vm.thirdParty.verified,
      };
    }

    function initSideshift(cb) {
      vm.sendingTitle = gettextCatalog.getString('You are shifting');
      if (!vm.thirdParty.data) {
        vm.thirdParty.data = {};
      }

      var toWallet = profileService.getWallet(destinationWalletId);
      vm.destination.name = toWallet.name;
      vm.destination.color = toWallet.color;
      vm.destination.currency = toWallet.coin.toUpperCase();

      ongoingProcess.set('connectingSideshift', true);
      walletService.getAddress(vm.originWallet, false, function onReturnWalletAddress(err, returnAddr) {
        if (err) {
          return cb(err);
        } 
        walletService.getAddress(toWallet, false, function onWithdrawalWalletAddress(err, withdrawalAddr) {
          if (err) {
            return cb(err);
          } 

          // Need to use the correct service to do it.
          var amount = parseFloat(satoshis / 100000000);

          sideshiftService.shiftIt(vm.originWallet.coin, toWallet.coin, withdrawalAddr, returnAddr, amount, function onShiftIt(err, sideshiftData) {
            if (err) {
              return cb(err);
            } else {
              // Want it to appear like a wallet-to-wallet transfer, so don't set the main toAddress.
              vm.thirdParty.toAddress = sideshiftData.toAddress;
              vm.memo = 'SideShift Order:\nhttps://sideshift.ai/orders/' + sideshiftData.orderId;
              vm.memoExpanded = !!vm.memo;
              ongoingProcess.set('connectingSideshift', false);
              cb();
            }
          });
        });
      });
    }

    function onReplay() {
      onBeforeEnter();
    }

    function onShareTransaction() {
      var explorerTxUrl = 'https://explorer.bitcoin.com/' + tx.coin + '/tx/' + lastTxId;
      if (platformInfo.isCordova) {
        var text = gettextCatalog.getString('Take a look at this Bitcoin Cash transaction here: ') + explorerTxUrl;
        if (coin === 'btc') {
          text = gettextCatalog.getString('Take a look at this Bitcoin transaction here: ') + explorerTxUrl;
        }
        window.plugins.socialsharing.share(text, null, null, null);
      } else {
        ionicToast.show(gettextCatalog.getString('Copied to clipboard'), 'bottom', false, 3000);
        clipboardService.copyToClipboard(explorerTxUrl);
      }
    
    }

    function _onTransactionCompletedSuccessfully() {
      var channel = "firebase";
        if (platformInfo.isNW) {
          channel = "ga";
        }
        // When displaying Fiat, if the formatting fails, the crypto will be the primary amount.
        var amount = unitFromSat * satoshis;
        var log = new window.BitAnalytics.LogEvent("transfer_success", [{
          "coin": vm.originWallet.coin,
          "type": "outgoing",
          "amount": amount,
          "fees": vm.feeCrypto,
          "num_of_copayers": vm.originWallet.n,
          "num_of_signatures": vm.originWallet.m
        }, {}, {}], [channel, "leanplum"]);
        window.BitAnalytics.LogEventHandlers.postEvent(log);

      _handleSatoshiDiceIntegrationAfterSending();
    }

    function startExpirationTimer(expirationTime) {
      vm.paymentExpired = false;
      setExpirationTime();

      countDown = $interval(function() {
        setExpirationTime();
      }, 1000);

      function setExpirationTime() {
        var now = Math.floor(Date.now() / 1000);

        if (now > expirationTime) {
          setExpiredValues();
          return;
        }

        var totalSecs = expirationTime - now;
        var m = Math.floor(totalSecs / 60);
        var s = totalSecs % 60;
        vm.remainingTimeStr = m + ":" + ('0' + s).slice(-2);
      };

      function setExpiredValues() {
        vm.paymentExpired = true;
        vm.remainingTimeStr = gettextCatalog.getString('Expired');
        vm.readyToSend = false;
        if (countDown) $interval.cancel(countDown);
        $timeout(function() {
          $scope.$apply();
        });
      };
    };

    function updateSendAmounts() {
      if (typeof satoshis !== 'number') {
        return;
      }

      var cryptoAmount = '';
      var cryptoCurrencyCode = '';
      var amountStr = txFormatService.formatAmountStr(coin, satoshis);
      if (amountStr) {
        var amountParts = amountStr.split(' ');
        cryptoAmount = amountParts[0];
        cryptoCurrencyCode = amountParts.length > 1 ? amountParts[1] : '';
      }
      // Want to avoid flashing of amount strings so do all formatting after this has returned.
      txFormatService.formatAlternativeStr(coin, satoshis, function(v) {
        if (!v) {
          vm.primaryAmount = cryptoAmount;
          vm.primaryCurrency = cryptoCurrencyCode;
          vm.secondaryAmount = '';
          vm.secondaryCurrency = '';
          return;
        }
        vm.secondaryAmount = vm.primaryAmount;
        vm.secondaryCurrency = vm.primaryCurrency;

        var fiatParts = v.split(' ');
        var fiatAmount = fiatParts[0];
        var fiatCurrency = fiatParts.length > 1 ? fiatParts[1] : '';

        if (priceDisplayIsFiat) {
          vm.primaryAmount = fiatAmount;
          vm.primaryCurrency = fiatCurrency;
          vm.secondaryAmount = cryptoAmount;
          vm.secondaryCurrency = cryptoCurrencyCode;
        } else {
          vm.primaryAmount = cryptoAmount;
          vm.primaryCurrency = cryptoCurrencyCode;
          vm.secondaryAmount = fiatAmount;
          vm.secondaryCurrency = fiatCurrency;
        }
      });
    }

    function onSuccessConfirm() {
      // Clear the send flow service state
      sendFlowService.state.clear();

      vm.sendStatus = '';
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $state.go('tabs.send').then(function() {
        $ionicHistory.clearHistory();
        $state.transitionTo('tabs.home');
      });
    };

    function setButtonText(isMultisig, isPayPro) {
      if (isPayPro) {
        if (vm.isCordova) {
          vm.buttonText = gettextCatalog.getString('Slide to pay');
        } else {
          vm.buttonText = gettextCatalog.getString('Click to pay');
        }
      } else if (isMultisig) {
        if (vm.isCordova) {
          vm.buttonText = gettextCatalog.getString('Slide to accept');
        } else {
          vm.buttonText = gettextCatalog.getString('Click to accept');
        }
      } else {
        if (vm.isCordova) {
          vm.buttonText = gettextCatalog.getString('Slide to send');
        } else {
          vm.buttonText = gettextCatalog.getString('Click to send');
        }
      }
    }

    function setNotReady(msg, criticalError) {
      vm.readyToSend = false;
      vm.notReadyMessage = msg;
      $scope.criticalError = criticalError;
      $log.warn('Not ready to make the payment:' + msg);
      $timeout(function() {
        $scope.$apply();
      });
    };

    function setSendError(msg) {
      $scope.sendStatus = '';
      vm.readyToSend = false;
      $timeout(function() {
        $scope.$apply();
      });
      popupService.showAlert(gettextCatalog.getString('Error at confirm'), bwcError.msg(msg), function onAlert() {
        $ionicHistory.goBack();
      });
    };

    function setupTx(tx) {
      if (tx.coin === 'bch') {
        tx.displayAddress = bitcoinCashJsService.readAddress(tx.toAddress).cashaddr;
      } else {
        tx.displayAddress = tx.toAddress;
      }

      addressbookService.get(tx.coin+tx.toAddress, function onGetContact(err, addr) { // Check if the recipient is a contact
        if (!err && addr) {
          tx.toName = addr.name;
          tx.toEmail = addr.email;
          tx.recipientType = 'contact';
        }
      });

      vm.showAddress = false;


      setButtonText(vm.originWallet.credentials.m > 1, !!tx.paypro);

      if (tx.paypro)
        startExpirationTimer(tx.paypro.expires);

      updateTx(tx, vm.originWallet, {
        dryRun: true
      }, function(err) {
        $timeout(function onTimeout() {
          $scope.$apply();
        }, 10);
      });
    }

    function showSendMaxWarning(wallet, sendMaxInfo) {
      var feeAlternative = '',
        msg = '';

      function verifyExcludedUtxos() {
        var warningMsg = [];
        if (sendMaxInfo.utxosBelowFee > 0) {
          warningMsg.push(gettextCatalog.getString("A total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.", {
            amountBelowFeeStr: txFormatService.formatAmountStr(wallet.coin, sendMaxInfo.amountBelowFee)
          }));
        }

        if (sendMaxInfo.utxosAboveMaxSize > 0) {
          warningMsg.push(gettextCatalog.getString("A total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded.", {
            amountAboveMaxSizeStr: txFormatService.formatAmountStr(vm.originWallet.coin, sendMaxInfo.amountAboveMaxSize)
          }));
        }
        return warningMsg.join('\n');
      };

      feeAlternative = txFormatService.formatAlternativeStr(vm.originWallet.coin, sendMaxInfo.fee);
      if (feeAlternative) {
        msg = gettextCatalog.getString("{{feeAlternative}} will be deducted for bitcoin networking fees ({{fee}}).", {
          fee: txFormatService.formatAmountStr(vm.originWallet.coin, sendMaxInfo.fee),
          feeAlternative: feeAlternative
        });
      } else {
        msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees).", {
          fee: txFormatService.formatAmountStr(vm.originWallet.coin, sendMaxInfo.fee)
        });
      }

      var warningMsg = verifyExcludedUtxos();

      if (!lodash.isEmpty(warningMsg))
        msg += '\n' + warningMsg;

      popupService.showAlert(null, msg, function() {});
    };

    function statusChangeHandler(processName, showName, isOn) {
      $log.debug('statusChangeHandler() processName: "' + processName + '", isOn: ' + isOn);
      if (
        (
          processName === 'broadcastingTx' ||
          ((processName === 'signingTx') && vm.originWallet.m > 1) ||
          (processName == 'sendingTx' && !vm.originWallet.canSign() && !vm.originWallet.isPrivKeyExternal())
        ) && !isOn) {
        // Show the popup
        vm.sendStatus = 'success';

        if ($state.current.name === "tabs.send.review") { // XX SP: Otherwise all open wallets on other devices play this sound if you have been in a send flow before on that device.
          soundService.play('misc/payment_sent.mp3');
        }

        $timeout(function() {
          $scope.$digest();
        }, 100);
      } else if (showName) {
        vm.sendStatus = showName;
      }
    };

    function updateTx(tx, wallet, opts, cb) {
      ongoingProcess.set('calculatingFee', true);

      if (opts.clearCache) {
        tx.txp = {};
      }

      // $scope.tx = tx;

      // function updateAmount() {
      //   if (!tx.amount) return;
      //
      //   // Amount
      //   tx.amountStr = txFormatService.formatAmountStr(originWallet.coin, tx.amount);
      //   tx.amountValueStr = tx.amountStr.split(' ')[0];
      //   tx.amountUnitStr = tx.amountStr.split(' ')[1];
      //   txFormatService.formatAlternativeStr(wallet.coin, tx.amount, function(v) {
      //     var parts = v.split(' ');
      //     tx.alternativeAmountStr = v;
      //     tx.alternativeAmountValueStr = parts[0];
      //     tx.alternativeAmountUnitStr = (parts.length > 0) ? parts[1] : '';
      //   });
      // }
      //
      // updateAmount();
      // refresh();

      var feeServiceLevel = usingMerchantFee && vm.originWallet.coin == 'btc' ? 'urgent' : tx.feeLevel;
      feeService.getFeeRate(vm.originWallet.coin, tx.network, feeServiceLevel, function onGetFeeRate(err, feeRate) {
        if (err) {
          ongoingProcess.set('calculatingFee', false);
          return cb(err);
        }

        var msg;
        if (usingCustomFee) {
          msg = gettextCatalog.getString('Custom');
          tx.feeLevelName = msg;
        } else if (usingMerchantFee) {
          $log.info('Using Merchant Fee:' + tx.feeRate + ' vs. Urgent level:' + feeRate);
          msg = gettextCatalog.getString('Suggested by Merchant');
          tx.feeLevelName = msg;
        } else {
          tx.feeLevelName = feeService.feeOpts[tx.feeLevel];
          tx.feeRate = feeRate;
        }

        getSendMaxInfo(lodash.clone(tx), wallet, function onGetSendmaxInfo(err, sendMaxInfo) {
          if (err) {
            ongoingProcess.set('calculatingFee', false);
            var msg = gettextCatalog.getString('Error getting SendMax information');
            return setSendError(msg);
          }

          if (sendMaxInfo) {

            $log.debug('Send max info', sendMaxInfo);

            if (tx.sendMax && sendMaxInfo.amount == 0) {
              ongoingProcess.set('calculatingFee', false);
              setNotReady(gettextCatalog.getString('Insufficient confirmed funds'));
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'), function onAlert() {
                $ionicHistory.goBack();
              });
              return cb('no_funds');
            }

            tx.sendMaxInfo = sendMaxInfo;
            tx.amount = tx.sendMaxInfo.amount;
            satoshis = tx.amount;
            updateSendAmounts();
            ongoingProcess.set('calculatingFee', false);
            $timeout(function() {
              showSendMaxWarning(wallet, sendMaxInfo);
            }, 200);
          }

          // txp already generated for this wallet?
          if (tx.txp[wallet.id]) {
            ongoingProcess.set('calculatingFee', false);
            vm.readyToSend = true;
            updateSendAmounts();
            $scope.$apply();
            return cb();
          }

          getTxp(lodash.clone(tx), wallet, opts.dryRun, function onGetTxp(err, txp) {
            ongoingProcess.set('calculatingFee', false);
            if (err) {
              if (err.message == 'Insufficient funds') {
                setNotReady(gettextCatalog.getString('Insufficient funds'));
                popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Not enough funds for fee'));
                return cb('no_funds');
              } else
                return cb(err);
            }

            txp.feeStr = txFormatService.formatAmountStr(wallet.coin, txp.fee);
            txFormatService.formatAlternativeStr(wallet.coin, txp.fee, function onFormatAlternativeStr(v) {
              // txp.alternativeFeeStr = v;
              // if (txp.alternativeFeeStr.substring(0, 4) == '0.00')
              //   txp.alternativeFeeStr = '< ' + txp.alternativeFeeStr;
              vm.feeFiat = v;
              vm.fiatCurrency = config.wallet.settings.alternativeIsoCode;
              if (v.substring(0, 1) === "<") {
                vm.feeLessThanACent = true;
              }

            });

            var per = (txp.fee / (txp.amount + txp.fee) * 100);
            var perString = per.toFixed(2);
            txp.feeRatePerStr = (perString == '0.00' ? '< ' : '') + perString + '%';
            txp.feeToHigh = per > FEE_TOO_HIGH_LIMIT_PERCENTAGE;
            vm.feeCrypto = (unitFromSat * txp.fee).toFixed(8);
            vm.feeIsHigh = txp.feeToHigh;

            tx.txp[wallet.id] = txp;
            $log.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);
            vm.readyToSend = true;
            updateSendAmounts();
            $scope.$apply();

            return cb();
          });
        });
      });
    }
  }
})();
