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
      var needsDocumentType = !(state.countryCode && state.documentType);
      var needsVerify = state.inPreview;
      var needsDocumentation = !(state.documentType && state.documents && state.documents.length === ((state.documentType === 'passport') ? 2 : 3));

      if (state.status) {
        // KYC Status Page
        console.log('KYC-FLOW - KYC Status');
        $state.go('tabs.buybitcoin-kyc-status');
        return;
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
