'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowService', kycFlowService);
  
  function kycFlowService(
    kycFlowStateService
    , kycFlowRouterService
    , moonpayService
    , ongoingProcess
    , bitcoinUriService, payproService, bitcoinCashJsService
    , popupService, gettextCatalog
    , $state, $log
  ) {

    var service = {

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack
    };

    return service;

    /**
     * Start the Buy Bitcoin flow
     */
    function start() {
      $log.debug('buy bitcoin start()');

      ongoingProcess.set('gettingKycCustomerId', true);
      moonpayService.getCustomerId(function onCustomerId(err, customerId){
        ongoingProcess.set('gettingKycCustomerId', false);

        if (err) {
          $log.error('Error getting Moonpay customer ID. ' + err);
          return;
        }

        $log.debug('Moonpay customer ID: ' + customerId);

        kycFlowStateService.init({
          customerId: customerId
        });

        kycFlowRouterService.start(kycFlowStateService.getClone());
      });
    }

    /**
     * Go to the next step
     * @param {Object} state 
     */
    function goNext(state) {
      $log.debug('kyc-flow goNext()');

      // Save the current route before leaving
      state.route = $state.current.name;

      // Save the state and redirect the user
      kycFlowStateService.push(state);
      kycFlowRouterService.goNext();
    }

    /**
     * Go to the previous step
     */
    function goBack() {
      $log.debug('kyc-flow goBack()');

      // Remove the state on top and redirect the user
      kycFlowStateService.pop();
      kycFlowRouterService.goBack();
    }
  }
})();