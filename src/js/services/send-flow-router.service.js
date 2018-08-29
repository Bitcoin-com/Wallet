'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowRouterService', sendFlowRouterService);
  
  function sendFlowRouterService(
    sendFlowStateService
    , $state, $ionicHistory
  ) {

    var service = {
      // A separate state variable so we can ensure it is cleared of everything,
      // even other properties added that this service does not know about. (such as "coin")

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack,
    };

    return service;

    /**
     * 
     */
    function start() {
      if ($state.current.name != 'tabs.send') {
        $state.go('tabs.home').then(function () {
          $ionicHistory.clearHistory();
          $state.go('tabs.send');
          goNext();
        });
      } else {
        goNext();
      }
    }

    /**
     * 
     */
    function goNext() {
      var state = sendFlowStateService.state;

      /**
       * Strategy
       */
      if (!state.fromWalletId && (state.isWalletTransfer || (state.toWalletId || state.toAddress))) {
        $state.transitionTo('tabs.send.origin');
      } else if (state.fromWalletId && !state.toWalletId && !state.toAddress) {
        $state.transitionTo('tabs.send.destination');
      } else if (state.fromWalletId && (state.toWalletId || state.toAddress) && !state.amount) {
        $state.transitionTo('tabs.send.amount');
      } else if (state.fromWalletId && (state.toWalletId || state.toAddress) && state.amount) {
        $state.transitionTo('tabs.send.review');
      }
    }

    function goBack() {

      /**
       * Strategy
       */
      $ionicHistory.goBack();
    }
  };

})();