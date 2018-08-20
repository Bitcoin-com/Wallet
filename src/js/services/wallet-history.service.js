'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('walletHistoryService', walletHistoryService);
    
    function walletHistoryService(configService, storageService, lodash, $log, txFormatService) {
      // 8 Transactions fit on an iPhone Plus screen when in Wallet Details.
      // Make it a little bit bigger so it doesn't have to load more immediately
      var PAGE_SIZE = 50 / 1.5;
      // How much to overlap on each end of the page, for mitigating inconsistent sort order.
      var PAGE_OVERLAP_FRACTION = 0.5;

      var SAFE_CONFIRMATIONS = 6;

      var service = {
        getCachedTxHistory: getCachedTxHistory,
        updateTxHistoryByPage: updateTxHistoryByPage
      };
      return service;

      /**
       * @param {string} walletId
       * @param {function(error, txs)} cb
       */
      function getCachedTxHistory(walletId, cb) {
        storageService.getTxHistory(walletId, function onGetTxHistory(err, txHistoryString){
          if (err) {
            return cb(err);
          }

          if (!txHistoryString) {
            return cb(null, txHistoryString);
          }

          try {
            var txHistory = JSON.parse(txHistoryString);
            return cb(null, txHistory);
          } catch (e) {
            $log.error('Failed to parse tx history.', e);
            return cb(e);
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

        // Update notes?
    
        return processedTxs;
      };

      /**
       * A small cache of up to the 50 most recent transactions
       */
      function saveTxHistory(processedTxs, walletId) {
        storageService.setTxHistory(processedTxs, walletId, function onSetTxHistory(error){
          // Looks like callback only gets called on error
          $log.error('pagination Failed to save tx history.', error);
        });
        
      }

      // Only clear the cache once we have received new transactions from the server.
      function updateTxHistoryByPage(wallet, getLatest, flushCacheOnNew, cb) {
        var skip = 0;
        var limit = Math.floor(PAGE_SIZE * (1 + PAGE_OVERLAP_FRACTION));

        var opts = {
          skip: skip,
          limit: limit
        };
        wallet.getTxHistory(opts, function onTxHistory(err, txsFromServer) {
          if (err) {
            return cb(err);
          }
    
          if (!txsFromServer.length) {
            return cb(null, []);
          }
          
          var processedTxs = processNewTxs(wallet, txsFromServer);

          if (getLatest) {
            console.log('pagination Saving retrieved txs.');
            saveTxHistory(wallet, processedTxs);
          }

          return cb(null, processedTxs);
        });
      }

    }


})();