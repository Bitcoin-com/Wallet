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
    , $state
    , $log
    , $q
  ) {

    var service = {

      // Functions
      start: start,
      retry: retry,
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
      return $q(function onStartSuccess(resolve, revoke) {
        kycFlowStateService.init();
        ongoingProcess.set('gettingKycIdentity', true);
        _prepareState().then(function onSuccess() {
          ongoingProcess.set('gettingKycIdentity', false);
          resolve();
        }, 
        function onFailure(err) {
          ongoingProcess.set('gettingKycIdentity', false);
          revoke();
        });
      });
    }

    /**
     * Retry the Buy Bitcoin flow
     */
    function retry() {
      $log.debug('buy bitcoin retry()');
      return $q(function onRetrySuccess(resolve, revoke) {
        ongoingProcess.set('gettingKycIdentity', true);
        _prepareRetryState().then(function onSuccess() {
          ongoingProcess.set('gettingKycIdentity', false);
          resolve();
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

      var currentState = kycFlowStateService.getClone();

      // Save the state and redirect the user
      kycFlowStateService.push(state);

      if (!currentState.country) {
        kycFlowRouterService.goBack();
      } else {
        kycFlowRouterService.goNext(state);
      }
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
      return $q( function(resolve, reject) {
        // Get Identity
        ongoingProcess.set('gettingKycIdentity', true);
        moonPayService.getIdentityCheck().then( 
          function onResponse(identity) {
            ongoingProcess.set('gettingKycIdentity', false);
            if(identity) {
              kycFlowStateService.init({
                kycIsSubmitted: true
                , result: identity.result
                , status: identity.status
              });
              kycFlowRouterService.start(kycFlowStateService.getClone());
              resolve();
              return;
            }

            // Beign First Verification flow
            moonPayService.getCustomer().then( 
              function onFetchCustomerSuccess(personalInfo) {
                kycFlowStateService.init({ 
                  'firstName': personalInfo.firstName
                  , 'lastName': personalInfo.lastName
                  , 'dob': moment(personalInfo.dateOfBirth, 'YYYY-MM-DD').format('DD/MM/YYYY')
                  , 'streetAddress1': personalInfo.address.street
                  , 'streetAddress2': personalInfo.address.subStreet
                  , 'city': personalInfo.address.town
                  , 'postalCode': personalInfo.address.postCode
                  , 'country': personalInfo.address.country
                });
                kycFlowRouterService.start(kycFlowStateService.getClone());
                resolve();
                return;
              }, 
              function onFetchCustomerFail(err) {
                // Failed to get customer, ignore data import
                kycFlowStateService.init();
                kycFlowRouterService.start(kycFlowStateService.getClone());
                resolve();
                return;
              }
            );
          },
          function onError(err) {
              reject(err);
          }
        );
      });
    }

    function _prepareRetryState() {
      return $q( function(resolve, reject) {
        // Beign Retry Verification flow
        moonPayService.getCustomer().then( 
          function onFetchCustomerSuccess(personalInfo) {
            kycFlowStateService.init({
              'kycIsSubmitted': false
              , 'firstName': personalInfo.firstName
              , 'lastName': personalInfo.lastName
              , 'dob': moment(personalInfo.dateOfBirth, 'YYYY-MM-DD').format('DD/MM/YYYY')
              , 'streetAddress1': personalInfo.address.street
              , 'streetAddress2': personalInfo.address.subStreet
              , 'city': personalInfo.address.town
              , 'postalCode': personalInfo.address.postCode
              , 'country': personalInfo.address.country
            });
            kycFlowRouterService.start(kycFlowStateService.getClone());
            resolve();
            return;
          }, 
          function onFetchCustomerFail(err) {
            // Failed to get customer, ignore data import
            kycFlowStateService.init({'kycIsSubmitted': false});
            kycFlowRouterService.start(kycFlowStateService.getClone());
            resolve();
            return;
          }
        );
      });
    }
  }
})();