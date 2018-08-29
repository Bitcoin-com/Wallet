'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowService', sendFlowService);
  
  function sendFlowService(
    sendFlowStateService, sendFlowRouterService
    , bitcoinUriService, payproService
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
    async function start(params) {
      console.log('start()');

      if (params) {
        if (params.data) {
          var res = bitcoinUriService.parse(params.data);
  
          if (res.isValid) {

            /**
             * If BIP70
             */
            if (res.url) {
              var url = res.url;
              var coin = res.coin || '';
              await new Promise(function (resolve) {
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
                  resolve();
                });
              });
            }
          }
        }

        /**
         *  Init the state if params is defined
         */
        sendFlowStateService.init(params);
      }
            
      /**
       * Routing strategy to -> send-flow-router.service
       */
      sendFlowRouterService.start();
    }

    function goNext(state) {
      /**
       * Save the current route before leaving
       */
      state.route = $state.current.name;

      /**
       * Push the new state
       */
      sendFlowStateService.push(state);

      /**
       * Go next
       */
      sendFlowRouterService.goNext();
    }

    function goBack() {
        /**
         * Pop the current state
         */
        sendFlowStateService.pop();

        /**
         * Go back
         */
        sendFlowRouterService.goBack();
    }
  };

})();