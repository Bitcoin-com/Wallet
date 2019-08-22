'use strict';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

(function () {
  angular.module('copayApp.controllers').controller('tabCashshuffleController', tabCashshuffleController);

  function tabCashshuffleController(bitcoinCashJsService, bwcError, clipboardService, configService, gettextCatalog, $interval, $ionicHistory, $ionicModal, $ionicNavBarDelegate, $ionicPopover, lodash, $log, platformInfo, popupService, profileService, $rootScope, $scope, sendFlowService, soundService, $state, storageService, $timeout, txFormatService, walletAddressListenerService, walletService, $ionicScrollDelegate, $filter, $stateParams, txpModalService, externalLinkService, addressbookService, $window, timeService, feeService, appConfigService, rateService, walletHistoryService, cashshuffleService) {
    var _ = lodash;
    $scope.client = cashshuffleService.client;
    $scope.preferences = cashshuffleService.preferences;
    $scope.cardVisibility = {
      shuffling: true,
      unshuffled: true,
      shuffled: true,
      dust: false
    };

    $scope.displayCoinId = function (someCoin) {
      return someCoin.id.substring(someCoin.id.length - 10, someCoin.id.length);
    };

    $scope.toggleCardVisibility = function (someCardName) {
      return $scope.cardVisibility[someCardName] = !!!$scope.cardVisibility[someCardName];
    };

    $scope.toggleShuffle = function (someCoin) {
      console.log('Toggling shuffle for coin', someCoin.id);
      someCoin.update({
        shuffleThisCoin: !!!someCoin.shuffleThisCoin
      });
      return someCoin;
    };

    $scope.abortShuffle = function (someCoin) {
      if (someCoin.abortShuffleClicked) {
        return someCoin.update({
          shuffleThisCoin: false,
          abortShuffleClicked: false
        });
      } else {
        // Reset the prompt
        $timeout(function () {
          _.extend(someCoin, {
            abortShuffleClicked: false
          });
        }, 2000);
        return _.extend(someCoin, {
          abortShuffleClicked: true
        });
      }
    };

    $scope.getCoins = function (whichCoins) {
      if (!cashshuffleService) {
        return [];
      }

      var coinsToReturn;

      switch (whichCoins) {
        case 'shuffling':
          coinsToReturn = !cashshuffleService.client ? [] : _.map(cashshuffleService.client.rounds, 'coin');
          break;

        case 'unshuffled':
          // Return all coins that are flagged for shuffle
          // but are not currently in a CashShuffle pool
          var currentlyShuffling = _.map(cashshuffleService.client ? cashshuffleService.client.rounds : [], 'coin');

          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, function (oneCoin) {
            return !_.find(currentlyShuffling, {
              id: oneCoin.id
            }) && !oneCoin.isDust && (!oneCoin.shuffled || oneCoin.shuffleThisCoin);
          });
          break;

        case 'shuffled':
          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, {
            shuffled: true,
            shuffleThisCoin: false
          });
          break;

        case 'dust':
          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, {
            isDust: true
          });
          break;

        default:
          break;
      }

      return _.sortByOrder(coinsToReturn, ['shuffleThisCoin', 'amountSatoshis'], [false, false]);
    };

    window.stuff = {
      lodash: lodash,
      walletService: walletService,
      configService: configService,
      rateService: rateService,
      walletHistoryService: walletHistoryService,
      appConfigService: appConfigService,
      rootScope: $rootScope,
      cashshuffleService: cashshuffleService,
      profileService: profileService,
      someWallet: profileService.getWallets({
        coin: 'bch'
      })[0],
      allWallets: profileService.getWallets({
        coin: 'bch'
      }),
      storageService: storageService,
      testShuffleLookup: function testShuffleLookup(txid, vout, depthRemaining) {
        var outgoingTx = _.find(window.mapping.transactions, {
          action: 'sent',
          txid: txid
        });

        var shuffleInputAddress;

        if (_.find(window.mapping.addresses, {
          address: outgoingTx.outputs[vout].address
        })) {
          console.log('Yep.  That was it', outgoingTx);
          shuffleInputAddress = _.reduce(_.map(outgoingTx.inputs, 'address'), function (winner, oneAddress) {
            if (winner) {
              return winner;
            }

            console.log('Now looking for address:', oneAddress);
            return _.find(window.mapping.addresses, {
              address: oneAddress
            });
          }, undefined);
        }

        console.log('We got the input address:', shuffleInputAddress);
        console.log('So its from wallet named', _.get(shuffleInputAddress, 'inWallet.name'));

        if (shuffleInputAddress.inWallet.isCashShuffleWallet) {
          console.log('This is from a shuffle wallet so it must be a reshuffle');
        } else {
          return shuffleInputAddress;
        }
      },
      exposeMapping: function exposeMapping() {
        var getMapping =
        /*#__PURE__*/
        function () {
          var _ref = _asyncToGenerator(
          /*#__PURE__*/
          regeneratorRuntime.mark(function _callee() {
            var mapping, getAddressesAndTransactions, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, oneWallet, results;

            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    mapping = {
                      transactions: [],
                      addresses: [],
                      wallets: []
                    };

                    getAddressesAndTransactions = function getAddressesAndTransactions(someWallet) {
                      return new Promise(function (resolve, reject) {
                        walletService.getMainAddresses(someWallet, {}, function (err, addresses) {
                          if (err) {
                            return reject(err);
                          }

                          walletHistoryService.getCachedTxHistory(someWallet.id, function (err, transactions) {
                            if (err) {
                              return reject(err);
                            }

                            walletService.getBalance(someWallet, {}, function (err, balance) {
                              return resolve({
                                balance: balance,
                                addresses: addresses,
                                transactions: transactions
                              });
                            });
                          });
                        });
                      });
                    };

                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context.prev = 5;
                    _iterator = profileService.getWallets({
                      coin: 'bch'
                    })[Symbol.iterator]();

                  case 7:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                      _context.next = 27;
                      break;
                    }

                    oneWallet = _step.value;
                    results = void 0;
                    _context.prev = 10;
                    _context.next = 13;
                    return getAddressesAndTransactions(oneWallet);

                  case 13:
                    results = _context.sent;
                    _context.next = 20;
                    break;

                  case 16:
                    _context.prev = 16;
                    _context.t0 = _context["catch"](10);
                    console.log(_context.t0);
                    return _context.abrupt("continue", 24);

                  case 20:
                    while (results.addresses.length) {
                      mapping.addresses.push(_.extend(results.addresses.pop(), {
                        inWallet: oneWallet
                      }));
                    }

                    while (results.balance.byAddress && results.balance.byAddress.length) {
                      mapping.addresses.push(_.extend(results.balance.byAddress.pop(), {
                        inWallet: oneWallet,
                        isRemote: true
                      }));
                    }

                    while (results.transactions.length) {
                      mapping.transactions.push(results.transactions.pop());
                    }

                    mapping.wallets.push(oneWallet);

                  case 24:
                    _iteratorNormalCompletion = true;
                    _context.next = 7;
                    break;

                  case 27:
                    _context.next = 33;
                    break;

                  case 29:
                    _context.prev = 29;
                    _context.t1 = _context["catch"](5);
                    _didIteratorError = true;
                    _iteratorError = _context.t1;

                  case 33:
                    _context.prev = 33;
                    _context.prev = 34;

                    if (!_iteratorNormalCompletion && _iterator.return != null) {
                      _iterator.return();
                    }

                  case 36:
                    _context.prev = 36;

                    if (!_didIteratorError) {
                      _context.next = 39;
                      break;
                    }

                    throw _iteratorError;

                  case 39:
                    return _context.finish(36);

                  case 40:
                    return _context.finish(33);

                  case 41:
                    return _context.abrupt("return", mapping);

                  case 42:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, null, [[5, 29, 33, 41], [10, 16], [34,, 36, 40]]);
          }));

          return function getMapping() {
            return _ref.apply(this, arguments);
          };
        }(); // I want a function where I input a CashShuffle txid num and it gives me the wallet
        // from which the closest non-shuffle input came.


        var cswallet = _.find(profileService.getWallets({
          coin: 'bch'
        }), {
          disableReceive: true
        });

        var oneShuffleCoin = _.find(cashshuffleService.coinFactory.coins, {
          shuffled: true
        });

        console.log('Finding the origin wallet of coin', oneShuffleCoin);
        getMapping().then(function (mapping) {
          console.log('Mapping ready');
          window._ = lodash;
          window.oneShuffleCoin = oneShuffleCoin;
          window.cswallet = cswallet;
          window.mapping = mapping;
        });
      }
    };
    var scopeEventListeners = [];
    cashshuffleService.serviceReady.then(function () {
      scopeEventListeners.push($rootScope.$on('cashshuffle-update', function () {
        $timeout(function () {
          try {
            $scope.$apply();
          } catch (nope) {
            return;
          }
        }, 500);
      }));
    }).catch(function () {
      console.log('Error preparing CashShuffle service');
    });
  }
})();