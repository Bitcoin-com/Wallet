angular
.module('bitcoincom.services')
.factory('cashshuffleCoinFactory', [
    '$rootScope',
    '$q',
    'profileService',
    'configService',
    'walletService',
    'walletHistoryService',
    'lodash',
    function cashshuffleCoinFactory($rootScope, $q, profileService, configService, walletService, walletHistoryService, _) {

        function CashShuffleCoin(coinProperties) {
            _.extend(this, coinProperties);

            this.shuffleThisCoin = this.shuffleThisCoin || false;
            this.inShufflePool = false;
            this.shufflePhase = 'queued';
            this.service = this.service;

            const registerEventHandlers = () => {
                // Put stuff in here that relies on the CashShuffleCoin
                // instances having access to the `ShuffleClient`
            };

            // Once this resolves we know our ShuffleClient
            // has been instantiated on the cashShuffleService.
            this
                .service
                .serviceReady
                .then(() => {
                    registerEventHandlers();
                })
                .catch((serviceError) => {});

            return this;
        };

        CashShuffleCoin.prototype.update = function(someProperties) {

            _.extend(this, someProperties);

            if (!this.service.client) {
                return this;
            }

            if (this.shuffleThisCoin) {
                if (this.service && this.service.client) {

                    // Start the ShuffleClient if it's not already running.
                    if (!this.service.client.isShuffling) {
                        this.service.client.start();
                    }

                    let checkAgainst = _.compact([].concat(_.map(this.service.client.rounds, 'coin'), this.service.client.coins));
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
                let grabRound = _.find(this.service.client.rounds, (oneRound) => {
                    return oneRound.coin && oneRound.coin.id === this.id;
                });

                if (grabRound) {
                    grabRound.abortRound();
                }
            }

            return this;
        };

        const uiPropertiesToKeep = ['inShufflePool', 'shufflePhase', 'id', 'service', 'playersInRound'];

        function CoinFactory(cashShuffleServiceInstance) {

            const i = $q.defer();

            this.cashshuffleService = cashShuffleServiceInstance;

            this.serviceReady = i.promise;

            this.coins = [];

            profileService
            .whenAvailable(() => {

                configService.whenAvailable((config) => {
                    this
                        .update()
                        .catch((someError) => {
                            console.log('An error has occured in cashShuffleFactory:', someError);
                            i.reject(someError);
                        })
                        .then(() => {
                            i.resolve(this);
                        });

                })
            });

            return this;
        }

        CoinFactory.prototype.update = async function(updateOnlyThisWallet) {

            const cashshuffleService = this.cashshuffleService;

            let walletConfig = {};

            /*

            METHOD ONE

            This is the current best method for obtaining the required utxo data.
            No single endpoint (correctly) gives all the details required so we 
            need to piece together all the information from many API calls. See
            Method two below for a much cleaner way.

            */
            const getUtxosFromWallet = async function(someWallet) {

                let txDataByAddress = {};

                // Get our CashShuffle preferences so we can
                // set the appropriate flags on our coins.
                const getUpdatedWalletConfig = function( ) {
                    return new Promise(function(resolve, reject) {
                        configService.whenAvailable(function(config) {
                            return resolve(config);
                        });
                    });
                };

                let updatedWalletConfig;
                try {
                    updatedWalletConfig = await getUpdatedWalletConfig();
                }
                catch(nope) {
                    console.log('Error getting wallet config during CashShuffle update:', nope);
                    throw nope;
                }

                if (!updatedWalletConfig.cashshuffle) {
                    return [];
                }

                // Update our service-level copy
                _.extend(walletConfig, updatedWalletConfig);

                // Fetch all transactions we have received into this wallet
                const getUpdatedTxHistory = function() {
                    return new Promise(function(resolve, reject) {
                        walletHistoryService.updateLocalTxHistoryByPage(someWallet, true, true, function(nope, historicalTransactions) {
                            if (nope) {
                                return reject(nope);
                            }
                            historicalTransactions = _.compact(historicalTransactions || []);
                            return resolve(_.filter(historicalTransactions, { action: 'received' }));
                        });
                    });
                };

                let updatedTxHistory;
                try {
                    updatedTxHistory = await getUpdatedTxHistory();
                }
                catch(nope) {
                    console.log('Error getting update transaction history during CashShuffle update:', nope);
                    throw nope;
                }

                // Create an entry for each address we've received funds into
                // in our `txDataByAddress` object above.
                for (let oneHistoricalTx of updatedTxHistory) {

                    // This attribute is different depending on the wallet backend.
                    oneHistoricalTx.toAddress = oneHistoricalTx.toAddress || oneHistoricalTx.addressTo;

                    let extendWithDetails = {};
                    extendWithDetails[oneHistoricalTx.toAddress] = {
                        legacyAddress: oneHistoricalTx.toAddress,
                        path: undefined,
                        confirmations: oneHistoricalTx.confirmations || 0
                    };
                    _.extend(txDataByAddress, extendWithDetails);
                }

                // Fetch address details for all addresses in this wallet
                const getWalletAddresses = function() {
                    return new Promise(function(resolve, reject) {
                        walletService.getMainAddresses(someWallet, {}, function(nope, walletAddresses) {
                            if (nope) {
                                return reject(nope);
                            }
                            return resolve( _.compact(walletAddresses || []) );
                        });
                    });
                };

                let walletAddresses;
                try {
                    walletAddresses = await getWalletAddresses();
                }
                catch(nope) {
                    console.log('Error getting wallet addresses during CashShuffle update:', nope);
                    throw nope;
                }

                // Add any addition address entries to `txDataByAddress` and
                // update existing entries with previously missing information.
                for (let oneWalletAddress of walletAddresses) {

                    // Set a value even if the field isn't present so we avoid deref's
                    oneWalletAddress.confirmations = oneWalletAddress.confirmations || 0;

                    if (typeof txDataByAddress[oneWalletAddress.address] === 'undefined') {
                        let extendWithDetails = {};
                        extendWithDetails[oneWalletAddress.address] = {
                            legacyAddress: oneWalletAddress.address,
                            path: undefined,
                            confirmations: oneWalletAddress.confirmations || 0
                        };
                        _.extend(txDataByAddress, extendWithDetails);
                    }

                    let updateWithDetails = {};

                    if (oneWalletAddress.confirmations > txDataByAddress[oneWalletAddress.address].confirmations) {
                        updateWithDetails.confirmations = oneWalletAddress.confirmations;
                    }

                    updateWithDetails.path = txDataByAddress[oneWalletAddress.address]['path'] || updateWithDetails.path;

                    // Update `txDataByAddress` with new information for each address
                    _.extend(txDataByAddress[oneWalletAddress.address], updateWithDetails);

                }

                // Add any additional address information to `txDataByAddress` from the wallet
                // status fields.  These will be present on wallets using the old backend.
                let cachedBalancesByAddress = _.get( (someWallet.status || someWallet.cachedStatus) , 'balanceByAddress') || [];

                for (let oneCachedAddress of cachedBalancesByAddress) {

                    if (typeof txDataByAddress[oneCachedAddress.address] === 'undefined') {
                        let extendWithDetails = {};
                        extendWithDetails[oneCachedAddress.address] = {
                            legacyAddress: oneCachedAddress.address,
                            path: undefined,
                            confirmations: oneCachedAddress.confirmations || 0
                        };
                        _.extend(txDataByAddress, extendWithDetails);
                    }

                    let updateWithDetails = {};

                    if (oneCachedAddress.confirmations > txDataByAddress[oneCachedAddress.address].confirmations) {
                        updateWithDetails.confirmations = oneCachedAddress.confirmations;
                    }

                    updateWithDetails.path = txDataByAddress[oneCachedAddress.address]['path'] || oneCachedAddress.path;

                    _.extend(txDataByAddress[oneCachedAddress.address], updateWithDetails);

                }

                let addressesToCheck = _.keys(txDataByAddress) || [];

                const getAddressUtxos = function() {
                    return new Promise(function(resolve, reject) {
                        someWallet.getUtxos(addressesToCheck.length ? { addresses: addressesToCheck } : {}, function(nope, utxos) {
                            if (nope) {
                                return reject(nope);
                            }
                            utxos = _.compact(utxos || []);
                            return resolve(utxos);
                        });
                    });
                };

                let addressUtxos;
                try {
                    addressUtxos = await getAddressUtxos();
                }
                catch(nope) {
                    console.log('Error getting update transaction history during CashShuffle update:', nope);
                    throw nope;
                }

                let coinsToReturn = [];

                let shuffleFeeAmount = 270;

                let walletHdMaster = someWallet.credentials.getDerivedXPrivKey();

                for (let oneCoin of addressUtxos) {

                    // Add a reference to the CashShuffle Service
                    // so the instance methods can locate the
                    // ShuffleClient instance.
                    oneCoin.service = cashshuffleService;

                    // These are the fields expected by `cashshufflejs-web`
                    // {
                    //   txid: '',
                    //   vout: '',
                    //   amountSatoshis: '',
                    //   legacyAddress: '',
                    //   privateKeyWif: ''
                    // }

                    oneCoin.path = oneCoin.path || txDataByAddress[oneCoin.address]['path'];
                    if (!oneCoin.path) {
                        console.log('No address path for utxo!', oneCoin);
                        continue;
                    }

                    let coinPrivateKey = walletHdMaster.derive(oneCoin.path).privateKey;

                    oneCoin.amountSatoshis = Number(oneCoin.satoshis);
                    oneCoin.amountBch = (oneCoin.amountSatoshis * (1 / 1e8));
                    oneCoin.publicKey = coinPrivateKey.toPublicKey();
                    oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
                    oneCoin.privateKeyWif = coinPrivateKey.toWIF();

                    oneCoin.id = oneCoin.txid + ':' + oneCoin.vout;
                    oneCoin.walletId = someWallet.id;
                    oneCoin.walletName = someWallet.name;
                    oneCoin.wallet = someWallet;

                    // Is this coin in our CashShuffle "spend-only" wallet?
                    // Is it in a change address?  If so, we cannot consider it shuffled.
                    if (someWallet.isCashShuffleWallet && (/m\/0/i).test(oneCoin.path)) {
                        oneCoin.shuffled = true;
                        oneCoin.isChange = false;
                    }
                    else {
                        oneCoin.shuffled = false;
                        oneCoin.isChange = true;
                    }

                    oneCoin.isDust = oneCoin.amountSatoshis <= 10000 ? true : false;

                    oneCoin.shuffleThisCoin = false;

                    // This will only stick for new coins or old coins being
                    // instantiated for the first time (opening the wallet)
                    if (!oneCoin.shuffled && oneCoin.confirmations) {
                        oneCoin.shuffleThisCoin = true;
                    }

                    if (updatedWalletConfig.cashshuffle.shufflingEnabled && updatedWalletConfig.cashshuffle.statusByWalletId[someWallet.id]) {
                        oneCoin.shuffleThisWallet = true;
                    }
                    else {
                        oneCoin.shuffleThisWallet = false;
                    }

                    coinsToReturn.push(oneCoin);

                }

                return coinsToReturn;

            };


            /*

            METHOD TWO

            This method of fetching UTXOs only requires 2 API calls.
            We could use this instead if the transaction `inputs`
            returned by `wallet.fetchCoinsBySpendMax()` contained
            the correct `confirmations` value.  Fixing this would greatly
            reduce the load CashShuffle puts on the server.

            */
            /*
            const getUtxosFromWallet = async function(someWallet) {

                // Get our CashShuffle preferences so we can
                // set the appropriate flags on our coins.
                const getUpdatedWalletConfig = function( ) {
                    return new Promise(function(resolve, reject) {
                        configService.whenAvailable(function(config) {
                            return resolve(config);
                        });
                    });
                };

                let updatedWalletConfig;
                try {
                    updatedWalletConfig = await getUpdatedWalletConfig();
                }
                catch(nope) {
                    console.log('Error getting wallet config during CashShuffle update:', nope);
                    throw nope;
                }

                if (!updatedWalletConfig.cashshuffle) {
                    return [];
                }

                // Update our service-level copy
                _.extend(walletConfig, updatedWalletConfig);

                const fetchCoinsBySpendMax = function() {
                    return new Promise(function(resolve, reject) {
                        walletService.getSendMaxInfo(someWallet,{
                            feePerKb:9400,
                            excludeUnconfirmedUtxos: false,
                            returnInputs: true
                        }, function(nope, sendMaxTx) {
                            if (nope) {
                                return reject(nope);
                            }
                            return resolve(sendMaxTx.inputs);
                        });
                    });
                };

                let addressUtxos;
                try {
                    addressUtxos = await fetchCoinsBySpendMax();
                }
                catch(nope) {
                    console.log('Error getting utxo data during CashShuffle update:', nope);
                    throw nope;
                }

                let coinsToReturn = [];

                let shuffleFeeAmount = 270;

                let walletHdMaster = someWallet.credentials.getDerivedXPrivKey();

                for (let oneCoin of addressUtxos) {

                    // Add a reference to the CashShuffle Service
                    // so the instance methods can locate the
                    // ShuffleClient instance.
                    oneCoin.service = cashshuffleService;

                    // These are the fields expected by `cashshufflejs-web`
                    // {
                    //   txid: '',
                    //   vout: '',
                    //   amountSatoshis: '',
                    //   legacyAddress: '',
                    //   privateKeyWif: ''
                    // }

                    oneCoin.path = oneCoin.path;
                    if (!oneCoin.path) {
                        console.log('No address path for utxo!', oneCoin);
                        continue;
                    }

                    let coinPrivateKey = walletHdMaster.derive(oneCoin.path).privateKey;

                    oneCoin.amountSatoshis = Number(oneCoin.satoshis);
                    oneCoin.amountBch = (oneCoin.amountSatoshis * (1 / 1e8));
                    oneCoin.publicKey = coinPrivateKey.toPublicKey();
                    oneCoin.legacyAddress = oneCoin.publicKey.toAddress().toString();
                    oneCoin.privateKeyWif = coinPrivateKey.toWIF();

                    oneCoin.id = oneCoin.txid + ':' + oneCoin.vout;
                    oneCoin.walletId = someWallet.id;
                    oneCoin.walletName = someWallet.name;
                    oneCoin.wallet = someWallet;

                    oneCoin.shuffled = false;

                    // Is this coin in our CashShuffle "spend-only" wallet and also
                    // a change address?  If so, we consider it unshuffled.  It is probably
                    // change from a transaction spending shuffled coins.
                    if (someWallet.isCashShuffleWallet && (/m\/0/i).test(oneCoin.path)) {
                        oneCoin.shuffled = true;
                    }

                    oneCoin.isDust = oneCoin.amountSatoshis <= 10000 ? true : false;

                    oneCoin.shuffleThisCoin = false;

                    // This will only stick for new coins or old coins being
                    // instantiated for the first time (opening the wallet)
                    if (!oneCoin.shuffled && oneCoin.confirmations && updatedWalletConfig.cashshuffle.shufflingEnabled && someWallet.shuffleThisWallet) {
                        oneCoin.shuffleThisCoin = true;
                    }

                    coinsToReturn.push(oneCoin);

                }

                return coinsToReturn;

            };
            */

            let updateTheseWallets = updateOnlyThisWallet ? [updateOnlyThisWallet] : profileService.getWallets({ coin: 'bch' });

            let currentCoins = [];

            // Fetch all the coins currently in user's wallets
            for (let oneWallet of updateTheseWallets) {

                let coins;
                try {
                    coins = await getUtxosFromWallet(oneWallet);
                } catch (nope) {
                    console.log('Cannot fetch coins:', nope);
                    continue;
                }

                for (let oneCoin of coins) {
                    currentCoins.push(oneCoin);
                }

            }

            let oldCoins = [];

            while (this.coins.length) {
                oldCoins.push(this.coins.pop());
            }

            for (let newCoin of currentCoins) {
                let oldCopy = _.find(oldCoins, {
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

            // This must be a freshly migrated wallet
            if (!(walletConfig && walletConfig.cashshuffle) || !(this.cashshuffleService && this.cashshuffleService.client)) {
                return [];
            };

            // If the client hasnt been started, do so now.
            if (walletConfig.cashshuffle.shufflingEnabled && !this.cashshuffleService.client.isShuffling) {
                this.cashshuffleService.client.start();
            }


            if (walletConfig.cashshuffle.shufflingEnabled) {

                for (let oneCoin of this.coins) {

                    // Set the flag that tells the UI what's going on.
                    if (!oneCoin.shuffled && oneCoin.confirmations) {
                        oneCoin.update({
                            shuffleThisCoin: true
                        });
                    }

                    // If it's not already in a round or waiting inside the client to be added to a
                    // round, add it to the client so it can be shuffled when a pool opens up.
                    let checkAgainst = _.compact([].concat(_.map(this.cashshuffleService.client.rounds, 'coin'), this.cashshuffleService.client.coins));
                    if (!_.find(checkAgainst, {
                            txid: oneCoin.txid,
                            vout: oneCoin.vout
                        }) && oneCoin.shuffleThisCoin && oneCoin.confirmations) {
                        this.cashshuffleService.client.addUnshuffledCoins(oneCoin);
                    }

                }

            }

            // If we have coins in active rounds but they are no longer in
            // this factory, they must have been spent before the round
            // could complete.  In this case, abort the CashShuffle round.
            for (let oneActiveRound of this.cashshuffleService.client.rounds) {
                let coinInFactory = _.find(this.coins, {
                    txid: oneActiveRound.coin.txid,
                    vout: oneActiveRound.coin.vout
                });
                if (!coinInFactory) {
                    console.log('A coin from an active round has gone missing.  Aborting round.', oneActiveRound.coin);
                    oneActiveRound.abortRound();
                }
            }

            return this.coins;

        };

        return CoinFactory;

    }
]);
