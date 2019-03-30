'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayRouterService', moonPayRouterService);
  
  function moonPayRouterService(
    $state, $ionicHistory
  ) {

    var service = {
      // Functions
      startFromWelcome: startFromWelcome
      , startFromHome: startFromHome
    };

    return service;

    /**
     * Start moonpay flow from welcome
     */
    function startFromWelcome() { 
      $state.go('tabs.home').then(function () {
        $ionicHistory.clearHistory();
        $state.go('tabs.buybitcoin-welcome');
      }); 
    }

    /**
     * Start moonpay flow from home
     */
    function startFromHome() { 
      $state.go('tabs.home').then(function () {
        $ionicHistory.clearHistory();
        $state.go('tabs.buybitcoin');
      }); 
    }
  };

})();