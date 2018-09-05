'use strict';

angular.module('bitcoincom.services').factory('shapeshiftService', function (shapeshiftApiService) {
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
    shapeshiftApiService
      .marketInfo(root.coinIn, root.coinOut)
      .then(function (marketData) {
        root.marketData = marketData;
        root.rateString = root.marketData.rate.toString() + ' ' + coinOut.toUpperCase() + '/' + coinIn.toUpperCase();
        if (cb) {
          cb(marketData);
        }
      });
  };

  root.coins = {
    'BTC': {name: 'Bitcoin', symbol: 'BTC'},
    'BCH': {name: 'Bitcoin Cash', symbol: 'BCH'}
  };

  root.shiftIt = function (coinIn, coinOut, withdrawalAddress, returnAddress, amount, cb) {
    if (typeof amount !== 'number' || amount < root.marketData.minimum || amount > root.marketData.maxLimit) {
      var err = new Error('Invalid amount');
      cb(err);
    } else {
      root.withdrawalAddress = withdrawalAddress;
      root.returnAddress = returnAddress;
      root.coinIn = coinIn;
      root.coinOut = coinOut;
      root.amount = amount;
      shapeshiftApiService.ValidateAddress(withdrawalAddress, coinOut).then(function onSuccess(data) {
        if (data && data.isvalid) {
          shapeshiftApiService.NormalTx(root).then(function onResponse(data) {
            var txData = data;
            if (!txData || !txData.orderId || !txData.deposit) {
              cb(new Error('Invalid response'));
            } else {
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
          });
        } else {
          var err = new Error('Invalid address or coin');
          cb(err);
        }
      });
    }
  };
  return root;
});
