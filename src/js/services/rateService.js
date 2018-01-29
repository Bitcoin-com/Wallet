'use strict';

angular.module('copayApp.services').factory('rateService', function($http, lodash) {
  var SAT_TO_BTC = 1 / 1e8;
  var BTC_TO_SAT = 1e8;
  var UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  var UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  var _isAvailable = false;
  var _rates = {};
  var _alternatives = [];
  var _bchRate = null;
  var _queued = [];

  var root = {};

  root.updateRates = function() {
    var backoffSeconds = 5;
    var rateServiceUrl = 'https://www.bitcoin.com/special/rates.json';

    function getRates(cb, tries) {
      tries = tries || 0;
      if (tries > 5) return cb('could not get rates');

      $http.get(rateServiceUrl).success(function(res) {
        lodash.each(res, function(currency) {
          _rates[currency.code] = currency.rate;
          _alternatives.push({
            name: currency.name,
            isoCode: currency.code,
            rate: currency.rate
          });
          if (currency.code == 'BCH') {
            _bchRate = currency.rate;
          }
        });
        return cb();
      }).error(function() {
        setTimeout(function() {
          backoffSeconds *= 1.5;
          getRates(cb, tries++)
        }, backoffSeconds * 1000)
        return;
      });
    }

    getRates(function(err) {
      if (err) return;
      _isAvailable = true;
      lodash.each(_queued, function(callback) {
        setTimeout(callback, 1);
      });
    });
  }

  root.getRate = function(code, chain) {
    var rate = _rates[code];
    return chain == 'bch' ? _bchRate * rate : rate;
  }

  root.getAlternatives = function() {
    return _alternatives;
  }

  root.isAvailable = function() {
    return _isAvailable;
  }

  root.whenAvailable = function(callback) {
    if (root.isAvailable()) {
      setTimeout(callback, 10);
    } else {
      _queued.push(callback);
    }
  }

  root.toFiat = function(satoshis, code, chain) {
    if (!root.isAvailable()) {
      return null;
    }

    return satoshis * SAT_TO_BTC * root.getRate(code, chain);
  }

  root.fromFiat = function(amount, code, chain) {
    if (!root.isAvailable()) {
      return null;
    }
    return amount / root.getRate(code, chain) * BTC_TO_SAT;
  };

  root.listAlternatives = function(sort) {
    if (!root.isAvailable()) {
      return [];
    }

    var alternatives = lodash.map(root.getAlternatives(), function(item) {
      return {
        name: item.name,
        isoCode: item.isoCode
      }
    });
    if (sort) {
      alternatives.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return lodash.uniq(alternatives, 'isoCode');
  };

  root.updateRates();
  setInterval(root.updateRates, 5 * 60 * 1000);
  return root;
});
