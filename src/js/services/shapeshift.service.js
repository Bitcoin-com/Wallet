'use strict';

angular.module('bitcoincom.services').factory('shapeshiftService', function ($http, $interval, $log, lodash, moment, ongoingProcess, shapeshiftApiService, storageService, configService, incomingDataService, platformInfo, servicesService) {
  var root = {};
  root.ShiftState = 'Shift';
  root.coinIn = '';
  root.coinOut = '';
  root.withdrawalAddress = '';
  root.returnAddress = '';
  root.amount = '';
  root.marketData = {};

  root.getMarketData = function (coinIn, coinOut, cb) {
    root.coinIn = coinIn;
    root.coinOut = coinOut;
    if (root.coinIn !== undefined && root.coinOut !== undefined){
      shapeshiftApiService
        .marketInfo(root.coinIn, root.coinOut)
        .then(function (marketData) {
          root.marketData = marketData;
          root.rateString = root.marketData.rate.toString() + ' ' + coinOut.toUpperCase() + '/' + coinIn.toUpperCase();
          if (cb) {
            cb(marketData);
          }
        });
    }
  };

  root.coins = {
    'BTC': {name: 'Bitcoin', symbol: 'BTC'},
    'BCH': {name: 'Bitcoin Cash', symbol: 'BCH'}
  };

  root.shiftIt = function (coinIn, coinOut, withdrawalAddress, returnAddress, cb) {
    ongoingProcess.set('connectingShapeshift', true);
    root.withdrawalAddress = withdrawalAddress;
    root.returnAddress = returnAddress;
    root.coinIn = coinIn;
    root.coinOut = coinOut;
    shapeshiftApiService.ValidateAddress(withdrawalAddress, coinOut).then(function onSuccess(data) {
      shapeshiftApiService.FixedAmountTx(root).then(function onSuccess(txData) {
        if (txData.err) {
          cb(txData.err);
        } else {
          if (!txData.orderId || !txData.deposit) {
            cb(new Error('Invalid response'));
          } else {
            var coinPair = txData.pair.split('_');
            txData.depositType = coinPair[0].toUpperCase();
            txData.withdrawalType = coinPair[1].toUpperCase();
            coin = root.coins[txData.depositType].name.toLowerCase();
            txData.depositQR = coin + ":" + txData.deposit + "?amount=" + txData.depositAmount;
            root.txFixedPending = true;
            root.depositInfo = txData;
            var shapeshiftData = {
              coinIn: coinIn,
              coinOut: coinOut,
              toWalletId: root.toWalletId,
              minAmount: root.marketData.minimum,
              maxAmount: root.marketData.maxLimit,
              orderId: txData.orderId,
              toAddress: txData.deposit
            };

            cb(null, shapeshiftData);
          }
        }
      }, function onError(err) {
        cb(err);
      });
    }, function onError(err) {
      cb(err);
    });
  };
  return root;
});
