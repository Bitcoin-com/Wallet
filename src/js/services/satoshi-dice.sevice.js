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
      var privateVariable = "";
 
      var service = {     
        // Public variables     
        myVariable: "myService",     
 
        // Public functions
        addressIsKnown: addressIsKnown,
        getBetStatus: getBetStatus
      };

      var STATUS_CHECK_INTERVAL = 1000; // The request sometimes takes 1.15s
      var STATUS_CHECKS_MAX = 30;
      var addresses = [
        '1Dice9GgmweQWxqdiu683E7bHfpb7MUXGd', // 1.05x
        '1Dice81SKu2S1nAzRJUbvpr5LiNTzn7MDV', // 1.12x

      ];

      return service;

 
      function addressIsKnown(legacyAddress) {
        // Content 
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


      function getBetStatus(txid) {
        var deferred = $q.defer();
        
        _getBetStatus(txid, deferred, 0);
        
        return deferred.promise;
      }

      function _getBetStatus(txid, deferred, totalIterations) {
        console.log('_getBetStatus(), totalIterations: ' + totalIterations);

        function _tryAgain() {
          if (totalIterations >= STATUS_CHECKS_MAX) {
            deferred.reject('Retries exhausted.');
          } else {
            $interval(_getBetStatus, STATUS_CHECK_INTERVAL, 1, true, txid, deferred, totalIterations + 1);
          }
        }

        var url = 'https://satoshidice.com/api/game?txid=' + txid;

        $http({
          method: 'GET',
          url:url
        }).then(
          function onSuccess(response) {
            console.log('sd onSuccess', response);
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

    }
})();