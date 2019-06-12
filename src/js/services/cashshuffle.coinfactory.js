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
      $rootScope.$emit('cashshuffle-update');
      return _.extend(this, someProperties);
    };

    CashShuffleCoin.prototype.toggleShuffle = function() {
      if (this.shuffleThisCoin) {
        this.shuffleThisCoin = false;

        // Check and see if this coin is currently being
        // shuffled. If so, we must abort the round.
        let grabRound = _.find(this.service.client.rounds, (oneRound) => {
          return oneRound.coin && oneRound.coin.id === this.id;
        });

        if (grabRound) {
          console.log('Aborting shuffle round!');
          grabRound.abortRound();
        }

      }
      else {
        if (this.service && this.service.client) {

          // Start the ShuffleClient if it's not already running.
          if (!this.service.client.isShuffling) {
            this.service.client.start();
          }

          let checkAgainst = _.compact([].concat(_.map(this.service.client.rounds, 'coin'), this.service.client.coins));
          if (!_.find(checkAgainst, { txid: this.txid, vout: this.vout })) {
            this.service.client.addUnshuffledCoins(this);
          }

        }
        this.shuffleThisCoin = true;
      }

      $rootScope.$emit('cashshuffle-update');
      return this.shuffleThisCoin;
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

      console.log('Now updating cashshuffle service!');

      const cashshuffleService = this.cashshuffleService;

      const getUtxosFromWallet = async function(someWallet) {
        return new Promise( (resolve, reject) => {

          // Get our CashShuffle preferences so we can
          // set the appropriate flags on our coins.
          configService.whenAvailable((config) => {

            if (!config.cashshuffle) {
              console.log('Cashshuffle not yet enabled');
              return resolve([]);
            }

            walletHistoryService.getCachedTxHistory(someWallet.id, (err, historicalTransactions) => {

              someWallet.getUtxos({}, (error, utxos) => {
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

                    if (!oneCoin.shuffled && config.cashshuffle.shufflingEnabled && config.cashshuffle.autoShuffle) {
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

      $rootScope.$emit('cashshuffle-update');

      return this.coins;

    };

    return CoinFactory;

  }
]);

// )();