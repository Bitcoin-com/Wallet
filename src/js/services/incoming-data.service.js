'use strict';

/**
 * incomingDataService is an intermediate to redirect either to the sendFlow
 * or to import/join a wallet.
 */
(function() {
  angular
      .module('copayApp.services')
      .factory('incomingDataService', incomingDataService);

  function incomingDataService(
    bitcoinUriService
    , $log
    , $state
    , $rootScope
    , sendFlowService
    , gettextCatalog
  ) {

    var root = {};

    root.showMenu = function(data) {
      $rootScope.$broadcast('incomingDataMenu.showMenu', data);
    };

    root.redir = function(data, cbError) {
      var parsed = bitcoinUriService.parse(data);

      console.log(parsed);
      $log.debug(parsed);


      if (parsed.isValid) {
        if (parsed.isTestnet) {
          if (cbError) {
            var errorMessage = gettextCatalog.getString('Testnet is not supported.');
            cbError(new Error(errorMessage));
          }
        } else {
          /**
           * Strategy for the action
           */
          if (parsed.copayInvitation) {
            $state.go('tabs.home').then(function() {
              $state.transitionTo('tabs.add.join', {
                url: data
              });
            });
          } else if (parsed.import) {
            $state.go('tabs.home').then(function() {
              $state.transitionTo('tabs.add.import', {
                code: data
              });
            });
          } else if (
            !parsed.isValid
            || parsed.privateKey
            || (sendFlowService.state.isEmpty() && !parsed.url && !parsed.publicAddress)
          ) {
            root.showMenu({
              original: data,
              parsed: parsed
            });
          } else {
            var state = sendFlowService.state.getClone();
            state.data = data;
            
            sendFlowService.start(state, function onError(err) {
              /**
               * OnError, open the menu (link not validated)
               */
              root.showMenu({
                original: data,
                parsed: parsed
              });
            });
          }
        }
      } else {
        if (cbError) {
          var errorMessage = gettextCatalog.getString('Data not recognised.');
          cbError(new Error(errorMessage));
        }
      }
    };

    return root;
  }
})();
