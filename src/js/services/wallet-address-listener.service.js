'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('walletAddressListenerService', walletAddressListenerService);
    
  function walletAddressListenerService(
    $interval
    , $log
    , $timeout
    , walletService
    ) {
    
    var service = {
      listenTo: listenTo,
      stop: stop
    };

    var BALANCE_REFRESH_INTERVAL = 10 * 1000;
    var CLOSE_NORMAL = 1000;
    var RECONNECT_RATE_LIMIT = 1000;
    var address = '';
    var balanceChecker = null;
    var cb = null;
    var currentAddressSocket = null;
    var lastReconnectTime = 0;
    var paymentSubscriptionObj = { op:'addr_sub' };
    var previousTotalBalanceSat = 0;
    var $scope = null;
    var wallet = null;


    return service;


    function _connectSocket() {

      if (currentAddressSocket) {
        _closeSocketNormally();
      }
  
      if (wallet.coin === 'bch') {
        // listen to bch address
        currentAddressSocket = new WebSocket('ws://47.254.143.172:80/v1/address');
        paymentSubscriptionObj.addr = address;
      } else {
        // listen to btc address
        currentAddressSocket = new WebSocket('ws://47.254.143.172:81/v1/address');
        paymentSubscriptionObj.addr = address;
      }
  
      // create subscription to address
      var msg = JSON.stringify(paymentSubscriptionObj);
      currentAddressSocket.onopen = function onSocketOpen(event) {
        currentAddressSocket.send(msg);
      };
  
      // listen for response
      currentAddressSocket.onmessage = function onSocketMessage(event) {
        _onReceivedPayment(event.data);
      };
  
      currentAddressSocket.onclose = function onClose(event) {
        if (event.code !== CLOSE_NORMAL) {
          var timeSinceLastReconnect = Date.now() - lastReconnectTime;
          // Try to reconnect immediately if haven't tried to reconnect recently
          var reconnectDelay = Math.max(1, RECONNECT_RATE_LIMIT - timeSinceLastReconnect);

          $log.warn('Socket was closed abnormally. Close reason: ' + event.code + '. Seconds before reconnecting: ' + (reconnectDelay * 0.001).toFixed(3));
          $timeout(function onTimeoutForReconnect() {
            lastReconnectTime = Date.now();
            _connectSocket();
          }, reconnectDelay);
        }
      };
  
      currentAddressSocket.onerror = function onError(err) {
        $log.error('Socket encountered error, closing socket. ' + err.toString());
        currentAddressSocket.close();
      };
    }

    function _closeSocketNormally() {
      currentAddressSocket.close([CLOSE_NORMAL]);
      currentAddressSocket = null;
    }

    /**
     * Listens to one address at a time.
     * @param {} legacyAddress 
     * @param {} walletForAddress 
     * @param {} paymentReceivedCb
     */
    function listenTo(legacyAddress, walletForAddress, scope, paymentReceivedCb) {
      address = legacyAddress;
      cb = paymentReceivedCb;
      $scope = scope;
      wallet = walletForAddress;

      if (balanceChecker !== null) {
        $interval.cancel(balanceChecker);
        balanceChecker = null;
      }

      _setPreviousBalanceFromWallet();
      _connectSocket();

      balanceChecker = $interval(_updateWallet, BALANCE_REFRESH_INTERVAL);
    }

    function _onReceivedPayment(eventData) {
      _updateWallet();
      cb(eventData);
    }

    function stop() {
      if (balanceChecker !== null) {
        $interval.cancel(balanceChecker);
        balanceChecker = null;
      }

      if (currentAddressSocket !== null) {
        _closeSocketNormally();
      }

      address = '';
      cb = null;
      wallet = null;
    }

    function _setPreviousBalanceFromWallet() {

      if (wallet.status && wallet.status.isValid) {
        previousTotalBalanceSat = wallet.status.totalBalanceSat;
      } else if (wallet.cachedStatus && wallet.cachedStatus.isValid) {
        previousTotalBalanceSat = wallet.cachedStatus.totalBalanceSat;
      } else {
        walletService.getStatus(wallet, {}, function onGetStatus(err, status) {
          if (err) {
            $log.error('Error getting initial balance when listening to wallet address', err);
            return;
          }
    
          if (status && status.isValid) {
            previousTotalBalanceSat = status.totalBalanceSat;
          }
        });
      }
    }

    function _updateWallet() {
      var walletId = wallet.id;
      walletService.getStatus(wallet, { force: true }, function onGetStatus(err, status) {
        if (err) {
          $log.error(err);
          return;
        }

        if (!wallet) {
          // Stopped listening.
          return;
        }

        if (wallet.id !== walletId) {
          // Wallet has been changed, the status is for the wrong wallet.
          return;
        }

        if (status && status.isValid) {
          var totalBalanceSat = status.totalBalanceSat;
          var balanceChanged = totalBalanceSat !== previousTotalBalanceSat;
          previousTotalBalanceSat = totalBalanceSat;
  
          if (balanceChanged) {
            // Because we are forcing a refresh of the status form the server,
            // this should always be outside the Angularjs framework.
            $scope.$apply(function onApply(){
              if (wallet) {
                wallet.status = status;
              }
            });
          }
        }
      });
    }

  }

})();