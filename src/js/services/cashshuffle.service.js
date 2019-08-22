"use strict";

// 'use strict';
// (function(){
angular.module('bitcoincom.services').service('cashshuffleService', ['$rootScope', 'profileService', 'ongoingProcess', 'configService', 'walletService', 'walletHistoryService', 'walletAddressListenerService', 'pushNotificationsService', 'lodash', '$timeout', '$q', '$state', 'soundService', 'cashshuffleCoinFactory', function cashshuffleService($rootScope, profileService, ongoingProcess, configService, walletService, walletHistoryService, walletAddressListenerService, pushNotificationsService, _, $timeout, $q, $state, soundService, cashshuffleCoinFactory) {
  var defaultServerStatsUri = 'https://shuffle.servo.cash:8080/stats'; // Function called by the CashShuffle library which returns an
  // empty address to store change from the shuffle transaction.

  var getChangeAddress = function getChangeAddress(unshuffledCoinDetails) {
    return new Promise(function (resolve, reject) {
      var grabWallet = _.find(profileService.getWallets({
        coin: 'bch'
      }), {
        id: unshuffledCoinDetails.walletId
      });

      var walletHdMaster = grabWallet.credentials.getDerivedXPrivKey();
      walletService.getAddress(grabWallet, false, function (err, someLegacyAddress) {
        if (err) {
          return reject(err);
        }

        walletService.getAddressObj(grabWallet, someLegacyAddress, function (err, someAddressObject) {
          if (err) {
            return reject(err);
          }

          var pieces = someAddressObject.path.split('/');
          var newAddressPath = pieces[0] + '/1/' + pieces[2];
          var coinPrivateKey = walletHdMaster.derive(newAddressPath).privateKey;
          var oneCoin = {};
          oneCoin.path = newAddressPath;
          oneCoin.publicKey = coinPrivateKey.toPublicKey();
          oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
          oneCoin.privateKeyWif = coinPrivateKey.toWIF();
          oneCoin.walletId = grabWallet.id;
          oneCoin.walletName = grabWallet.name;
          oneCoin.wallet = grabWallet;
          return resolve(oneCoin);
        });
      });
    });
  }; // Function called by the CashShuffle library which returns an
  // empty address to store a freshly shuffled coin.


  var getShuffledAddress = function getShuffledAddress(unshuffledCoinDetails) {
    return new Promise(function (resolve, reject) {
      var grabWallet = _.find(profileService.getWallets({
        coin: 'bch'
      }), {
        name: 'CashShuffle Spending Wallet'
      });

      var walletHdMaster = grabWallet.credentials.getDerivedXPrivKey();
      walletService.getAddress(grabWallet, false, function (err, someLegacyAddress) {
        if (err) {
          return reject(err);
        }

        walletService.getAddressObj(grabWallet, someLegacyAddress, function (err, someAddressObject) {
          if (err) {
            return reject(err);
          }

          var coinPrivateKey = walletHdMaster.derive(someAddressObject.path).privateKey;
          var oneCoin = {};
          oneCoin.path = someAddressObject.path;
          oneCoin.publicKey = coinPrivateKey.toPublicKey();
          oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
          oneCoin.privateKeyWif = coinPrivateKey.toWIF();
          oneCoin.walletId = grabWallet.id;
          oneCoin.walletName = grabWallet.name;
          oneCoin.wallet = grabWallet;
          console.log('Got shuffle address:', oneCoin);
          return resolve(oneCoin);
        });
      }, false);
    });
  };

  function CoinShuffleService(properties) {
    var _this = this;

    _.extend(this, properties); // Set a promise that resolves onces the ShuffleClient
    // has been instantiated.  This is watched by the 
    // CashShuffleCoin instances so they know when it's
    // safe to bind the ShuffleClient to themselves.


    var i = $q.defer();
    this.serviceReady = i.promise;
    this.client = undefined;
    this.coinFactory = new cashshuffleCoinFactory(this);
    this.preferences = {
      shufflingEnabled: false,
      autoShuffle: false,
      spendOnlyShuffled: false,
      serverStatsUri: defaultServerStatsUri,
      preferencesLoading: true
    };
    this.fetchPreferences().then(function () {
      _this.coinFactory.serviceReady.catch(function (someError) {
        console.log('An error has occured', someError);
        i.reject(someError);
      }).then(function () {
        console.log('The CoinFactory service is ready:', _this.coinFactory.coins);

        _this.registerClient().then(function () {
          console.log('The CashShuffle service is ready and the ShuffleClient is registered!');
          setTimeout(function () {
            $rootScope.$emit('cashshuffle-update');
          }, 500);
          i.resolve(_this);
        }).catch(function (someError) {
          i.reject(someError);
        });
      });
    });

    _.extend(this, {
      update: this.coinFactory.update,
      coins: this.coinFactory.coins
    });

    this.defaultServerStatsUri = defaultServerStatsUri;
    return this;
  }

  ;

  CoinShuffleService.prototype.fetchPreferences = function () {
    var _this2 = this;

    return new Promise(function (resolve, reject) {
      configService.get(function (err, currentWalletConfig) {
        if (err) {
          return reject(err);
        }

        var currentCashShuffleConfig = currentWalletConfig && currentWalletConfig.cashshuffle || {};

        _.extend(_this2.preferences, {
          shufflingEnabled: currentCashShuffleConfig.shufflingEnabled || false,
          autoShuffle: currentCashShuffleConfig.autoShuffle || false,
          spendOnlyShuffled: currentCashShuffleConfig.spendOnlyShuffled || false,
          serverStatsUri: currentCashShuffleConfig.serverStatsUri || defaultServerStatsUri,
          preferencesLoading: false
        });

        setTimeout(function () {
          $rootScope.$emit('cashshuffle-update');
        }, 500);
        return resolve();
      });
    });
  };

  CoinShuffleService.prototype.registerClient = function () {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      _this3.client = new ShuffleClient({
        coins: _.filter(_this3.coinFactory.coins, {
          shuffleThisCoin: true
        }),
        hooks: {
          change: getChangeAddress,
          shuffled: getShuffledAddress
        },
        protocolVersion: 300,
        maxShuffleRounds: 5,
        // Disable automatically joining shuffle rounds
        // once a connection with the server is established
        disableAutoShuffle: !_this3.preferences.autoShuffle,
        serverStatsUri: _this3.preferences.serverStatsUri
      });

      _this3.client.on('phase', function (someData) {
        var coinInQuestion = _.find(_this3.coinFactory.coins, {
          txid: someData.round.coin.txid,
          vout: someData.round.coin.vout
        });

        if (coinInQuestion) {
          console.log('Got a phase message concerning', coinInQuestion.txid, ':', coinInQuestion.vout, 'in phase', someData.round.phase);
        } else {
          console.log('Got a phase message about a coin we couldnt find:', roundData.round);
          return;
        }

        return coinInQuestion.update({
          playersInRound: someData.round.numberOfPlayers ? someData.round.numberOfPlayers : 1,
          shufflePhase: someData.round.phase,
          inShufflePool: true
        });
      });

      _this3.client.on('message', function (someData) {
        var coinInQuestion = _.find(_this3.coinFactory.coins, {
          txid: someData.round.coin.txid,
          vout: someData.round.coin.vout
        });

        if (coinInQuestion) {
          console.log('Got a protocol message concerning', coinInQuestion.txid, ':', coinInQuestion.vout, 'in phase', someData);
        } else {
          console.log('Got a protocol message concerning a coin we couldnt find:', someData);
          return;
        }

        return coinInQuestion.update({
          playersInRound: someData.round.numberOfPlayers ? someData.round.numberOfPlayers : 1,
          shufflePhase: someData.round.phase,
          inShufflePool: true
        });
      });

      _this3.client.on('abort', function (roundData) {
        var coinInQuestion = _.find(_this3.coinFactory.coins, {
          txid: roundData.coin.txid,
          vout: roundData.coin.vout
        });

        if (coinInQuestion) {
          console.log('The user has aborted a shuffle for coin', coinInQuestion.txid, ':', coinInQuestion.vout, ' ==>', roundData);
        }

        return coinInQuestion.update({
          shuffleThisCoin: false,
          shufflePhase: undefined,
          playersInRound: undefined,
          inShufflePool: false
        });
      });

      _this3.client.on('failed', function (roundData) {
        var coinInQuestion = _.find(_this3.coinFactory.coins, {
          txid: roundData.coin.txid,
          vout: roundData.coin.vout
        });

        if (coinInQuestion) {
          console.log('Got a failed shuffle event concerning', coinInQuestion.txid, ':', coinInQuestion.vout, ':', roundData);
        } else {
          return;
        }

        if (_this3.preferences.autoShuffle) {
          var tryAgain = function tryAgain() {
            if (!coinInQuestion.shuffleThisCoin) {
              console.log('Retrying coin', coinInQuestion);
              coinInQuestion.update({
                shuffleThisCoin: true
              });
            }
          };

          $timeout(tryAgain, 1000 * 5);
        }

        return coinInQuestion.update({
          shuffleThisCoin: false,
          playersInRound: undefined,
          shufflePhase: '',
          inShufflePool: false
        });
      });

      _this3.client.on('shuffle', function (roundData) {
        var coinInQuestion = _.find(_this3.coinFactory.coins, {
          txid: roundData.coin.txid,
          vout: roundData.coin.vout
        });

        if (!coinInQuestion) {
          return;
        }

        coinInQuestion.update({
          shuffleThisCoin: false,
          playersInRound: roundData.numberOfPlayers ? roundData.numberOfPlayers : 1,
          shufflePhase: '',
          inShufflePool: false
        });
        soundService.play('misc/payment_received.mp3'); // Scan for new wallet addresses (including our change address)

        walletService.startScan(roundData.coin.wallet, function () {
          walletService.startScan(roundData.shuffled.wallet, function () {
            // Update our transaction history for all wallets involved
            var cashShuffleWallet = _.find(profileService.getWallets(), {
              name: 'CashShuffle Spending Wallet'
            });

            walletHistoryService.updateLocalTxHistoryByPage(roundData.coin.wallet, true, false, function (err, transactionHistory) {
              walletHistoryService.updateLocalTxHistoryByPage(cashShuffleWallet, true, false, function (err, transactionHistory) {
                _this3.coinFactory.update().then(function () {
                  console.log('Coins Updated!');
                }).catch(console.log);
              });
            });
          });
        });
      });

      $rootScope.$on('bwsEvent', function (event, walletId) {
        var wallet = profileService.getWallet(walletId);

        if (wallet.coin === 'bch') {
          _this3.coinFactory.update().then(function () {
            $timeout(function () {
              $rootScope.$emit('cashshuffle-update');
            }, 1000);
          }).catch(console.log);
        }
      });
      $rootScope.$on('Local/TxAction', function (event, walletId) {
        var wallet = profileService.getWallet(walletId);

        if (wallet.coin === 'bch') {
          _this3.coinFactory.update().then(function () {
            $timeout(function () {
              $rootScope.$emit('cashshuffle-update');
            }, 1000);
          }).catch(console.log);
        }
      });

      for (var _i = 0, _arr = ['skipped', 'phase', 'abort', 'message', 'stats']; _i < _arr.length; _i++) {
        var oneEventName = _arr[_i];

        _this3.client.on(oneEventName, function () {
          $rootScope.$emit('cashshuffle-update');
        });
      }

      return resolve(_this3.client);
    });
  };

  CoinShuffleService.prototype.changeShuffleServer = function (newShuffleStatsUri) {
    console.log('Now setting shuffle server to', newShuffleStatsUri);
    this.preferences.serverStatsUri = newShuffleStatsUri;
    this.updateWalletPreferences(true);
    return this.preferences.serverStatsUri;
  };

  CoinShuffleService.prototype.updateWalletPreferences = function (updateServerStatsUri) {
    var _this4 = this;

    console.log('Now updating wallet preferences!', this.preferences);

    _.extend(this.preferences, {
      preferencesLoading: true
    });

    var newPreferences = {
      cashshuffle: {
        shufflingEnabled: this.preferences.shufflingEnabled,
        autoShuffle: this.preferences.shufflingEnabled ? this.preferences.autoShuffle : false,
        spendOnlyShuffled: this.preferences.spendOnlyShuffled
      }
    };
    var changeServers = false;

    if (updateServerStatsUri) {
      if (this.preferences.serverStatsUri !== this.client.serverStatsUri) {
        changeServers = true;
      }

      newPreferences.cashshuffle.serverStatsUri = this.preferences.serverStatsUri;
    }

    configService.set(newPreferences, function (err) {
      if (err) $log.debug(err);

      if (changeServers) {
        _this4.client.changeShuffleServer(newPreferences.cashshuffle.serverStatsUri).then(function () {
          $rootScope.$emit('cashshuffle-update');
          console.log('Shuffle server updated to', newPreferences.cashshuffle.serverStatsUri);
        }).catch(console.log);
      } // Reset all coins when settings are changed.
      // Their state will be corrected later based
      // on the new settings.


      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _this4.coinFactory.coins[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var oneCoin = _step.value;
          oneCoin.update({
            shuffleThisCoin: false,
            playersInRound: undefined,
            shufflePhase: '',
            inShufflePool: false
          });
        } // Now purge the ShuffleClient's internal coin array.

      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      while (_this4.client.coins.length) {
        _this4.client.coins.pop();
      }

      if (!newPreferences.cashshuffle.shufflingEnabled) {
        console.log('Closing all active shuffle rounds because CashShuffle is disabled in preferences');
        var activeShuffleRounds = _this4.client ? _this4.client.rounds : []; // Kill any active shuffle rounds on the client

        while (activeShuffleRounds.length) {
          var oneRound = _this4.client.rounds.pop();

          oneRound.abortRound();

          var coinFromFactory = _.find(_this4.coinFactory.coins, {
            txid: oneRound.coin.txid,
            vout: oneRound.coin.vout
          });

          if (coinFromFactory) {
            coinFromFactory.update({
              shuffleThisCoin: false,
              playersInRound: undefined,
              shufflePhase: '',
              inShufflePool: false
            });
          }
        }

        _this4.client.stop(true);
      } else {
        if (!_this4.client.isShuffling) {
          _this4.client.start();
        }
      }

      _this4.coinFactory.update().then(function () {
        $timeout(function () {
          $rootScope.$emit('cashshuffle-update');
        }, 2000);
      }).catch(console.log);
    });

    function createCashShuffleWallet() {
      var allWallets = profileService.getWallets({
        coin: 'bch'
      });

      var cashShuffleWallet = _.find(allWallets, {
        name: 'CashShuffle Spending Wallet'
      });

      if (!cashShuffleWallet) {
        console.log('No cashshuffle wallet.  Creating one!!!!');
        var walletOptions = {
          name: 'CashShuffle Spending Wallet',
          m: 1,
          n: 1,
          myName: null,
          networkName: 'livenet',
          bwsurl: 'https://bwscash.bitcoin.com/bws/api',
          coin: 'bch',
          passphrase: null
        };
        ongoingProcess.set('creatingWallet', true);
        $timeout(function () {
          profileService.createWallet(walletOptions, function (err, client) {
            ongoingProcess.set('creatingWallet', false);
            ongoingProcess.set('generatingNewAddress', true);
            walletService.getAddress(client, true, function (e, addr) {
              ongoingProcess.set('generatingNewAddress', false);
              walletService.updateRemotePreferences(client);
              pushNotificationsService.updateSubscription(client);

              if (!client.isComplete()) {
                console.log('The client is not complete :(');
              } else {
                console.log('The client is complete!');
              }
            });
          });
        }, 300);
      } else {
        console.log('We already have a cashshuffle wallet!', cashShuffleWallet);
      }
    }

    ;

    if (this.preferences.shufflingEnabled) {
      createCashShuffleWallet();
    }

    this.fetchPreferences().then(function () {
      _.extend(_this4.preferences, {
        preferencesLoading: false
      });

      $rootScope.$emit('cashshuffle-update');
    }).catch(function (someError) {
      return $log.debug(someError);
    });
    return this.preferences;
  };

  var service = new CoinShuffleService({});
  window.cashshuffleService = service;
  return service;
}]); // )();