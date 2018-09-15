'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('walletHistoryService', walletHistoryService);
    
    function walletHistoryService(configService, storageService, lodash, $log, txFormatService) {
      //var PAGE_SIZE = 50;
      var PAGE_SIZE = 20; // For dev only
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

        var cachedTxIds = {};
        cachedTxs.forEach(function forCachedTx(tx){
          cachedTxIds[tx.txid] = true;
        });

        var someTransactionsWereNew = false;
        var overlappingTxsCount = 0;

        newTxs.forEach(function forNewTx(tx){
          if (cachedTxIds[tx.txid]) {
            overlappingTxsCount++;
          } else {
            someTransactionsWereNew = true;
            cachedTxs.push(tx);
          }
        });

        var overlappingTxFraction = overlappingTxsCount / Math.min(cachedTxs.length, PAGE_OVERLAP);
        console.log('overlappingTxFraction:', overlappingTxFraction);

        if (overlappingTxFraction >= MIN_KNOWN_TX_OVERLAP_FRACTION) { // We are good
          if (someTransactionsWereNew) {
            saveTxHistory(walletId, cachedTxs);
          } else if (overlappingTxsCount === newTxs.length) {
            allTransactionsFetched = true;
          }
          return cachedTxs;
        } else {
          // We might be missing some txs.
          console.error('We might be missing some txs in the history.');
          // Our history is wrong, so remove it - we could instead, try to fetch data that was not so early.
          storageService.removeTxHistory(walletId, function onRemoveTxHistory(){});
          return [];
        }

      }

      function addLatestTransactions(walletId, cachedTxs, newTxs) {
        var cachedTxIds = {};
        cachedTxs.forEach(function forCachedTx(tx){
          cachedTxIds[tx.txid] = true;
        });

        var someTransactionsWereNew = false;
        var overlappingTxsCount = 0;
        var uniqueNewTxs = [];

        newTxs.forEach(function forNewTx(tx){
          if (cachedTxIds[tx.txid]) {
            overlappingTxsCount++;
          } else {
            someTransactionsWereNew = true;
            uniqueNewTxs.push(tx);
          }
        });

        var overlappingTxFraction = overlappingTxsCount / Math.min(cachedTxs.length, PAGE_OVERLAP);

        if (overlappingTxFraction >= MIN_KNOWN_TX_OVERLAP_FRACTION) { // We are good
          if (someTransactionsWereNew) {
            var allTxs = uniqueNewTxs.concat(cachedTxs);
            saveTxHistory(walletId, allTxs);
            return allTxs;
          } else {
            return cachedTxs;
          }
        } else {
          // We might be missing some txs.
          // Our history is wrong, so just include the latest ones
          saveTxHistory(walletId, newTxs);
          return newTxs;
        }
        
      }

      // Only clear the cache once we have received new transactions from the server.
      /**
       * @param {function(err, txs)} cb - transactions is always an array, may be empty
       */
      function fetchTxHistoryByPage(wallet, start, cb) {
        var skip = Math.max(0, start - PAGE_OVERLAP);
        var limit = PAGE_SIZE;

        var opts = {
          skip: skip,
          limit: limit
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
      };

      function saveTxHistory(walletId, processedTxs) {
        storageService.setTxHistory(processedTxs, walletId, function onSetTxHistory(error){
          if (error) {
            $log.error('pagination Failed to save tx history.', error);
          }
        });
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