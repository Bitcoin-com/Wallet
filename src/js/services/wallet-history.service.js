'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('walletHistoryService', walletHistoryService);
    
    function walletHistoryService(
      satoshiDiceService
      , storageService
      , lodash
      , $log
      , txFormatService
      ) {
      var PAGE_SIZE = 50;
      //var PAGE_SIZE = 20; // For dev only
      // How much to overlap on each end of the page, for mitigating inconsistent sort order.
      var PAGE_OVERLAP_FRACTION = 0.2;
      var PAGE_OVERLAP = Math.floor(PAGE_SIZE * PAGE_OVERLAP_FRACTION);
      // The fraction of transactions in the new overlapping resultset that we already know about.
      // If we know about at least this many, then there are probably no gaps.
      var MIN_KNOWN_TX_OVERLAP_FRACTION = 0.5;

      var SAFE_CONFIRMATIONS = 6;

      var allTransactionsFetched = false;
      var service = {
        getCachedTxHistory: getCachedTxHistory,
        updateLocalTxHistoryByPage: updateLocalTxHistoryByPage,
      };
      return service;

      function addEarlyTransactions(walletId, cachedTxs, newTxs) {
        var cachedTxCountBeforeMerging = cachedTxs.length;
        var cachedTxIndexFromId = {};
        cachedTxs.forEach(function forCachedTx(tx, txIndex){
          cachedTxIndexFromId[tx.txid] = txIndex;
        });

        var confirmationsUpdated = false;
        var someTransactionsWereNew = false;
        var overlappingTxsCount = 0;

        newTxs.forEach(function forNewTx(tx){
          if (typeof cachedTxIndexFromId[tx.txid] === "undefined") {
            someTransactionsWereNew = true;
            cachedTxs.push(tx);
          } else {
            var txUpdated = updateCachedTx(cachedTxs, cachedTxIndexFromId, tx);
            confirmationsUpdated = confirmationsUpdated || txUpdated;
            overlappingTxsCount++;
          }
        });

        var txsAreContinuous = false;
        if (cachedTxCountBeforeMerging.length > 0) {
          var overlappingTxFraction = overlappingTxsCount / Math.min(cachedTxCountBeforeMerging, PAGE_OVERLAP);
          txsAreContinuous = overlappingTxFraction >= MIN_KNOWN_TX_OVERLAP_FRACTION;
        } else {
          txsAreContinuous = true;
        }        
        
        if (txsAreContinuous) {
          if (someTransactionsWereNew) {
            saveTxHistory(walletId, cachedTxs);
          } else if (confirmationsUpdated) {
            saveTxHistory(walletId, cachedTxs);
          } else if (overlappingTxsCount === newTxs.length) {
            allTransactionsFetched = true;
          }
          return cachedTxs;
        } else {
          // We might be missing some txs.
          $log.error('We might be missing some txs in the history. Overlapping txs count: ' + overlappingTxsCount + ', txs in cache before merging: ' + cachedTxCountBeforeMerging);
          // Our history is wrong, so remove it - we could instead, try to fetch data that was not so early.
          storageService.removeTxHistory(walletId, function onRemoveTxHistory(){});
          return [];
        }

      }

      function addLatestTransactions(walletId, cachedTxs, newTxs) {
        var cachedTxIndexFromId = {};
        cachedTxs.forEach(function forCachedTx(tx, txIndex){
          cachedTxIndexFromId[tx.txid] = txIndex;
        });

        var someTransactionsWereNew = false;
        var confirmationsUpdated = false;
        var overlappingTxsCount = 0;
        var uniqueNewTxs = [];

        newTxs.forEach(function forNewTx(tx){
          if (typeof cachedTxIndexFromId[tx.txid] === "undefined") {
            someTransactionsWereNew = true;
            uniqueNewTxs.push(tx);
          } else {
            var txUpdated = updateCachedTx(cachedTxs, cachedTxIndexFromId, tx);
            confirmationsUpdated = confirmationsUpdated || txUpdated;
            overlappingTxsCount++;
          }
        });

        var txsAreContinuous = false;
        if (cachedTxs.length > 0) {
          var overlappingTxFraction = overlappingTxsCount / Math.min(cachedTxs.length, PAGE_OVERLAP);
          txsAreContinuous = overlappingTxFraction >= MIN_KNOWN_TX_OVERLAP_FRACTION;
        } else {
          txsAreContinuous = true;
        } 

        if (txsAreContinuous) {
          if (someTransactionsWereNew) {
            var allTxs = uniqueNewTxs.concat(cachedTxs);
            saveTxHistory(walletId, allTxs);
            return allTxs;
          } else {
            if (confirmationsUpdated) {
              saveTxHistory(walletId, cachedTxs);
            }
            return cachedTxs;
          }
        } else {
          // We might be missing some txs.
          $log.error('We might be missing some txs in the history. OverlappingTxsCount: ' + overlappingTxsCount + ', txs in cache: ' + cachedTxs.length);
          // Our history is wrong, so just include the latest ones
          saveTxHistory(walletId, newTxs);
          return newTxs;
        }
        
      }

      // Only clear the cache once we have received new transactions from the server.
      /**
       * @param wallet
       * @param start
       * @param {function(err, txs)} cb - transactions is always an array, may be empty
       */
      function fetchTxHistoryByPage(wallet, start, cb) {
        var skip = Math.max(0, start - PAGE_OVERLAP);
        var limit = PAGE_SIZE;

        var opts = {
          skip: skip,
          limit: limit,
          includeExtendedInfo: true
        };
        wallet.getTxHistory(opts, function onTxHistory(err, txsFromServer) {
          if (err) {
            return cb(err, []);
          }
    
          if (txsFromServer.length === 0) {
            return cb(null, []);
          }

          var processedTxs = processNewTxs(wallet, txsFromServer);

          return cb(null, processedTxs);
        });
      }

      /**
       * @param {string} walletId
       * @param {function(error, txs)} cb - txs is always an array, may be empty
       */
      function getCachedTxHistory(walletId, cb) {
        storageService.getTxHistory(walletId, function onGetTxHistory(err, txHistoryString){
          if (err) {
            return cb(err, []);
          }

          if (!txHistoryString) {
            return cb(null, []);
          }

          try {
            var txHistory = JSON.parse(txHistoryString);
            return cb(null, txHistory);
          } catch (e) {
            $log.error('Failed to parse tx history.', e);
            return cb(e, []);
          }
        });
      }

      function processNewTxs(wallet, txs) {
        var now = Math.floor(Date.now() / 1000);
        var txHistoryUnique = {};
        var processedTxs = [];
        wallet.hasUnsafeConfirmed = false;
    
        lodash.each(txs, function(tx) {
          tx = txFormatService.processTx(wallet.coin, tx);
    
          // no future transactions...
          if (tx.time > now)
            tx.time = now;
    
          if (tx.confirmations >= SAFE_CONFIRMATIONS) {
            tx.safeConfirmed = SAFE_CONFIRMATIONS + '+';
          } else {
            tx.safeConfirmed = false;
            wallet.hasUnsafeConfirmed = true;
          }
    
          if (tx.note) {
            delete tx.note.encryptedEditedByName;
            delete tx.note.encryptedBody;
          }
    
          if (!txHistoryUnique[tx.txid]) {
            processedTxs.push(tx);
            txHistoryUnique[tx.txid] = true;
          } else {
            $log.debug('Ignoring duplicate TX in history: ' + tx.txid)
          }
        });
    
        return processedTxs;
      }

      function saveTxHistory(walletId, processedTxs) {
        storageService.setTxHistory(processedTxs, walletId, function onSetTxHistory(error){
          if (error) {
            $log.error('pagination Failed to save tx history.', error);
          }
        });
      }

      /**
       * Returns true if the cached tx was updated
       * @param {*} cachedTxs 
       * @param {*} cachedTxIndexFromId - Indices for cachedTxs, based on txid
       * @param {*} tx - The most recent tx info
       */
      function updateCachedTx(cachedTxs, cachedTxIndexFromId, tx) {
        var updated = false;
        var txIndex = cachedTxIndexFromId[tx.txid];
        var cachedTx = cachedTxs[txIndex];

        if (cachedTx.confirmations < SAFE_CONFIRMATIONS && tx.confirmations > cachedTx.confirmations) {
          cachedTxs[txIndex].confirmations = tx.confirmations;
          updated = true;
        }
        return updated;
      }

      function updateLocalTxHistoryByPage(wallet, getLatest, flushCacheOnNew, cb) {
        if (flushCacheOnNew) {
          fetchTxHistoryByPage(wallet, 0, function onFetchTxHistory(err, txs){
            if (err) {
              return cb(err, txs);
            }
            saveTxHistory(wallet.id, txs);
            return cb(null, txs);
          });
        } else {
          getCachedTxHistory(wallet.id, function onCachedHistory(err, cachedTxs){
            if (err) {
              $log.error('Failed to get cached tx history.', err);
              return cb(err, []);
            }

            var start = getLatest ? 0 : cachedTxs.length;
            fetchTxHistoryByPage(wallet, start, function onFetchHistory(err, fetchedTxs){
                if (err) {
                  return cb(err);
                }

                if (fetchedTxs.length === 0) {
                  return cb(null, cachedTxs, true /*fetchedAllTransactions*/);
                }

                var txs = [];
                if (getLatest) {
                  txs = addLatestTransactions(wallet.id, cachedTxs, fetchedTxs);
                } else {
                  allTransactionsFetched = false;
                  txs = addEarlyTransactions(wallet.id, cachedTxs, fetchedTxs);
                  return cb(null, txs, allTransactionsFetched);
                }
                return cb(null, txs);
            });


          });
        }
      }
    }
})();
