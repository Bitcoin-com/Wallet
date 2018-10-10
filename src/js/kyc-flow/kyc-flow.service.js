'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowService', kycFlowService);
  
  function kycFlowService(
    kycFlowStateService, kycFlowRouterService
    , bitcoinUriService, payproService, bitcoinCashJsService
    , popupService, gettextCatalog
    , $state, $log
  ) {

    var service = {
      // Variables
      state: kycFlowStateService,
      router: kycFlowRouterService,

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
        _next();
      } else {
        _next();
      }


      // Next used for sync the async task
      function _next() {
        kycFlowStateService.init(params);

        // Routing strategy to -> kyc-flow-router.service
        kycFlowRouterService.start();
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