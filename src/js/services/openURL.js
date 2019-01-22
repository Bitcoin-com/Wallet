'use strict';

angular.module('copayApp.services').factory('openURLService', function(
  appConfigService
  , gettextCatalog
  , incomingDataService
  , $ionicHistory
  , $log
  , platformInfo
  , popupService
  , profileService
  , $state
  , ongoingProcess
  , moonPayService
  ) {

  var root = {};

  function handleBuyBitcoinAuthUrl(url) {
    var txId = '';

    try {
      var urlParts = url.split('?');
      var query = urlParts[1];
      var queryParts = query.split('=');
      txId = queryParts[1];
    } catch (e) {
      $log.error('Error when parsing Buy Bitcoin auth.', e);
    }
    
    if (txId) {
      ongoingProcess.set('loadingTxInfo', true);
      moonPayService.getTransaction(txId).then(function (tx) {
        ongoingProcess.set('loadingTxInfo', false);
        if (tx.status == 'failed') {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString(tx.failureReason || 'Internal Error'));
        } else {
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
          });
          $state.go('tabs.home').then(function onHome() {
            $ionicHistory.nextViewOptions({ disableAnimate: true });
            return $state.transitionTo('tabs.buybitcoin');

          }).then(function onBuyBitcoin() {
            $ionicHistory.nextViewOptions({ disableAnimate: true });
            return $state.transitionTo('tabs.buybitcoin-purchasehistory');

          }).then(function onBuyBitcoinPurchaseHistory() {
            $state.go('tabs.buybitcoin-success', {
              moonpayTxId: txId
            });
          });
        }
      });

    } else {
      $log.warn('Transaction ID not found in Buy Bitcoin Auth URL: ' + url);
      popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid URL'));
    }
  }

  var handleOpenURL = function(args) {

    $log.info('Handling Open URL: ' + JSON.stringify(args));

    var url = args.url;
    if (!url) {
      $log.error('No url provided');
      return;
    };

    if (url) {
      if ('cordova' in window) {
        window.cordova.removeDocumentEventHandler('handleopenurl');
        window.cordova.addStickyDocumentEventHandler('handleopenurl');
      }
      document.removeEventListener('handleopenurl', handleOpenURL);
    }

    document.addEventListener('handleopenurl', handleOpenURL, false);

    if (url.startsWith('bitcoincom://buybitcoin/auth?transactionId=')) {
      handleBuyBitcoinAuthUrl(url);
    } else {

      incomingDataService.redir(url, function onError(err) {
        if (err) {
          $log.warn('Unknown URL! : ' + url);
          popupService.showAlert(gettextCatalog.getString('Error'), err.message);
        }
      });
    }
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenURL, false);
  };

  root.init = function() {
    $log.debug('Initializing openURL');
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);

    if (platformInfo.isChromeApp) {
      $log.debug('Registering Chrome message listener');
      chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.url) {
            handleOpenURL(request.url);
          }
        });
    } else if (platformInfo.isNW) {
      var gui = require('nw.gui');

      // This event is sent to an existent instance of Copay (only for standalone apps)
      gui.App.on('open', function(pathData) {
        if (pathData.indexOf(/^bitcoin(cash)?:/) != -1) {
          $log.debug('Bitcoin URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf(/^bitcoin(cash)?:/))
          });
        } else if (pathData.indexOf(appConfigService.name + '://') != -1) {
          $log.debug(appConfigService.name + ' URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf(appConfigService.name + '://'))
          });
        }
      });

      // Used at the startup of Copay
      var argv = gui.App.argv;
      if (argv && argv[0]) {
        handleOpenURL({
          url: argv[0]
        });
      }
    } else if (platformInfo.isDevel) {
      var base = window.location.origin + '/';
      var url = base + '#/uri/%s';

      if (navigator.registerProtocolHandler) {
        $log.debug('Registering Browser handlers base:' + base);
        navigator.registerProtocolHandler('bitcoin', url, 'Copay Bitcoin Handler');
        navigator.registerProtocolHandler('web+bitcoincash', url, 'Copay Bitcoin Cash Handler');
        navigator.registerProtocolHandler('web+copay', url, 'Copay Wallet Handler');
        navigator.registerProtocolHandler('web+bitpay', url, 'BitPay Wallet Handler');
      }
    }
  };

  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  root.handleURL = function(args) {
    profileService.whenAvailable(function() {
      // Wait ux to settle
      setTimeout(function() {
        handleOpenURL(args);
      }, 1000);
    });
  };

  return root;
});
