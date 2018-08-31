'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowService', sendFlowService);
  
  function sendFlowService(
    sendFlowStateService, sendFlowRouterService
    , bitcoinUriService, payproService, bitcoinCashJsService
    , popupService
    , $state
  ) {

    var service = {
      // A separate state variable so we can ensure it is cleared of everything,
      // even other properties added that this service does not know about. (such as "coin")
      state: sendFlowStateService,
      router: sendFlowRouterService,

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack
    };

    return service;

    /**
     * Clears all previous state
     */
    function start(params) {
      console.log('start()');

      if (params && params.data) {
        var res = bitcoinUriService.parse(params.data);

        if (res.isValid) {

          /**
           * If BIP70
           */
          if (res.url) {
            var url = res.url;
            var coin = res.coin || '';
            payproService.getPayProDetails(url, coin, function onGetPayProDetails(err, payProData) {
              if (err) {
                popupService.showAlert(gettextCatalog.getString('Error'), err);
              } else {
                // Fill in the params
                var toAddr = payProData.toAddress;
                var amount = payProData.amount;
                var paymentUrl = payProData.url;
                var expires = payProData.expires;
                var time = payProData.time;
                var name = payProData.domain;
                
                // Detect some merchant that we know
                if (payProData.memo.indexOf('eGifter') > -1) {
                  name = 'eGifter'
                } else if (paymentUrl.indexOf('https://bitpay.com') > -1) {
                  name = 'BitPay';
                }

                // Init thirdParty
                var thirdPartyData = {
                  id: 'bip70',
                  amount: amount,
                  caTrusted: true,
                  name: name,
                  domain: payProData.domain,
                  expires: expires,
                  memo: payProData.memo,
                  network: 'livenet',
                  requiredFeeRate: payProData.requiredFeeRate,
                  selfSigned: 0,
                  time: time,
                  toAddress: toAddr,
                  url: paymentUrl,
                  verified: true
                };

                /**
                 * Fill in params
                 */
                params.amount = thirdPartyData.amount,
                params.toAddress = thirdPartyData.toAddress,
                params.coin = coin,
                params.thirdParty = thirdPartyData
              }

              /**
               *  Resolve
               */
              _next();
            });
          } else {
            if (res.coin) {
              params.coin = res.coin;
            }

            if (res.amount) {
              params.amount = res.amount;
            }

            if (res.publicAddress) {
              var prefix = res.testnet ? 'bchtest:' : 'bitcoincash:';
              params.displayAddress = (prefix + res.publicAddress.cashAddr) || res.publicAddress.legacy || res.publicAddress.bitpay;
              params.toAddress = bitcoinCashJsService.readAddress(params.displayAddress).legacy;
            }
            
            _next();
          }
        } else {
          _next();
        }
      } else {
        _next();
      }


      // Next used for sync the async task
      function _next() {

        /**
         *  Init the state if params is defined
         */
        if (params) {
          sendFlowStateService.init(params);
        }

        /**
         * Routing strategy to -> send-flow-router.service
         */
        sendFlowRouterService.start();
      }
    }

    function goNext(state) {
      /**
       * Save the current route before leaving
       */
      state.route = $state.current.name;

      /**
       * Save the state and redirect the user
       */
      sendFlowStateService.push(state);
      sendFlowRouterService.goNext();
    }

    function goBack() {
        /**
         * Remove the state on top and redirect the user
         */
        sendFlowStateService.pop();
        sendFlowRouterService.goBack();
    }
  };

})();