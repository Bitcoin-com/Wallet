'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('sendFlowRouterService', sendFlowRouterService);
  
  function sendFlowRouterService(
    sendFlowStateService
    , $state, $ionicHistory, $timeout
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
    function start() {     
      var state = sendFlowStateService.state;
      
      if (state.isRequestAmount) {
        $state.go('tabs.paymentRequest.amount');
      } else {
        if ($state.current.name != 'tabs.send') {
          $state.go('tabs.home').then(function () {
            $ionicHistory.clearHistory();
            $state.go('tabs.send').then(function () {
              $timeout(function () {
                goNext();
              }, 60);
            });
          });
        } else {
          goNext();
        }
      }
    }

    /**
     * Go to the next page
     * Routing strategy : https://bitcoindotcom.atlassian.net/wiki/x/BQDWKQ
     */
    function goNext() {
      var state = sendFlowStateService.state;

      var needsDestination = !state.toWalletId && !state.toAddress;
      var needsOrigin = !state.fromWalletId;
      var needsAmount = !state.amount && !state.sendMax;

      if (needsDestination) {
        if (!state.isWalletTransfer && !state.thirdParty) {
          $state.go('tabs.send');
          return;
        } else if (!needsOrigin) {
          $state.go('tabs.send.destination');
          return;
        }
      }
      
      if (needsOrigin) {
        $state.go('tabs.send.origin');
      } else if (needsAmount) {
        $state.go('tabs.send.amount');
      } else {
        $state.go('tabs.send.review');
      }
    }

    /**
     * Go to the previous page
     */
    function goBack() {
      $ionicHistory.goBack();
    }
  };

})();