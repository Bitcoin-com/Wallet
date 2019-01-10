'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowRouterService', kycFlowRouterService);
  
  function kycFlowRouterService(
    $state
    , $ionicHistory
  ) {

    var service = {
      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack,
    };

    return service;

    /**
     * Start new send flow
     */
    function start(state) {     
      service.goNext(state);
    }

    /**
     * Go to the next page
     * Routing strategy : https://bitcoindotcom.atlassian.net/wiki/spaces/BW/pages/757596161/Buy+bitcoin
     */
    function goNext(state) {
      console.log('kyc-flow-router - goNext', state);
      console.log('document count: ', state.documents.length );
      var attemptRecovery = (state.isRecovery)
      var needsDocumentType = !(state.countryCode && state.documentType);
      var needsVerify = state.inPreview;
      var needsDocumentation = !(state.documentType && state.documents && state.documents.length === ((state.documentType === 'passport') ? 1 : 2));
      var needsPersonalInfo = 
        !( state.firstName
        && state.lastName
        && state.dob
        && state.streetAddress1
        && state.city
        && state.postalCode
        && state.country
        );

      // Recover Customer ID Page
      if(attemptRecovery) {
        if(attemptRecovery === 'start') {
          // Recovery page
          console.log('KYC-FLOW - Recovery Page');
          return;
        } else {
          // Recovery Success/Failure Page
          console.log('KYC-FLOW - Recovery Page - Fail/Success');
          return;
        }
      }
      //New Customer Page
      if (needsDocumentType) {
        console.log('KYC-FLOW - Verification');
        $state.go('tabs.buybitcoin-kyc-document-info');
        return;
      }

      if (needsVerify) {
        console.log('KYC-FLOW - Document Preview');
        $state.go('tabs.buybitcoin-kyc-document-verify', {count: state.documents.length});
        return;
      }

      //Document Photo Page
      if (needsDocumentation) {
        console.log('KYC-FLOW - Document Photo');
        $state.go('tabs.buybitcoin-kyc-document-capture', {count: state.documents.length});
        return;
      }

      // Personal Info Page
      if (needsPersonalInfo) {
        console.log('KYC-FLOW - Personal Info');
        $state.go('tabs.buybitcoin-kyc-personal-info');
        return;
      }

      // KYC Status Page
      console.log('KYC-FLOW - KYC Status');
      $state.go('tabs.buybitcoin-kyc-status');
    }

    /**
     * Go to the previous page
     */
    function goBack() {
      $ionicHistory.goBack();
    }
  };

})();