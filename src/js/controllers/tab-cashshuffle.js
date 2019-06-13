'use strict';

(function(){
  angular
    .module('copayApp.controllers')
    .controller('tabCashshuffleController', tabCashshuffleController);

  function tabCashshuffleController(
    bitcoinCashJsService
    , bwcError
    , clipboardService
    , configService
    , gettextCatalog
    , $interval
    , $ionicHistory
    , $ionicModal
    , $ionicNavBarDelegate
    , $ionicPopover
    , lodash
    , $log
    , platformInfo
    , popupService
    , profileService
    , $rootScope
    , $scope
    , sendFlowService
    , soundService
    , $state 
    , storageService
    , $timeout
    , txFormatService
    , walletAddressListenerService
    , walletService
    , $ionicScrollDelegate
    , $filter
    , $stateParams
    , txpModalService
    , externalLinkService
    , addressbookService
    , $window
    , timeService
    , feeService
    , appConfigService
    , rateService
    , walletHistoryService
    , cashshuffleService
  ) {
// $rootScope.$broadcast('cashshuffle-update');
// listeners = [
//   $rootScope.$on('cashshuffle-update', (cashShuffleService) => {
//     $scope.CashShuffleEnabled = cashShuffleService.preferences.shufflingEnabled;
//   }),

    const _ = lodash;

    $scope.client = cashshuffleService.client;
    $scope.preferences = cashshuffleService.preferences;

    $scope.cardVisibility = {
      shuffling: true,
      unshuffled: true,
      shuffled: true,
      dust: false
    };

    $scope.displayCoinId = function(someCoin) {
      return someCoin.id.substring(someCoin.id.length-10,someCoin.id.length);
    };

    $scope.toggleCardVisibility = function(someCardName) {
      return $scope.cardVisibility[someCardName] = !!!$scope.cardVisibility[someCardName];
    };

    $scope.toggleShuffle = function(someCoin) {
      console.log('Toggling shuffle for coin', someCoin.id);
      let coinsToShuffle = _.filter(cashshuffleService.coinFactory.coins, { shuffleThisCoin: true });

      someCoin.toggleShuffle();
      return someCoin;
    };

    $scope.abortShuffle = function(someCoin) {
      if (someCoin.abortShuffleClicked) {
        someCoin.toggleShuffle();
        return _.extend(someCoin, {
          abortShuffleClicked: false
        });
      }
      else {

        // Reset the prompt
        $timeout(() => {
            _.extend(someCoin, {
              abortShuffleClicked: false
            });
        }, 2000);
        return _.extend(someCoin, {
          abortShuffleClicked: true
        });
      }
    };

    $scope.getCoins = function(whichCoins) {
      if (!cashshuffleService) {
        return [];
      }

      let coinsToReturn;
      switch(whichCoins) {
        case 'shuffling':
          coinsToReturn = !cashshuffleService.client ? [] : _.map(cashshuffleService.client.rounds, 'coin');
        break;
        case 'unshuffled':
          // Return all coins that are flagged for shuffle
          // but are not currently in a CashShuffle pool
          let currentlyShuffling = _.map(cashshuffleService.client ? cashshuffleService.client.rounds : [], 'coin');
          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, (oneCoin) => {
            return !_.find(currentlyShuffling, { id: oneCoin.id }) && !oneCoin.isDust && (!oneCoin.shuffled || oneCoin.shuffleThisCoin);
          });
        break;
        case 'shuffled':
          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, { shuffled: true });
        break;
        case 'dust':
          coinsToReturn = _.filter(cashshuffleService.coinFactory.coins, { isDust: true });
        break;
        default:
        break;
      }
      return _.sortBy(coinsToReturn, ['shuffleThisCoin']);

    };

    cashshuffleService
    .serviceReady
    .then(() => {

      $rootScope.$on('bwsEvent', function ionicViewEvent(event, walletId) {
        $timeout(() => {
          try {
            $scope.$apply();
          }
          catch(nope) {
            return;
          }
        }, 500);
      });

      $rootScope.$on('cashshuffle-update', () => {
        $timeout(() => {
          try {
            $scope.$apply();
          }
          catch(nope) {
            return;
          }
        }, 500);
      });

      for (let oneEvenName of ['shuffle', 'skipped', 'phase', 'abort', 'message', 'stats']) {
        cashshuffleService.client.on(oneEvenName, () => {
          try {
            $scope.$apply();
          }
          catch(nope) {
            return;
          }
        });
      }

    });

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
      someWallet: profileService.getWallets({ coin: 'bch' })[0],
      allWallets: profileService.getWallets({ coin: 'bch' }),
      storageService: storageService,
      testShuffleLookup: function(txid, vout, depthRemaining) {

        let outgoingTx = _.find(window.mapping.transactions, {
          action: 'sent',
          txid: txid
        });

        let shuffleInputAddress;
        if (_.find(window.mapping.addresses, { address: outgoingTx.outputs[vout].address })) {
          console.log('Yep.  That was it', outgoingTx);
          shuffleInputAddress = _.reduce(_.map(outgoingTx.inputs, 'address'), function(winner, oneAddress) {
            if (winner) {
              return winner;
            }
            console.log('Now looking for address:', oneAddress);

            return _.find(window.mapping.addresses, { address: oneAddress });
          }, undefined);
        }

        console.log('We got the input address:', shuffleInputAddress);
        console.log('So its from wallet named', _.get(shuffleInputAddress, 'inWallet.name'));

        if (shuffleInputAddress.inWallet.isCashShuffleWallet) {
          console.log('This is from a shuffle wallet so it must be a reshuffle');
        }
        else {
          return shuffleInputAddress;
        }

      },
      exposeMapping: function() {

        const getMapping = async function() {
          const mapping = {
            transactions: [],
            addresses: [],
            wallets: []
          };

          const getAddressesAndTransactions = function(someWallet) {
            return new Promise((resolve, reject) => {
              walletService.getMainAddresses(someWallet, {}, function(err, addresses) {
                if (err) { return reject(err); }
                walletHistoryService.getCachedTxHistory(someWallet.id, function(err, transactions) {
                  if (err) { return reject(err); }
                  walletService.getBalance(someWallet, {}, function(err, balance){
                    return resolve({
                      balance: balance,
                      addresses: addresses,
                      transactions: transactions
                    });
                  })
                });
              });
            });
          };

          for (let oneWallet of profileService.getWallets({ coin: 'bch' })) {
            let results;
            try {
              results = await getAddressesAndTransactions(oneWallet);
            }
            catch(nope) {
              console.log(nope);
              continue;
            }

            while(results.addresses.length){
              mapping.addresses.push(_.extend(results.addresses.pop(), {
                inWallet: oneWallet
              }));
            }

            while(results.balance.byAddress && results.balance.byAddress.length){
              mapping.addresses.push(_.extend(results.balance.byAddress.pop(), {
                inWallet: oneWallet,
                isRemote: true
              }));
            }

            while(results.transactions.length){
              mapping.transactions.push(results.transactions.pop());
            }

            mapping.wallets.push(oneWallet);

          }

          return mapping;
        };

        // I want a function where I input a CashShuffle txid num and it gives me the wallet
        // from which the closest non-shuffle input came.

        let cswallet = _.find(profileService.getWallets({ coin: 'bch' }), { disableReceive: true });
        let oneShuffleCoin = _.find(cashshuffleService.coinFactory.coins, { shuffled: true });
        console.log('Finding the origin wallet of coin', oneShuffleCoin);

        getMapping()
        .then((mapping) => {
          console.log('Mapping ready');
          window._ = lodash;
          window.oneShuffleCoin = oneShuffleCoin;
          window.cswallet = cswallet;
          window.mapping = mapping;
        });

      }
    };

    console.log('CashShuffle Controller loaded!!!');

    $scope.$on('$ionicView.beforeEnter', () => {

    });
    // $scope.$on('$ionicView.enter', onEnter);
    // $scope.$on('$ionicView.afterEnter', onAfterEnter);
    // $scope.$on('$ionicView.leave', onLeave);


  }
})();
