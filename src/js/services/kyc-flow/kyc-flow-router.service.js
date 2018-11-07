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
      if (state.customerId) {
        
      } else {
        $state.go('tabs.home').then(function () {
          $ionicHistory.clearHistory();
          $state.go('tabs.buy-bitcoin-welcome');
        }); 
      }
    }

    /**
     * Go to the next page
     * Routing strategy : https://bitcoindotcom.atlassian.net/wiki/spaces/BW/pages/757596161/Buy+bitcoin
     */
    function goNext(state) {
      

      // $state.go('');
    }

    /**
     * Go to the previous page
     */
    function goBack() {
      $ionicHistory.goBack();
    }
  };

})();