'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('kycFlowRouterService', kycFlowRouterService);
  
  function kycFlowRouterService(
    $state, $ionicHistory, $timeout
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
      var reviewingDocument = state.documentReviewing;
      var needsVerify = state.inPreview;
      var needsDocumentation = !(state.documentType && state.documents && state.documents.length === ((state.documentType === 'passport') ? 1 : 2));
      var needsPersonalInfo = 
        !( state.firstName
        && state.lastName
        && state.dob
        && state.streetAddress1
        && state.postalCode
        && state.clearHistory
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

      // Review Document Page
      if (reviewingDocument) {
        console.log('KYC-FLOW - Document Review');
        $state.go('tabs.buybitcoin-kyc-document-verify');
      }

      if (needsVerify) {
        console.log('KYC-FLOW - Document Preview');
        $state.go('tabs.buybitcoin-kyc-document-verify');
        return;
      }

      //Document Photo Page
      if (needsDocumentation) {
        console.log('KYC-FLOW - Document Photo');
        $state.go('tabs.buybitcoin-kyc-document-capture');
        return;
      }

      // Personal Info Page
      if (needsPersonalInfo) {
        console.log('KYC-FLOW - Personal Info');
        $state.go('tabs.buybitcoin-kyc-personal-info');
        return;
      }

      // KYC Status Page
      if (state.identity.status !== 'initiated') {
        console.log('KYC-FLOW - KYC Status');
        return;
      }

      // Go to home
      console.log('KYC-FLOW - Fallthrough');
      $ionicHistory.clearHistory();
      $state.go('tabs.buy-bitcoin-home');
    }

    /**
     * Go to the previous page
     */
    function goBack() {
      $ionicHistory.goBack();
    }
  };

})();