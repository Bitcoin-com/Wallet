// 'use strict';

// (function(){

angular
.module('bitcoincom.services')
.factory('cashshuffleCoinFactory', [
  '$rootScope',
  '$q',
  'profileService',
  'configService',
  'walletHistoryService',
  'lodash',
  function cashshuffleCoinFactory( $rootScope, $q, profileService, configService, walletHistoryService, _ ) {

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
      .catch((someError) => {
        console.log('An error has occured', someError);
        i.reject(someError);
      });

      return this;
    };

    CashShuffleCoin.prototype.update = function(someProperties) {

      _.extend(this, someProperties);

      if (this.shuffleThisCoin) {
        if (this.service && this.service.client) {

          // Start the ShuffleClient if it's not already running.
          if (!this.service.client.isShuffling) {
            this.service.client.start();
          }

          let checkAgainst = _.compact([].concat(_.map(this.service.client.rounds, 'coin'), this.service.client.coins));
          if (!_.find(checkAgainst, { txid: this.txid, vout: this.vout }) && this.confirmations) {
            this.service.client.addUnshuffledCoins(this);
          }

        }
      }
      else {
        // Check and see if this coin is currently being
        // shuffled. If so, we must abort the round.
        let grabRound = _.find(this.service.client.rounds, (oneRound) => {
          return oneRound.coin && oneRound.coin.id === this.id;
        });

        if (grabRound) {
          grabRound.abortRound();
        }
      }

      $rootScope.$emit('cashshuffle-update');
      return this;
    };

    const uiPropertiesToKeep = ['shuffleThisCoin', 'inShufflePool', 'shufflePhase', 'id', 'service', 'playersInRound'];

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
      })

      return this;
    }

    CoinFactory.prototype.update = async function() {

      const cashshuffleService = this.cashshuffleService;

      let walletConfig = {};
      const getUtxosFromWallet = async function(someWallet) {
        return new Promise( (resolve, reject) => {

          // Get our CashShuffle preferences so we can
          // set the appropriate flags on our coins.
          configService.whenAvailable((config) => {

            if (!config.cashshuffle) {
              return resolve([]);
            }
            _.extend(walletConfig, config);
            walletHistoryService.updateLocalTxHistoryByPage(someWallet, true, false, (err, historicalTransactions) => {
              let addresses = null;
              if (someWallet.baseUrl === 'https://bch.api.wallet.bitcoin.com/bws/api') {
                addresses = someWallet.cachedStatus.balanceByAddress.map(s => s.address);
                addresses = addresses.length === 0 ? null: addresses;
              }
              someWallet.getUtxos(addresses !== null ? {addresses} : {} , (error, utxos) => {
                if (error) {
                 return reject(error);
                }
                else {

                  let coinsToReturn = [];

                  let shuffleFeeAmount = 270;

                  let walletHdMaster = someWallet.credentials.getDerivedXPrivKey();

                  for (let oneCoin of utxos) {

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
                    if (someWallet.name === 'CashShuffle Spending Wallet' && (/m\/0/i).test(oneCoin.path)) {
                      oneCoin.shuffled = true;
                    }

                    oneCoin.isDust = oneCoin.amountSatoshis <= 10000 ? true : false;

                    // If we need to deduce whether a coin is shuffled based on
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

                    oneCoin.shuffleThisCoin = false;

                    // This will only stick for new coins or old coins being
                    // instantiated for the first time (opening the wallet)
                    if (!oneCoin.shuffled && oneCoin.confirmations && config.cashshuffle.shufflingEnabled && config.cashshuffle.autoShuffle) {
                      oneCoin.shuffleThisCoin = true;
                    }

                    coinsToReturn.push(oneCoin);

                  }
                  return resolve(coinsToReturn);
                }
              });

            });

          });

        });
      };

      let allBchWallets = profileService.getWallets({ coin: 'bch' });

      let currentCoins = [];

      // Fetch all the coins currently in user's wallets
      for (let oneWallet of allBchWallets) {

        let coins;
        try {
          coins = await getUtxosFromWallet(oneWallet);
        }
        catch(nope) {
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
        let oldCopy = _.find(oldCoins, { id: newCoin.id });

        if (!oldCopy) {
          this.coins.push(new CashShuffleCoin(newCoin));
        }
        else {
          // Update the old coin with everything except what
          // is listed in the uiPropertiesToKeep array. This
          // stays an instance of CashShuffleCoin.
          this.coins.push(_.extend(oldCopy, _.pick(newCoin, _.difference(_.keys(newCoin), uiPropertiesToKeep))));
        }

      }

      console.log('Coins in all wallets:', this.coins);

      // This must be a freshly migrated wallet
      if (!(walletConfig && walletConfig.cashshuffle) || !(this.cashshuffleService && this.cashshuffleService.client)) {
        return [];
      };

      // If the client hasnt been started, do so now.
      if (walletConfig.cashshuffle.shufflingEnabled && !this.cashshuffleService.client.isShuffling) {
        this.cashshuffleService.client.start();
      }


      if (walletConfig.cashshuffle.shufflingEnabled && walletConfig.cashshuffle.autoShuffle) {

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
          if (!_.find(checkAgainst, { txid: oneCoin.txid, vout: oneCoin.vout }) && oneCoin.shuffleThisCoin && oneCoin.confirmations) {
            this.cashshuffleService.client.addUnshuffledCoins(oneCoin);
          }

        }

      }

      // If we have coins in active rounds but they are no longer in
      // this factory, they must have been spent before the round
      // could complete.  In this case, abort the CashShuffle round.
      for (let oneActiveRound of this.cashshuffleService.client.rounds) {
        let coinInFactory = _.find(this.coins, { txid: oneActiveRound.coin.txid, vout: oneActiveRound.coin.vout });
        if (!coinInFactory) {
          console.log('A coin from an active round has gone missing.  Aborting round.', oneActiveRound.coin);
          oneActiveRound.abortRound();
        }
      }

      $rootScope.$emit('cashshuffle-update');

      return this.coins;

    };

    return CoinFactory;

  }
]);

// )();
