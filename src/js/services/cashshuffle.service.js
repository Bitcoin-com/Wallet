// 'use strict';

// (function(){

angular
.module('bitcoincom.services')
.service('cashshuffleService', [
  '$log',
  '$rootScope',
  'profileService',
  'ongoingProcess',
  'configService',
  'walletService',
  'walletHistoryService',
  'walletAddressListenerService',
  'pushNotificationsService',
  'lodash',
  '$timeout',
  '$q',
  '$state',
  'soundService',
  'cashshuffleCoinFactory',
  function cashshuffleService(
    $log,
    $rootScope,
    profileService,
    ongoingProcess,
    configService,
    walletService,
    walletHistoryService,
    walletAddressListenerService,
    pushNotificationsService,
    _,
    $timeout,
    $q,
    $state,
    soundService,
    cashshuffleCoinFactory) {

      const defaultServerStatsUri = 'https://shuffle.servo.cash:8080/stats';

      function CashShuffleService(properties) {
        _.extend(this, properties);

        // Used to ensure that address selection is transactional.  This
        // keeps the `walletService` from assigning the same output
        // address for multiple CashShuffle transactions.
        let shuffleAddressSelectorIsBusy = false;

        // Sets a promise that resolves onces the ShuffleClient
        // has been instantiated.  This is watched by the 
        // CashShuffleCoin instances so they know when it's
        // safe to bind the ShuffleClient to themselves.
        const i = $q.defer();
        this.serviceReady = i.promise;

        this.client = undefined;
        this.coinFactory = new cashshuffleCoinFactory(this);

        let initialWalletStates = {};

        this.preferences = {
          shufflingEnabled: false,
          spendOnlyShuffled: false,
          statusByWalletId: {},
          serverStatsUri: defaultServerStatsUri,
          preferencesLoading: true
        };

        this.blockheight = 0;

        // This function checks every 5 seconds to see if we are waiting
        // on transaction confirmations before shuffling.  If so, we hit
        // the bitcoin.com REST API using the version of BITBOX packaged
        // with the `cashshufflejs-web` library.  If a new block has been
        // since we last checked, we rebuild our utxo data.
        let getBlockheight = function() {

          if (service.preferences.shufflingEnabled && service.coinFactory && service.coinFactory.coins) {

            // Only get the blockheight if we are waiting on a confirmation
            if (!_.find(service.coinFactory.coins, { confirmations: 0 })) {
              return;
            }

            let BITBOX = _.get(service, 'client.util.coin.BITBOX');

            if (!BITBOX) {
              console.log('Error using Bitbox to fetch blockheight');
              return;
            }

            BITBOX
            .Blockchain
            .getBlockchainInfo()
            .then(function(info) {

              if (!info || !info.blocks) {
                console.log('Error using Bitbox to fetch blockheight');
                return;
              }

              if (info.blocks > service.blockheight) {
                $rootScope.$emit('cashshuffle-update-coins');
              }

              _.extend(service, {
                blockheight: info && info.blocks || service.blockheight
              });

              return;

            })
            .catch(function(nope) {
              console.log('Error fetching blockheight');
            });

          }
        };

        this.getBlockheightInterval = setInterval(_.bind(getBlockheight, this), 5000);

        this
        .fetchPreferences()
        .then((cashShufflePreferences) => {

          this
          .coinFactory
          .serviceReady
          .catch((someError) => {
            i.reject(someError);
          })
          .then(() => {
            // If CashShuffle is disabled in settings, no further setup is required.
            if (!cashShufflePreferences.shufflingEnabled) {
              console.log('CashShuffle is disabled in settings');
              return i.reject();
            }

            this
            .registerClient()
            .then(() => {
              console.log('The CashShuffle service is ready and the ShuffleClient is registered!');
              setTimeout(() => {

              }, 500);
              i.resolve(this);
            })
            .catch((someError) => {
              i.reject(someError);
            });

          });

        });

        _.extend(this, {
          update: this.coinFactory.update,
          coins: this.coinFactory.coins
        });

        this.defaultServerStatsUri = defaultServerStatsUri;

        $rootScope.$on('cashshuffle-update-coins', (event, wallet) => {

          if (this.coinFactory) {

            this
            .coinFactory
            .update(wallet)
            .then(function updateCoinFactory(arrayOfCoins) {

              $rootScope.$emit('cashshuffle-update-ui', {coins: arrayOfCoins}, wallet);

              return;
            })
            .catch(function updateCoinFactory(err) {
              $log.error(err);
            });

          }

        });

        return this;
      };


      // Function called by the CashShuffle library which returns an
      // empty address to store change from the shuffle transaction.
      CashShuffleService.prototype.getChangeAddress = function(unshuffledCoinDetails) {

        return new Promise((resolve, reject) => {

          let grabWallet = _.find(profileService.getWallets({ coin: 'bch' }), { id: unshuffledCoinDetails.walletId });

          walletService.getCashShuffleChangeAddress(grabWallet, unshuffledCoinDetails, (nope, someAddressObject) => {
            if (nope) {
              return reject(nope);
            }

            return resolve(someAddressObject);

          });

        });

      };


      // Function called by the CashShuffle library which returns an
      // empty address to store a freshly shuffled coin.
      CashShuffleService.prototype.getShuffleAddress = function() {

        return new Promise((resolve, reject) => {

          let grabWallet = _.find(profileService.getWallets({ coin: 'bch' }), { isCashShuffleWallet: true });

          let walletHdMaster = grabWallet.credentials.getDerivedXPrivKey();

          const getUnusedWalletAddress = function() {
            return new Promise((resolve, reject) => {

              grabWallet.getTxHistory({}, function(err, allTxs) {

                // Build an array of all addresses used as either an input or an output
                // from all transactions that have ever affected this wallet.  We will
                // need to make sure none of these addresses are chosen as our
                // final shuffle address.  This is necessary because the wallet backend
                // does not correctly distinguish between empty addresses and inactive 
                // ones.  Fixing this would eliminate the need for this additional call.
                let addressesToExclude = _.map(_.flatten(_.map(allTxs, 'inputs').concat(_.map(allTxs, 'outputs'))), 'address');

                grabWallet.getMainAddresses({}, function(err, allWalletAddresses) {
                  if (err) {
                    console.log('ERROR!', err);
                  }

                  // Also exclude addresses currently being used in active shuffle rounds.
                  if (service && service.client && service.client.rounds) {
                    for (let oneRound of service.client.rounds) {
                      addressesToExclude.push(_.get(oneRound,'shuffled.legacyAddress'));
                    }
                  }

                  // Exclude addresses containing shuffled utxos, just to be safe.
                  if (service && service.coinFactory && service.coinFactory.coins) {
                    for (let oneCoin of service.coinFactory.coins) {
                      addressesToExclude.push(oneCoin.legacyAddress);
                    }
                  }

                  // De-dupe and remove undefined values.
                  addressesToExclude = _.compact(_.uniq(addressesToExclude));

                  allWalletAddresses = _.reduce(allWalletAddresses, function(keepers, oneWalletAddress) {
                    // Make sure each address has all the necessary data
                    // and has never seen a transaction.
                    if (!oneWalletAddress.address || !oneWalletAddress.path || oneWalletAddress.hasActivity) {
                      return keepers;
                    }

                    // Attach the individual components of the address path to
                    // each address object so we can sort by it later.
                    let splitPath = oneWalletAddress.path.split('/');
                    _.extend(oneWalletAddress, {
                      pathX: Number(splitPath[1]),
                      pathY: Number(splitPath[2])
                    });

                    // We don't want change addresses.
                    if (oneWalletAddress.pathX !== 0) {
                      return keepers;
                    }

                    // Finally, it must not appear in our list of addresses to exclude
                    if (addressesToExclude.indexOf(oneWalletAddress.address) === -1) {
                      keepers.push(oneWalletAddress);
                    }

                    return keepers;
                  }, []);

                  // Sort the potential addresses in ascending order by `path` 
                  allWalletAddresses = _.sortByOrder(allWalletAddresses, ['pathY']);

                  walletService.getAddressObj(grabWallet, allWalletAddresses[0].address, (err, someAddressObject) => {
                    if (err) {
                      return reject(err);
                    }

                    let coinPrivateKey = walletHdMaster.derive(someAddressObject.path).privateKey;

                    let oneCoin = {};

                    oneCoin.path = someAddressObject.path;
                    oneCoin.publicKey = coinPrivateKey.toPublicKey();
                    oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
                    oneCoin.privateKeyWif = coinPrivateKey.toWIF();
                    oneCoin.walletId = grabWallet.id;
                    oneCoin.walletName = grabWallet.name;
                    oneCoin.wallet = grabWallet;

                    return resolve(oneCoin);

                  });

                }, false);

              });

            });

          };

          let numOfAttempts = 0;

          const tryOneTime = () => {
            if (this.shuffleAddressSelectorIsBusy) {

              if (numOfAttempts >= 5) {
                return reject( new Error('ShuffleAddress Timeout') );
              }
              else {
                numOfAttempts++;
                setTimeout(() => {
                  tryOneTime();
                }, 3000);
              }

            }
            else {

              _.extend(this, {
                shuffleAddressSelectorIsBusy: true
              });

              getUnusedWalletAddress()
              .then((someAddress) => {
                _.extend(this, {
                  shuffleAddressSelectorIsBusy: false
                });
                return resolve(someAddress);
              })
              .catch((nope) => {
                console.log('Error fetching unused address for CashShuffle transaction:', nope);
                _.extend(this, {
                  shuffleAddressSelectorIsBusy: false
                });
                return reject(nope);
              })
            }
          };

          tryOneTime();

        });

      };

      CashShuffleService.prototype.fetchPreferences = function() {

        return new Promise((resolve, reject) => {
          configService.get( (err, currentWalletConfig) => {
            if (err) {
              return reject(err);
            }

            let currentCashShuffleConfig = currentWalletConfig && currentWalletConfig.cashshuffle || {};

            let bchWallets = profileService.getWallets({ coin: 'bch' });

            let statuses = {};

            for (let oneWallet of bchWallets) {
              if (typeof currentCashShuffleConfig.statusByWalletId[oneWallet.id] !== 'boolean') {
                statuses[oneWallet.id] = false;
              }
              else {
                statuses[oneWallet.id] = currentCashShuffleConfig.statusByWalletId[oneWallet.id];
              }

              // The CashShuffle wallet must always have shuffling enabled.
              if (oneWallet.isCashShuffleWallet) {
                statuses[oneWallet.id] = true;
              }

            }

            _.extend(this.preferences, {
              statusByWalletId: statuses,
              shufflingEnabled: currentCashShuffleConfig.shufflingEnabled || false,
              spendOnlyShuffled: currentCashShuffleConfig.spendOnlyShuffled || false,
              serverStatsUri: currentCashShuffleConfig.serverStatsUri || defaultServerStatsUri,
              preferencesLoading: false
            });

            return resolve(this.preferences);

          });

        });

      };

      CashShuffleService.prototype.registerClient = function() {
        return new Promise((resolve, reject) => {

          this.client = new ShuffleClient({
            coins: _.filter(this.coinFactory.coins, { shuffleThisCoin: true, shuffleThisWallet: true }),
            hooks: {
              change: _.bind(this.getChangeAddress, this),
              shuffled: _.bind(this.getShuffleAddress, this)
            },
            protocolVersion: 300,
            maxShuffleRounds: 6,
            // Disable automatically joining shuffle rounds
            // once a connection with the server is established
            disableAutoShuffle: false,
            serverStatsUri: this.preferences.serverStatsUri
          });

          this.client.on('phase', (someData) => {

            let coinInQuestion = _.find(this.coinFactory.coins, { txid: someData.round.coin.txid, vout: someData.round.coin.vout });

            return coinInQuestion.update({
              playersInRound: someData.round.numberOfPlayers ? someData.round.numberOfPlayers : 1,
              shufflePhase: someData.round.phase,
              inShufflePool: true
            });

          });

          this.client.on('message', (someData) => {

            let coinInQuestion = _.find(this.coinFactory.coins, { txid: someData.round.coin.txid, vout: someData.round.coin.vout });

            return coinInQuestion.update({
              playersInRound: someData.round.numberOfPlayers ? someData.round.numberOfPlayers : 1,
              shufflePhase: someData.round.phase,
              inShufflePool: true
            });

          });

          this.client.on('abort', (roundData) => {

            let coinInQuestion = _.find(this.coinFactory.coins, { txid: roundData.coin.txid, vout: roundData.coin.vout });

            if (coinInQuestion) {
              console.log('The user has aborted a shuffle for coin', coinInQuestion.txid, ':', coinInQuestion.vout,' ==>', roundData);
            }

            return coinInQuestion.update({
              shuffleThisCoin: false,
              shufflePhase: undefined,
              playersInRound: undefined,
              inShufflePool: false
            });

          });

          this.client.on('failed', (roundData) => {
            let coinInQuestion = _.find(this.coinFactory.coins, { txid: roundData.coin.txid, vout: roundData.coin.vout });

            if (coinInQuestion) {
              console.log('Got a failed shuffle event concerning', coinInQuestion.txid, ':', coinInQuestion.vout,':', roundData);
            }
            else {
              return;
            }

            let tryAgainOrNo = service.preferences.shufflingEnabled ? true : false;

            return coinInQuestion.update({
              shuffleThisWallet: service.preferences.statusByWalletId[coinInQuestion.wallet.id],
              shuffleThisCoin: tryAgainOrNo,
              playersInRound: undefined,
              shufflePhase: '',
              inShufflePool: false
            });

          });

          this.client.on('shuffle', (roundData) => {
            let coinInQuestion = _.find(this.coinFactory.coins, { txid: roundData.coin.txid, vout: roundData.coin.vout });

            if (!coinInQuestion) {
              return;
            }

            coinInQuestion.update({
              shuffleThisCoin: false,
              playersInRound: roundData.numberOfPlayers ? roundData.numberOfPlayers : 1,
              shufflePhase: '',
              inShufflePool: false
            });

            soundService.play('misc/payment_received.mp3');

            // Scan for new wallet addresses (including our change address)
            walletService.startScan(roundData.coin.wallet, () => {
              walletService.startScan(roundData.shuffled.wallet, () => {

                // Update our transaction history for all wallets involved
                let cashShuffleWallet = _.find(profileService.getWallets(), { isCashShuffleWallet: true });
                walletHistoryService.updateLocalTxHistoryByPage(roundData.coin.wallet, true, false, (err, transactionHistory) => {
                  walletHistoryService.updateLocalTxHistoryByPage(cashShuffleWallet, true, false, (err, transactionHistory) => {

                    this
                    .coinFactory
                    .update()
                    .then(()=>{
                      // console.log('Coins Updated!');

                    })
                    .catch(console.log);

                  });
                });
              });
            });
          });

          for (let oneEventName of ['abort', 'stats']) {
            this.client.on(oneEventName, () => {
              $rootScope.$emit('cashshuffle-update-ui');
            });
          }

          return resolve(this.client);

        });

      };

      CashShuffleService.prototype.changeShuffleServer = function(newShuffleStatsUri) {
        this.preferences.serverStatsUri = newShuffleStatsUri;
        this.updateWalletPreferences(true);
        return this.preferences.serverStatsUri;
      };

      CashShuffleService.prototype.updateWalletPreferences = function(updateServerStatsUri) {
        _.extend(this.preferences, { preferencesLoading: true });

        let newPreferences = {
          cashshuffle: {
            statusByWalletId: this.preferences.statusByWalletId,
            shufflingEnabled: this.preferences.shufflingEnabled,
            spendOnlyShuffled: this.preferences.shufflingEnabled ? this.preferences.spendOnlyShuffled : false
          }
        };

        let changeServers = false;
        if (updateServerStatsUri) {
          if (this.preferences.serverStatsUri !== this.client && this.client.serverStatsUri) {
            changeServers = true;
          }
          newPreferences.cashshuffle.serverStatsUri = this.preferences.serverStatsUri;
        }

        configService.set(newPreferences, (err) => {
          if (err) $log.debug(err);

          if (changeServers && this.client) {
            this
            .client
            .changeShuffleServer(newPreferences.cashshuffle.serverStatsUri)
            .then(() => {
              console.log('Shuffle server updated to', newPreferences.cashshuffle.serverStatsUri);
            })
            .catch(console.log);
          }

          // Reset all coins when settings are changed.
          // Their state will be corrected later based
          // on the new settings.
          for (let oneCoin of service.coinFactory.coins) {
            oneCoin.update({
              shuffleThisCoin: false,
              playersInRound: undefined,
              inShufflePool: false
            });
          }

          // Now purge the ShuffleClient's internal coin array.
          while (this.client && this.client.coins.length) {
            this.client.coins.pop();
          }

          if (!newPreferences.cashshuffle.shufflingEnabled) {

            if (!this.client) {
              return;
            }

            console.log('Closing all active shuffle rounds because CashShuffle is disabled in preferences');
            let activeShuffleRounds = this.client ? this.client.rounds : []; 
            // Kill any active shuffle rounds on the client
            while (activeShuffleRounds.length) {
              let oneRound = this.client.rounds.pop();
              oneRound.abortRound();
              let coinFromFactory = _.find(this.coinFactory.coins, { txid: oneRound.coin.txid, vout: oneRound.coin.vout });
              if (coinFromFactory) {
                coinFromFactory.update({
                  shuffleThisCoin: false,
                  playersInRound: undefined,
                  shufflePhase: '',
                  inShufflePool: false
                });
              }
            }
            this.client.stop(true);

          }
          else {

            if (this.client && !this.client.isShuffling) {
              this.client.start();
            }
            else {

              this
              .registerClient()
              .then(() => {
                console.log('The CashShuffle service is ready and the ShuffleClient is registered!');
                this.client.start();
              })
              .catch((someError) => {
                console.log('Could not set up ShuffleClient after CashShuffle settings update', someError);
              });

            }

          }

          this
          .coinFactory
          .update()
          .then(() => {
            $timeout(() => {
              $rootScope.$emit('cashshuffle-update-ui');
            }, 2000);
          })
          .catch(console.log);

        });

        function createCashShuffleWallet() {
          let allWallets = profileService.getWallets({ coin: 'bch' });

          let cashShuffleWallet = _.find(allWallets, { name: 'Private Spending Wallet'});

          if (!cashShuffleWallet) {
            console.log('No cashshuffle wallet.  Creating one!!!!');

            var walletOptions = {
              name: 'Private Spending Wallet',
              m: 1,
              n: 1,
              myName: null,
              networkName: 'livenet',
              bwsurl: 'https://bch.api.wallet.bitcoin.com/bws/api',
              coin: 'bch',
              passphrase: null
            };

            ongoingProcess.set('creatingWallet', true);
            $timeout(function() {

              profileService.createWallet(walletOptions, (err, client) => {
                ongoingProcess.set('creatingWallet', false);

                ongoingProcess.set('generatingNewAddress', true);
                walletService.getAddress(client, true, (e, addr) => {
                  ongoingProcess.set('generatingNewAddress', false);

                  walletService.updateRemotePreferences(client);
                  pushNotificationsService.updateSubscription(client);

                });

              });

            }, 300);

          }
          else {
            console.log('We already have a cashshuffle wallet!', cashShuffleWallet);
          }

        };

        if (this.preferences.shufflingEnabled) {
          createCashShuffleWallet();
        }

        this
        .fetchPreferences()
        .then(() => {
          _.extend(this.preferences, { preferencesLoading: false });
          $rootScope.$emit('cashshuffle-update-ui');
        })
        .catch((someError) => {
          return $log.debug(someError)
        });

        return this.preferences;
      };

      CashShuffleService.prototype.changeCashShuffleSettings = function(newSettings) {

        return new Promise((resolve, reject) => {

          configService.set( { cashshuffle: newSettings }, (err) => {
            if (err) {
              reject(err);
            }

            _.extend(this.preferences, newSettings);

            resolve(newSettings);
          })
        });
      };


      const service = new CashShuffleService({});

      window.cashshuffleService = service;
      return service;
    }
]);

// )();