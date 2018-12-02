'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('sendFlowService', sendFlowService);
  
  function sendFlowService(
    sendFlowStateService, sendFlowRouterService
    , bitcoinUriService, payproService, bitcoinCashJsService
    , popupService, gettextCatalog
    , $state, $log
  ) {

    var service = {
      // Variables
      state: sendFlowStateService,
      router: sendFlowRouterService,

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack
    };

    return service;

    /**
     * Start a new send flow
     * @param {Object} params 
     * @param {Function} onError 
     */
    function start(params, onError) {
      $log.debug('send-flow start()');

      if (params && params.data) {
        var res = bitcoinUriService.parse(params.data);

        if (res.isValid) {

          // If BIP70 (url)
          if (res.url) {
            var url = res.url;
            var coin = res.coin || '';
            payproService.getPayProDetails(url, coin, function onGetPayProDetails(err, payProData) {
              if (err) {
                popupService.showAlert(gettextCatalog.getString('Error'), err);
              } else {
                var name = payProData.domain;
                
                // Detect some merchant that we know
                if (payProData.memo.indexOf('eGifter') > -1) {
                  name = 'eGifter'
                } else if (payProData.url.indexOf('https://bitpay.com') > -1) {
                  name = 'BitPay';
                }

                // Init thirdParty
                var thirdPartyData = {
                  id: 'bip70',
                  caTrusted: true,
                  name: name,
                  domain: payProData.domain,
                  expires: payProData.expires,
                  memo: payProData.memo,
                  network: 'livenet',
                  requiredFeeRate: payProData.requiredFeeRate,
                  selfSigned: 0,
                  time: payProData.time,
                  url: payProData.url,
                  verified: true
                };

                // Fill in params
                params.amount = payProData.amount,
                params.toAddress = payProData.toAddress,
                params.coin = coin,
                params.thirdParty = thirdPartyData
              }

              // Resolve
              _next();
            });
          } else {
            if (res.coin) {
              params.coin = res.coin;
            }

            if (res.amountInSatoshis) {
              params.amount = res.amountInSatoshis;
            }

            if (res.publicAddress) {
              var prefix = res.isTestnet ? 'bchtest:' : 'bitcoincash:';
              params.displayAddress = res.publicAddress.cashAddr || res.publicAddress.legacy || res.publicAddress.bitpay;
              var formatAddress = res.publicAddress.cashAddr ? prefix + params.displayAddress : params.displayAddress;
              params.toAddress = bitcoinCashJsService.readAddress(formatAddress).legacy;
            }
            
            _next();
          }
        } else {
          if (onError) {
            onError();
          }
        }
      } else {
        _next();
      }


      // Next used for sync the async task
      function _next() {
        sendFlowStateService.init(params);

        // Routing strategy to -> send-flow-router.service
        sendFlowRouterService.start();
      }
    }

    /**
     * Go to the next step
     * @param {Object} state 
     */
    function goNext(state) {
      $log.debug('send-flow goNext()');

      // Save the current route before leaving
      state.route = $state.current.name;

      // Save the state and redirect the user
      sendFlowStateService.push(state);
      sendFlowRouterService.goNext();
    }

    /**
     * Go to the previous step
     */
    function goBack() {
      $log.debug('send-flow goBack()');

      // Remove the state on top and redirect the user
      sendFlowStateService.pop();
      sendFlowRouterService.goBack();
    }
  }
})();