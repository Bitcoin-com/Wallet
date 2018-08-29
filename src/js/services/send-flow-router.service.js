'use strict';

(function(){

angular
  .module('copayApp.services')
  .factory('sendFlowRouterService', sendFlowRouterService);
  
  function sendFlowRouterService($state, $ionicHistory) {

    var router = {
      // A separate state variable so we can ensure it is cleared of everything,
      // even other properties added that this service does not know about. (such as "coin")

      // Functions
      start: start,
      goNext: goNext,
      goBack: goBack,
    };

    return router;

    /**
     * 
     */
    function start() {
      $ionicHistory.clearHistory();
      $state.go('tabs.send');
    }

    /**
     * 
     */
    function goNext(state) {

      /**
       * Strategy
       * Clean the history & and go to the send tab.
       */
      // need to complete here
    }

    function goBack() {

      /**
       * Strategy
       */
      $ionicHistory.goBack();
    }
  };

})();