'use strict';
 
(function(){
 
  angular
    .module('bitcoincom.services')
    .factory('satoshiDiceService', satoshiDiceService); 
     
    function satoshiDiceService(
      $http
      , $interval
      , $log
      , $q
    ) { 
      var service = {     
        // Public variables 
        iconUrl: 'img/third-party/satoshi_dice.png',    
 
        // Public functions
        addressIsKnown: addressIsKnown,
        getBetStatus: getBetStatus,
        processTx: processTx
      };

      var STATUS_CHECK_INTERVAL = 2000; // The request sometimes takes 1.15s
      var STATUS_CHECKS_MAX = 30;
      var addresses = [
        '1Dice9GgmweQWxqdiu683E7bHfpb7MUXGd', //    1.05x
        '1Dice81SKu2S1nAzRJUbvpr5LiNTzn7MDV', //    1.12x
        '1Dice7v1M3me7dJGtTX6cqPggwGoRADVQJ', //    1.31x
        '1Dice7JNVnvzyaenNyNcACuNnRVjt7jBrC', //    1.58x
        '1Dice5ycHmxDHUFVkdKGgrwsDDK1mPES3U', //    1.98x
        '1Dice2wTatMqebSPsbG4gKgT3HfHznsHWi', //    2.63x
        '1Dice1wBBY22stCobuE1LJxHX5FNZ7U97N', //    3.95x
        '1Dice1cF41TGRLoCTbtN33DSdPtTujzUzx', //    7.91x
        '1Dice1FZk6Ls5LKhnGMCLq47tg1DFG763e', //   15.83x
        '1Dice115YcjDrPM9gXFW8iFV9S3j9MtERm', //   63.35x
        '1DiceoejxZdTrYwu3FMP2Ldew91jq9L2u'   // 1013.74x
      ];

      return service;

 
      function addressIsKnown(legacyAddress) {
        var isKnown = false;
        var knownAddress = '';
        var knownAddressCount = addresses.length;
        for(var i = 0; i < knownAddressCount; i++) {
          knownAddress = addresses[i];
          if (knownAddress === legacyAddress) {
            isKnown = true;
            break;
          }
        }
        return isKnown;
      }

      /**
       * Returns a promose. The result of which has the form: (returned by the API)
       * {
       *   "id":438983,
       *   "depositTxHash":"681e9ceaf94becf80a30041bfb82c0f4147319269f1ceb8a169f3ce2a673eb51",
       *   "vout":0,
       *   "payoutTxHash":"28e4c318f6c938faf85391ddc886d91e2e6b7ed2076469e0e4632d7de49a3496",
       *   "serverSeedHash":"90abbfdb3988cc19ab8573277caccd93a0d8858d2fab574c8a371545b08ea128",
       *   "randomSeed":"4b82c6816ad8d40fa47d702a82ecbee482c4f105c2b0abaf6eff0a01de2be216",
       *   "serverSeedTx":"2174aba545248847c004c0bbac785261d6f308d8c443850e68a968d36f0b977d",
       *   "bet":61440,
       *   "roll":24600,
       *   "win":true,
       *   "betAmount":0.0005,
       *   "payout":0.000525,
       *   "timestamp":"Dec 18, 2018 12:12:23 AM",
       *   "timestampUnix":1545091943000,
       *   "seedPublishTimestamp":"Dec 19, 2018 12:00:00 AM",
       *   "seedPublishTimestampUnix":1545177600000
       * }
       * @param {string} txid 
       */
      function getBetStatus(txid) {
        var deferred = $q.defer();
        _getBetStatus(txid, deferred, 0);
        return deferred.promise;
      }

      function _getBetStatus(txid, deferred, totalIterations) {

        function _tryAgain() {
          if (totalIterations >= STATUS_CHECKS_MAX) {
            deferred.reject('Retries exhausted.');
          } else {
            $interval(_getBetStatus, STATUS_CHECK_INTERVAL, 1, false, txid, deferred, totalIterations + 1);
          }
        }

        var url = 'https://satoshidice.com/api/game?txid=' + txid;

        $http({
          method: 'GET',
          url:url
        }).then(
          function onSuccess(response) {
            $log.debug('Retrieved bet status', response);
            if (response.status === 200) {
              if (response.data.payload.length > 0) {
                deferred.resolve(response.data.payload[0]);
                return;
              }
            }
            _tryAgain();
          },
          function onError(response) {
            $log.error('Failed to retrieve bet status.', response);
            _tryAgain();
          }
        );
      }


      /**
       * Adds isSatoshiDice property to sent and received txs
       * 
       * @param {Object} tx 
       */
      function processTx(tx) {
        var addressCount = 0;
        var addressToCheck = '';
        var isSatoshiDice = false;

        if (tx.action === 'received') {

          addressCount = tx.inputs.length;
          for (var i = 0; i < addressCount; i++) {
            addressToCheck = tx.inputs[i].address;
            isSatoshiDice = addressIsKnown(addressToCheck);
            if (isSatoshiDice) {
              break;
            }
          }
          tx.isSatoshiDice = isSatoshiDice;

        } else if (tx.action === 'sent') {
          addressCount = tx.outputs.length;
          for (var i = 0; i < addressCount; i++) {
            addressToCheck = tx.outputs[i].address;
            isSatoshiDice = addressIsKnown(addressToCheck);
            if (isSatoshiDice) {
              break;
            }
          }
          tx.isSatoshiDice = isSatoshiDice;
        }

      }
    }
})();