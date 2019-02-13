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
    , $state, $log
  ) {

    var service = {

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack,
      getCurrentStateClone: getCurrentStateClone,
      popState: popState
    };

    return service;

    /**
     * Start the Buy Bitcoin flow
     */
    function start() {
      $log.debug('buy bitcoin start()');
      return new Promise(function onStartSuccess(resolve, revoke) {
        kycFlowStateService.init();
        ongoingProcess.set('gettingKycIdentity', true);
        _prepareState().then(function onSuccess() {
          ongoingProcess.set('gettingKycIdentity', false);
          kycFlowRouterService.start(kycFlowStateService.getClone());
          resolve();
        }, 
        function onFailure(err) {
          ongoingProcess.set('gettingKycIdentity', false);
          revoke();
        });
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
      kycFlowRouterService.goNext(state);
    }

    /**
     * Go to the previous step
     */
    function goBack() {
      $log.debug('kyc-flow goBack()');

      // Remove the state on top and redirect the user
      // popState();
      kycFlowRouterService.goBack();
    }

    function popState() {
      console.log('KYC Flow Service - POPSTATE()');
      kycFlowStateService.pop();
    }

    function _prepareState() {
      return new Promise( function(resolve, reject) {
        // Get Identity
        ongoingProcess.set('gettingKycIdentity', true);
        moonPayService.getIdentityCheck().then( 
          function onResponse(identity) {
            ongoingProcess.set('gettingKycIdentity', false);
            if(identity) {
              kycFlowStateService.init({ 
                result: identity.result
                , status: identity.status
              });
              kycFlowRouterService.start(kycFlowStateService.getClone());
              resolve();
              return;
            }


            kycFlowStateService.init();
            kycFlowRouterService.start(kycFlowStateService.getClone());
            
            // Get Customer and Files
            //var fetchingCustomer = moonPayService.getCustomer();
            //var fetchingFiles = moonPayService.getFiles();

            //Promise.all([fetchingCustomer, fetchingFiles]).then( function onSuccess(values){
              //var personalInfo = values[0];
              //var documents = values[1];
              // Merge Values
              // kycFlowStateService.init({ 
              //   'firstName': personalInfo.firstName
              //   , 'lastName': personalInfo.lastName
              //   , 'dob': moment(personalInfo.dateOfBirth, 'YYYY-MM-DD').format('DD/MM/YYYY')
              //   , 'streetAddress1': personalInfo.address.street
              //   , 'streetAddress2': personalInfo.address.subStreet
              //   , 'city': personalInfo.address.town
              //   , 'postalCode': personalInfo.address.postCode
              //   , 'country': personalInfo.address.country
              //   , 'documentsMeta': documents ? documents : {}
              //   , 'documents': []
              //   , 'countryCode': documents[0] ? (documents[0].country ? documents[0].country : '') : ''
              //   , 'documentType': documents[0] ? (documents[0].type ? documents[0].type : '') : ''
              //   });

              // kycFlowRouterService.start(kycFlowStateService.getClone());
              // resolve();
            // }, function onError(err) {
            //   reject(err);
            // });
          },
          function onError(err) {
              reject(err);
          }
        );
      });
    }     
  }
})();