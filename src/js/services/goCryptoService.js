'use strict';

(function() {

  angular.module('bitcoincom.services')
    .factory('goCryptoService', GoCryptoService);

  function GoCryptoService($log, $http, $timeout, $q, gettextCatalog) {
    var GOCRYPTO_PAYMENT_STATUSES = Object.freeze({
      'OPENED': 0,
      'IN_PAYMENT': 1,
      'PAID': 2,
      'PROCESSING': 3,
      'AUTO_CLOSED': 4,
      'FAILED': 5,
      'NOT_VALID': 6,
      'REFUND': 7
    });
    var GOCRYPTO_CURRENCIES = Object.freeze({
      'BITCOIN_CORE': 2,
      'BITCOIN_CASH': 7,
    });
    var GOCRYPTO_URL_REGEX = /^https?:\/\/(www\.)?gocrypto\.com/;
    var GOCRYPTO_BACKWARD_COMPATIBILITY_URL_REGEX = /^https?:\/\/(www\.)?elipay\.com/;
    var GOCRYPTO_ENDPOINT_URL = 'https://api.gocrypto.com/publicapi/payment?merchant_id=';
    var GOCRYPTO_AUTH_HEADERS = {'Authorization': 'publicauth 6a15c40d-c3fa-41ac-a7ae-b089e95cf8fc'};

    var req = {
      method: 'GET',
      url: null,
      headers: GOCRYPTO_AUTH_HEADERS,
    };

    var service = {
      // Functions
      checkAndUpdateTx: checkAndUpdateTx,
      validateTx: validateTx,
      encodePaymentUrl: encodePaymentUrl,
      decodePaymentUrl: decodePaymentUrl,
    };

    return service;

    function checkAndUpdateTx(data) {
      $log.debug('Checking if scanned data has GoCrypto payload...');
      var defer = $q.defer();

      if (typeof data !== 'string') {
        defer.resolve(data);
      }

      var trimmedUrl = data.trim();
      if (GOCRYPTO_URL_REGEX.test(trimmedUrl) || GOCRYPTO_BACKWARD_COMPATIBILITY_URL_REGEX.test(trimmedUrl)) {
        req.url = GOCRYPTO_ENDPOINT_URL + data;

        $http(req).then(function(response) {
          if (response.status === 200) {
            $log.info('Successfully received GoCrypto payment data');

            var payment = response.data;

            var paymentOption = null;
            for (var i=0; i<payment['payment_options'].length; i++) {
              var option = payment['payment_options'][i];
              if (option['currency'] === GOCRYPTO_CURRENCIES['BITCOIN_CASH']) {
                paymentOption = option;
                break;
              }
            }

            validatePaymentExpiryDate(payment['expires_at'], defer);
            validatePaymentStatus(payment['status'], defer);
            validatePaymentOption(paymentOption, defer);

            $log.debug(paymentOption);

            var result = formatPaymentData(
              paymentOption['wallet_address'],
              paymentOption['amount'],
              trimmedUrl,
              payment['expires_at']
            );
            defer.resolve(result);
          } else {
            raiseError(
              defer,
              'Failed to get GoCrypto payment data.',
              'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
            );
          }
        }, function(error) {
          raiseError(
            defer,
            'An error occurred while trying to get GoCrypto payment data.',
            'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
          );
        });
      } else {
        defer.resolve(data);
      }

      return defer.promise;
    }

    function validateTx(data) {
      $log.debug('Validating GoCrypto payment...');
      var defer = $q.defer();

      if (typeof data !== 'string') {
        defer.resolve(data);
      }

      var trimmedUrl = data.trim();
      if (GOCRYPTO_URL_REGEX.test(trimmedUrl) || GOCRYPTO_BACKWARD_COMPATIBILITY_URL_REGEX.test(trimmedUrl)) {
        req.url = GOCRYPTO_ENDPOINT_URL + data;

        $http(req).then(function(response) {
          if (response.status === 200) {
            $log.info('Successfully received GoCrypto payment data');

            var payment = response.data;

            validatePaymentExpiryDate(payment['expires_at'], defer);
            validatePaymentStatus(payment['status'], defer);

            defer.resolve(true);
          } else {
            raiseError(
              defer,
              'Failed to get GoCrypto payment data.',
              'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
            );
          }
        }, function(error) {
          raiseError(
            defer,
            'An error occurred while trying to get GoCrypto payment data.',
            'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
          );
        });
      } else {
        defer.resolve(data);
      }

      return defer.promise;
    }

    // Validators

    function validatePaymentExpiryDate(expiryDate, defer) {
      var expiry_date = new Date(expiryDate);
      if (expiry_date < Date.now()) {
        raiseError(
          defer,
          'GoCrypto payment expired.',
          'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
        );
      }
    }

    function validatePaymentStatus(paymentStatus, defer) {
      if (paymentStatus !== GOCRYPTO_PAYMENT_STATUSES['IN_PAYMENT']) {
        raiseError(
          defer,
          'Incorrect GoCrypto payment.',
          'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
        );
      }
    }

    function validatePaymentOption(paymentOption, defer) {
      if (paymentOption == null) {
        raiseError(
          defer,
          'Could not found GoCrypto payment option.',
          'An error occurred while trying to retrieve GoCrypto POS verification data. Please try again.'
        );
      }
    }

    // Helpers

    function encodePaymentUrl(url) {
      return btoa(url).replace(/=/g, '#');
    }

    function decodePaymentUrl(payload) {
      return atob(payload.replace(/#/g, '='));
    }

    function formatPaymentData(address, amount, url, expiryDateStr) {
      var expiryDate = new Date(expiryDateStr).getTime();
      return 'bitcoincash:' + address + '?amount=' + amount + '&third_party_id=gocrypto&payment_url=' + encodePaymentUrl(url) + '&expires_at=' + expiryDate;
    }

    function raiseError(deferred, log, message) {
      $log.error(log);
      deferred.reject(gettextCatalog.getString(message));
    }
  }
})();
