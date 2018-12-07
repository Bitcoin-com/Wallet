'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowService', kycFlowService);
  
  function kycFlowService(
    kycFlowStateService
    , kycFlowRouterService
    , moonPayService
    , ongoingProcess
    , bitcoinUriService, payproService, bitcoinCashJsService
    , popupService, gettextCatalog
    , $state, $log
  ) {

    var service = {

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack,
      getCurrentStateClone: getCurrentStateClone,
    };

    return service;

    /**
     * Start the Buy Bitcoin flow
     */
    function start() {
      $log.debug('buy bitcoin start()');

      ongoingProcess.set('gettingKycIdentity', true);

      _prepareState().then(function onSuccess() {
        ongoingProcess.set('gettingKycIdentity', false);
        kycFlowRouterService.start(kycFlowStateService.getClone());
      }, 
      function onFailure(err) {
        ongoingProcess.set('gettingKycIdentity', false);
      });
    }

    function getCurrentStateClone() {
      return kycFlowStateService.getClone();
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

    async function _prepareState() {
      return new Promise( function(resolve, reject) {
        // Get Identity
        ongoingProcess.set('gettingKycIdentity', true);
        moonPayService.getIdentityCheck().then( 
          function onResponse(identity) {
            ongoingProcess.set('gettingKycIdentity', false);
            if(identity) {
              kycFlowStateService.init( { 
                'identity': identity 
              , result: identity.result
              });
              kycFlowRouterService.start(kycFlowStateService.getClone());
              return;
            }
            
            // Get Customer and Files
            var fetchingCustomer = moonPayService.getCustomer();
            var fetchingFiles = moonPayService.getFiles();

            Promise.all([fetchingCustomer, fetchingFiles]).then( function onSuccess(values){
              // Merge Values
              kycFlowStateService.init( { 
                'firstName': values[0].firstName
                , 'lastName': values[0].lastName
                , 'dob': moment(values[0].dateOfBirth, 'YYYY-MM-DD').format('DD/MM/YYYY')
                , 'streetAddress1': values[0].address.street
                , 'streetAddress2': values[0].address.subStreet
                , 'city': values[0].address.town
                , 'postalCode': values[0].address.postCode
                , 'country': values[0].address.country
                , 'documentsMeta': values[1] ? values[1] : {}
                , 'countryCode': values[1][0].country ? values[1][0].country : ''
                , 'documentType': values[1][0].type
                });


              kycFlowRouterService.start(kycFlowStateService.getClone());
            }, function onError(err) {
              reject(err);
            });
          },
          function onError(err) {
              reject(err);
          }
        );

        // Get Customer

        // Get Files

      });
    }     
  }
})();