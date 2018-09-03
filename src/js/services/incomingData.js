'use strict';

angular.module('copayApp.services').factory('incomingData', function(externalLinkService, bitcoinUriService, $log, $state, $timeout, $ionicHistory, bitcore, bitcoreCash, $rootScope, payproService, scannerService, sendFlowService, appConfigService, popupService, gettextCatalog, bitcoinCashJsService) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data) {
    var parsed = bitcoinUriService.parse(data);

    if (parsed.isValid && parsed.isTestnet) {
      popupService.showAlert(
        gettextCatalog.getString('Unsupported'), 
        gettextCatalog.getString('Testnet is not supported.')
      );
      return false;
    } else {
      /**
       * Hardcore fix, but the legacy code in the bottom needs to be removed.
       * BitcoinUriService is making the job of this.
       * incomingData should be an intermediate to redirect either to the sendFlow
       * or to import a wallet for example.
       */
      scannerService.pausePreview();

      /**
       * Strategy for the action
       */
      if (parsed.copayInvitation) {
        $state.go('tabs.home').then(function() {
          $state.transitionTo('tabs.add.join', {
            url: data
          });
        });
      } else if (
        !parsed.isValid
        || parsed.privateKey
        || (sendFlowService.state.isEmpty() && !parsed.url && !parsed.amount)
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
  }

    /**
     * The legacy code in the bottom needs to be checked and removed if any case is forgotten.
     * else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;

      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;
    } else if (data && (data.substring(0, 2) == '6P' || checkPrivateKey(data))) {
      root.showMenu({
        data: data,
        type: 'privateKey'
      });
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.import', {
          code: data
        });
      });
     * 
     */

  return root;
});
