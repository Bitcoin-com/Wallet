"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// 'use strict';
// (function(){
angular.module('bitcoincom.services').factory('cashshuffleCoinFactory', ['$rootScope', '$q', 'profileService', 'configService', 'walletHistoryService', 'lodash', function cashshuffleCoinFactory($rootScope, $q, profileService, configService, walletHistoryService, _) {
  function CashShuffleCoin(coinProperties) {
    _.extend(this, coinProperties);

    this.shuffleThisCoin = this.shuffleThisCoin || false;
    this.inShufflePool = false;
    this.shufflePhase = 'queued';
    this.service = this.service;

    var registerEventHandlers = function registerEventHandlers() {// Put stuff in here that relies on the CashShuffleCoin
      // instances having access to the `ShuffleClient`
    }; // Once this resolves we know our ShuffleClient
    // has been instantiated on the cashShuffleService.


    this.service.serviceReady.then(function () {
      registerEventHandlers();
    }).catch(function (someError) {
      console.log('An error has occured', someError);
      i.reject(someError);
    });
    return this;
  }

  ;

  CashShuffleCoin.prototype.update = function (someProperties) {
    var _this = this;

    _.extend(this, someProperties);

    if (this.shuffleThisCoin) {
      if (this.service && this.service.client) {
        // Start the ShuffleClient if it's not already running.
        if (!this.service.client.isShuffling) {
          this.service.client.start();
        }

        var checkAgainst = _.compact([].concat(_.map(this.service.client.rounds, 'coin'), this.service.client.coins));

        if (!_.find(checkAgainst, {
          txid: this.txid,
          vout: this.vout
        }) && this.confirmations) {
          this.service.client.addUnshuffledCoins(this);
        }
      }
    } else {
      // Check and see if this coin is currently being
      // shuffled. If so, we must abort the round.
      var grabRound = _.find(this.service.client.rounds, function (oneRound) {
        return oneRound.coin && oneRound.coin.id === _this.id;
      });

      if (grabRound) {
        grabRound.abortRound();
      }
    }

    $rootScope.$emit('cashshuffle-update');
    return this;
  };

  var uiPropertiesToKeep = ['shuffleThisCoin', 'inShufflePool', 'shufflePhase', 'id', 'service', 'playersInRound'];

  function CoinFactory(cashShuffleServiceInstance) {
    var _this2 = this;

    var i = $q.defer();
    this.cashshuffleService = cashShuffleServiceInstance;
    this.serviceReady = i.promise;
    this.coins = [];
    profileService.whenAvailable(function () {
      configService.whenAvailable(function (config) {
        _this2.update().catch(function (someError) {
          console.log('An error has occured in cashShuffleFactory:', someError);
          i.reject(someError);
        }).then(function () {
          i.resolve(_this2);
        });
      });
    });
    return this;
  }

  CoinFactory.prototype.update =
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var cashshuffleService, walletConfig, getUtxosFromWallet, allBchWallets, currentCoins, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oneWallet, coins, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _oneCoin, oldCoins, _i, _currentCoins, newCoin, oldCopy, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, oneCoin, checkAgainst, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, oneActiveRound, coinInFactory;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            cashshuffleService = this.cashshuffleService;
            walletConfig = {};

            getUtxosFromWallet =
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(someWallet) {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.abrupt("return", new Promise(function (resolve, reject) {
                          // Get our CashShuffle preferences so we can
                          // set the appropriate flags on our coins.
                          configService.whenAvailable(function (config) {
                            if (!config.cashshuffle) {
                              return resolve([]);
                            }

                            _.extend(walletConfig, config);

                            walletHistoryService.updateLocalTxHistoryByPage(someWallet, true, false, function (err, historicalTransactions) {
                              someWallet.getUtxos({}, function (error, utxos) {
                                if (error) {
                                  return reject(error);
                                } else {
                                  var coinsToReturn = [];
                                  var shuffleFeeAmount = 270;
                                  var walletHdMaster = someWallet.credentials.getDerivedXPrivKey();
                                  var _iteratorNormalCompletion = true;
                                  var _didIteratorError = false;
                                  var _iteratorError = undefined;

                                  try {
                                    for (var _iterator = utxos[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                      var oneCoin = _step.value;
                                      // Add a reference to the CashShuffle Service
                                      // so the instance methods can locate the
                                      // ShuffleClient instance.
                                      oneCoin.service = cashshuffleService; // These are the fields expected by `cashshufflejs-web`
                                      // {
                                      //   txid: '',
                                      //   vout: '',
                                      //   amountSatoshis: '',
                                      //   legacyAddress: '',
                                      //   privateKeyWif: ''
                                      // }

                                      var coinPrivateKey = walletHdMaster.derive(oneCoin.path).privateKey;
                                      oneCoin.amountSatoshis = Number(oneCoin.satoshis);
                                      oneCoin.amountBch = oneCoin.amountSatoshis * (1 / 1e8);
                                      oneCoin.publicKey = coinPrivateKey.toPublicKey();
                                      oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
                                      oneCoin.privateKeyWif = coinPrivateKey.toWIF();
                                      oneCoin.id = oneCoin.txid + ':' + oneCoin.vout;
                                      oneCoin.walletId = someWallet.id;
                                      oneCoin.walletName = someWallet.name;
                                      oneCoin.wallet = someWallet; // Is this coin in our CashShuffle "spend-only" wallet?
                                      // Is it in a change address?  If so, we cannot consider it shuffled.

                                      if (someWallet.name === 'CashShuffle Spending Wallet' && /m\/0/i.test(oneCoin.path)) {
                                        oneCoin.shuffled = true;
                                      }

                                      oneCoin.isDust = oneCoin.amountSatoshis <= 10000 ? true : false; // If we need to deduce whether a coin is shuffled based on
                                      // the inputs and outputs of it's previous transaction.
                                      //
                                      // oneCoin.shuffled = false;
                                      // oneCoin.previousTransaction = _.find(historicalTransactions, { txid: oneCoin.txid });
                                      // if (oneCoin.previousTransaction) {
                                      //   if (oneCoin.previousTransaction.outputs.length >= oneCoin.previousTransaction.inputs.length && oneCoin.previousTransaction.inputs.length >=3) {
                                      //     let minInput = _.min(_.compact(_.map(oneCoin.previousTransaction.inputs, 'amount')));
                                      //     let groupedOutputs = _.groupBy(oneCoin.previousTransaction.outputs, 'amount');
                                      //     let shuffledCoinsInTx = groupedOutputs[minInput-shuffleFeeAmount];
                                      //     if (shuffledCoinsInTx.length && shuffledCoinsInTx.length === oneCoin.previousTransaction.inputs.length ) {
                                      //       if (!oneCoin.shuffleThisCoin && oneCoin.amountSatoshis === minInput-shuffleFeeAmount) {
                                      //         oneCoin.shuffled = true;
                                      //       }
                                      //     }
                                      //   }
                                      // }

                                      oneCoin.shuffleThisCoin = false; // This will only stick for new coins or old coins being
                                      // instantiated for the first time (opening the wallet)

                                      if (!oneCoin.shuffled && oneCoin.confirmations && config.cashshuffle.shufflingEnabled && config.cashshuffle.autoShuffle) {
                                        oneCoin.shuffleThisCoin = true;
                                      }

                                      coinsToReturn.push(oneCoin);
                                    }
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

                                  return resolve(coinsToReturn);
                                }
                              });
                            });
                          });
                        }));

                      case 1:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function getUtxosFromWallet(_x) {
                return _ref2.apply(this, arguments);
              };
            }();

            allBchWallets = profileService.getWallets({
              coin: 'bch'
            });
            currentCoins = []; // Fetch all the coins currently in user's wallets

            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context2.prev = 8;
            _iterator2 = allBchWallets[Symbol.iterator]();

          case 10:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context2.next = 45;
              break;
            }

            oneWallet = _step2.value;
            coins = void 0;
            _context2.prev = 13;
            _context2.next = 16;
            return getUtxosFromWallet(oneWallet);

          case 16:
            coins = _context2.sent;
            _context2.next = 23;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t0 = _context2["catch"](13);
            console.log('Cannot fetch coins:', _context2.t0);
            return _context2.abrupt("continue", 42);

          case 23:
            _iteratorNormalCompletion5 = true;
            _didIteratorError5 = false;
            _iteratorError5 = undefined;
            _context2.prev = 26;

            for (_iterator5 = coins[Symbol.iterator](); !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              _oneCoin = _step5.value;
              currentCoins.push(_oneCoin);
            }

            _context2.next = 34;
            break;

          case 30:
            _context2.prev = 30;
            _context2.t1 = _context2["catch"](26);
            _didIteratorError5 = true;
            _iteratorError5 = _context2.t1;

          case 34:
            _context2.prev = 34;
            _context2.prev = 35;

            if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
              _iterator5.return();
            }

          case 37:
            _context2.prev = 37;

            if (!_didIteratorError5) {
              _context2.next = 40;
              break;
            }

            throw _iteratorError5;

          case 40:
            return _context2.finish(37);

          case 41:
            return _context2.finish(34);

          case 42:
            _iteratorNormalCompletion2 = true;
            _context2.next = 10;
            break;

          case 45:
            _context2.next = 51;
            break;

          case 47:
            _context2.prev = 47;
            _context2.t2 = _context2["catch"](8);
            _didIteratorError2 = true;
            _iteratorError2 = _context2.t2;

          case 51:
            _context2.prev = 51;
            _context2.prev = 52;

            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }

          case 54:
            _context2.prev = 54;

            if (!_didIteratorError2) {
              _context2.next = 57;
              break;
            }

            throw _iteratorError2;

          case 57:
            return _context2.finish(54);

          case 58:
            return _context2.finish(51);

          case 59:
            oldCoins = [];

            while (this.coins.length) {
              oldCoins.push(this.coins.pop());
            }

            for (_i = 0, _currentCoins = currentCoins; _i < _currentCoins.length; _i++) {
              newCoin = _currentCoins[_i];
              oldCopy = _.find(oldCoins, {
                id: newCoin.id
              });

              if (!oldCopy) {
                this.coins.push(new CashShuffleCoin(newCoin));
              } else {
                // Update the old coin with everything except what
                // is listed in the uiPropertiesToKeep array. This
                // stays an instance of CashShuffleCoin.
                this.coins.push(_.extend(oldCopy, _.pick(newCoin, _.difference(_.keys(newCoin), uiPropertiesToKeep))));
              }
            }

            console.log('Coins in all wallets:', this.coins); // This must be a freshly migrated wallet

            if (!(!(walletConfig && walletConfig.cashshuffle) || !(this.cashshuffleService && this.cashshuffleService.client))) {
              _context2.next = 65;
              break;
            }

            return _context2.abrupt("return", []);

          case 65:
            ; // If the client hasnt been started, do so now.

            if (walletConfig.cashshuffle.shufflingEnabled && !this.cashshuffleService.client.isShuffling) {
              this.cashshuffleService.client.start();
            }

            if (!(walletConfig.cashshuffle.shufflingEnabled && walletConfig.cashshuffle.autoShuffle)) {
              _context2.next = 87;
              break;
            }

            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context2.prev = 71;

            for (_iterator3 = this.coins[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              oneCoin = _step3.value;

              // Set the flag that tells the UI what's going on.
              if (!oneCoin.shuffled && oneCoin.confirmations) {
                oneCoin.update({
                  shuffleThisCoin: true
                });
              } // If it's not already in a round or waiting inside the client to be added to a
              // round, add it to the client so it can be shuffled when a pool opens up.


              checkAgainst = _.compact([].concat(_.map(this.cashshuffleService.client.rounds, 'coin'), this.cashshuffleService.client.coins));

              if (!_.find(checkAgainst, {
                txid: oneCoin.txid,
                vout: oneCoin.vout
              }) && oneCoin.shuffleThisCoin && oneCoin.confirmations) {
                this.cashshuffleService.client.addUnshuffledCoins(oneCoin);
              }
            }

            _context2.next = 79;
            break;

          case 75:
            _context2.prev = 75;
            _context2.t3 = _context2["catch"](71);
            _didIteratorError3 = true;
            _iteratorError3 = _context2.t3;

          case 79:
            _context2.prev = 79;
            _context2.prev = 80;

            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }

          case 82:
            _context2.prev = 82;

            if (!_didIteratorError3) {
              _context2.next = 85;
              break;
            }

            throw _iteratorError3;

          case 85:
            return _context2.finish(82);

          case 86:
            return _context2.finish(79);

          case 87:
            // If we have coins in active rounds but they are no longer in
            // this factory, they must have been spent before the round
            // could complete.  In this case, abort the CashShuffle round.
            _iteratorNormalCompletion4 = true;
            _didIteratorError4 = false;
            _iteratorError4 = undefined;
            _context2.prev = 90;

            for (_iterator4 = this.cashshuffleService.client.rounds[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              oneActiveRound = _step4.value;
              coinInFactory = _.find(this.coins, {
                txid: oneActiveRound.coin.txid,
                vout: oneActiveRound.coin.vout
              });

              if (!coinInFactory) {
                console.log('A coin from an active round has gone missing.  Aborting round.', oneActiveRound.coin);
                oneActiveRound.abortRound();
              }
            }

            _context2.next = 98;
            break;

          case 94:
            _context2.prev = 94;
            _context2.t4 = _context2["catch"](90);
            _didIteratorError4 = true;
            _iteratorError4 = _context2.t4;

          case 98:
            _context2.prev = 98;
            _context2.prev = 99;

            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }

          case 101:
            _context2.prev = 101;

            if (!_didIteratorError4) {
              _context2.next = 104;
              break;
            }

            throw _iteratorError4;

          case 104:
            return _context2.finish(101);

          case 105:
            return _context2.finish(98);

          case 106:
            $rootScope.$emit('cashshuffle-update');
            return _context2.abrupt("return", this.coins);

          case 108:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[8, 47, 51, 59], [13, 19], [26, 30, 34, 42], [35,, 37, 41], [52,, 54, 58], [71, 75, 79, 87], [80,, 82, 86], [90, 94, 98, 106], [99,, 101, 105]]);
  }));
  return CoinFactory;
}]); // )();