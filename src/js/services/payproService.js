'use strict';

angular.module('copayApp.services').factory('payproService',
  function(profileService, platformInfo, gettextCatalog, ongoingProcess, $log, $http) {

    var ret = {};

    ret.getPayProDetails = function(uri, coin, cb, disableLoader) {
      if (!cb) cb = function() {};

      var wallet = profileService.getWallets({
        onlyComplete: true,
        coin: coin
      })[0];

      if (!wallet) return cb();

      if (platformInfo.isChromeApp) {
        return cb(gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      }

      $log.debug('Fetch PayPro Request...', uri);

      if (!disableLoader) ongoingProcess.set('fetchingPayPro', true);

      wallet.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        if (!disableLoader) ongoingProcess.set('fetchingPayPro', false);
        if (err) return cb(gettextCatalog.getString('Could Not Fetch Payment: Check if it is still valid'));
        else if (!paypro.verified) {
          $log.warn('Failed to verify payment protocol signatures');
          return cb(gettextCatalog.getString('Payment Protocol Invalid'));
        }
        return cb(null, paypro);
      });
    };

    ret.getPayProDetailsViaHttp = function(uri, cb) {
      var config = {
        headers: {'Accept': 'application/payment-request'}
      };
      $http.get(uri, config).then(function(response) {
        return cb(null, response.data);
      }, function(error) {
        return cb(error, null);
      });
    }

    ret.broadcastBchTx = function(signedTxp, cb) {
      var config = {
        headers: {'Content-Type': 'application/payment'}
      };

      var data = {
        currency: 'BCH',
        transactions: [signedTxp.raw]
      };

      $http.post(signedTxp.payProUrl, data, config).then(function(response) {
        signedTxp.response = response.data;
        return cb(null, signedTxp);
      }, function(error) {
        return cb(error.data, null);
      });
    }

    return ret;
  });
