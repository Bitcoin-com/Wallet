'use strict';

(function(){

  angular
    .module('copayApp.services')
    .factory('txFormatService', txFormatService);

  function txFormatService(
    bwcService
    , configService
    , $filter
    , lodash
    , rateService
    , satoshiDiceService
    ) {
    var service = {
      // Variables
      Utils: bwcService.getUtils(),

      // Functions
      formatAlternativeStr: formatAlternativeStr,
      formatAmount: formatAmount,
      formatAmountStr: formatAmountStr,
      formatPendingTxps: formatPendingTxps,
      formatToUSD: formatToUSD,
      parseAmount: parseAmount,
      processTx: processTx,
      satToUnit: satToUnit,
      toFiat: toFiat
    };

    return service;


    function formatAmount(satoshis, fullPrecision) {
      var config = configService.getDefaults().wallet.settings;
      if (config.unitCode == 'sat') return satoshis;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
      var opts = {
        fullPrecision: !!fullPrecision
      };
      return parseInt(satoshis) == 0 ? '0.00' : service.Utils.formatAmount(satoshis, config.unitCode, opts);
    };

    function formatAmountStr(coin, satoshis) {
      var defaults = configService.getDefaults();
      var configCache = configService.getSync();
      var c = coin == 'btc' ? (configCache.bitcoinAlias || defaults.bitcoinAlias)
                            : (configCache.bitcoinCashAlias || defaults.bitcoinCashAlias);

      if (isNaN(satoshis)) return;
      return formatAmount(satoshis, 'full') + ' ' + (c).toUpperCase();
    };

    function toFiat(coin, satoshis, code, cb) {
      if (isNaN(satoshis)) return;
      var val = function() {
        var v1 = rateService.toFiat(satoshis, code, coin);
        if (!v1) return null;

        return v1.toFixed(2);
      };

      // Async version
      if (cb) {
        rateService.whenAvailable(function() {
          return cb(val());
        });
      } else {
        if (!rateService.isAvailable()) return null;
        return val();
      };
    };

    function formatToUSD(coin, satoshis, cb) {
      if (isNaN(satoshis)) return;
      var val = function() {
        var v1 = rateService.toFiat(satoshis, 'USD', coin);
        if (!v1) return null;

        return v1.toFixed(2);
      };

      // Async version
      if (cb) {
        rateService.whenAvailable(function() {
          return cb(val());
        });
      } else {
        if (!rateService.isAvailable()) return null;
        return val();
      };
    };

    function formatAlternativeStr(coin, satoshis, cb) {
      if (isNaN(satoshis)) return;
      var config = configService.getSync().wallet.settings;

      var val = function() {
        var fiatAmount = rateService.toFiat(satoshis, config.alternativeIsoCode, coin);
        var roundedStr = fiatAmount.toFixed(2);
        var roundedNum = parseFloat(roundedStr);
        var subcent = roundedNum === 0 && fiatAmount > 0;
        var lessThanPrefix = '';
        if (subcent) {
          roundedNum = 0.01;
          lessThanPrefix = '< ';
        }
        var v1 = $filter('formatFiatAmount')(roundedNum);
        if (!v1) return null;

        return lessThanPrefix + v1 + ' ' + config.alternativeIsoCode;
      };

      // Async version
      if (cb) {
        rateService.whenAvailable(function() {
          return cb(val());
        });
      } else {
        if (!rateService.isAvailable()) return null;
        return val();
      };
    };

    function processTx(coin, tx) {
      if (!tx || tx.action == 'invalid')
        return tx;

      // New transaction output format
      if (tx.outputs && tx.outputs.length) {

        var outputsNr = tx.outputs.length;

        if (tx.action != 'received') {
          if (outputsNr > 1) {
            tx.recipientCount = outputsNr;
          }
          tx.outputs = tx.outputs.filter(function filterOutput(output){ return !output.isMine; });
        } else {
          tx.outputs = tx.outputs.filter(function filterOutput(output){ return output.isMine; });
        }

        if(tx.outputs.length > 1){
          tx.hasMultiplesOutputs = true;
        }

        lodash.forEach(tx.outputs, function forEachOutput(output) {
          output.amountStr = formatAmountStr(coin, output.amount);
          output.alternativeAmountStr = formatAlternativeStr(coin, output.amount);
        });

        if (!tx.toAddress && tx.outputs.length > 0) {
          tx.toAddress = tx.outputs[0].address;
        }

        satoshiDiceService.processTx(tx);
      }

      tx.amountStr = formatAmountStr(coin, tx.amount);
      tx.alternativeAmountStr = formatAlternativeStr(coin, tx.amount);
      tx.feeStr = formatAmountStr(coin, tx.fee || tx.fees);

      if (tx.amountStr) {
        tx.amountValueStr = tx.amountStr.split(' ')[0];
        tx.amountUnitStr = tx.amountStr.split(' ')[1];
      }

      return tx;
    };

    function formatPendingTxps(txps) {
      $scope.pendingTxProposalsCountForUs = 0;
      var now = Math.floor(Date.now() / 1000);

      /* To test multiple outputs...
      var txp = {
        message: 'test multi-output',
        fee: 1000,
        createdOn: new Date() / 1000,
        outputs: []
      };
      function addOutput(n) {
        txp.outputs.push({
          amount: 600,
          toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
          message: 'output #' + (Number(n) + 1)
        });
      };
      lodash.times(150, addOutput);
      txps.push(txp);
      */

      lodash.each(txps, function(tx) {

        // no future transactions...
        if (tx.createdOn > now)
          tx.createdOn = now;

        tx.wallet = profileService.getWallet(tx.walletId);
        if (!tx.wallet) {
          $log.error("no wallet at txp?");
          return;
        }

        tx = txFormatService.processTx(tx.wallet.coin, tx);

        var action = lodash.find(tx.actions, {
          copayerId: tx.wallet.copayerId
        });

        if (!action && tx.status == 'pending') {
          tx.pendingForUs = true;
        }

        if (action && action.type == 'accept') {
          tx.statusForUs = 'accepted';
        } else if (action && action.type == 'reject') {
          tx.statusForUs = 'rejected';
        } else {
          tx.statusForUs = 'pending';
        }

        if (!tx.deleteLockTime)
          tx.canBeRemoved = true;
      });

      return txps;
    };

    function parseAmount(coin, amount, currency) {
      var config = configService.getSync().wallet.settings;
      var satToBtc = 1 / 100000000;
      var unitToSatoshi = config.unitToSatoshi;
      var amountUnitStr;
      var amountSat;
      var alternativeIsoCode = config.alternativeIsoCode;

      // If fiat currency
      if (currency && currency.toUpperCase() != 'BCH' && currency.toUpperCase() != 'BTC' && currency != 'sat') {
        amountUnitStr = $filter('formatFiatAmount')(amount) + ' ' + currency;
        amountSat = rateService.fromFiat(amount, currency, coin).toFixed(0);
      } else if (currency == 'sat') {
        amountSat = amount;
        amountUnitStr = formatAmountStr(coin, amountSat);
        // convert sat to BTC or BCH
        amount = (amountSat * satToBtc).toFixed(8);
        currency = (coin).toUpperCase();
      } else {
        amountSat = parseInt((amount * unitToSatoshi).toFixed(0));
        amountUnitStr = formatAmountStr(coin, amountSat);
        // convert unit to BTC or BCH
        amount = (amountSat * satToBtc).toFixed(8);
        currency = (coin).toUpperCase();
      }

      return {
        amount: amount,
        currency: currency,
        alternativeIsoCode: alternativeIsoCode,
        amountSat: amountSat,
        amountUnitStr: amountUnitStr
      };
    };

    function satToUnit(amount) {
      var config = configService.getSync().wallet.settings;
      var unitToSatoshi = config.unitToSatoshi;
      var satToUnit = 1 / unitToSatoshi;
      var unitDecimals = config.unitDecimals;
      return parseFloat((amount * satToUnit).toFixed(unitDecimals));
    };
  };

})();