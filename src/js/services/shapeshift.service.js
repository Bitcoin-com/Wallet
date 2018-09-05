'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('shapeshiftService', shapeshiftService);
  
  function shapeshiftService(shapeshiftApiService) {

    var service = {
      // Variables
      coinIn: '',
      coinOut: '',
      withdrawalAddress: '',
      returnAddress: '',
      amount: '',
      marketData: {},
      coins: {
        'BTC': {name: 'Bitcoin', symbol: 'BTC'},
        'BCH': {name: 'Bitcoin Cash', symbol: 'BCH'}
      },

      // Functions
      getMarketData: getMarketData,
      shiftIt: shiftIt
    };

    return service;

    function handleError(response, defaultMessage, cb) {
      if (!response || !response.error || !response.error.message) {
        if (cb) {
          cb(new Error(defaultMessage));
        }
      } else {
        if (cb) {
          cb(new Error(response.error.message));
        }
      }
    }

    function getMarketData(coinIn, coinOut, cb) {
      service.coinIn = coinIn;
      service.coinOut = coinOut;
      shapeshiftApiService
        .marketInfo(service.coinIn, service.coinOut)
        .then(function (response) {
          if (!response || response.error) {
            handleError(response, 'Invalid response', cb);
          } else {
            service.marketData = response;
            service.rateString = service.marketData.rate.toString() + ' ' + coinOut.toUpperCase() + '/' + coinIn.toUpperCase();
            if (cb) {
              cb(null, response);
            }
          }
        });
    }

    function shiftIt(coinIn, coinOut, withdrawalAddress, returnAddress, amount, cb) {
      // Test if the amount is correct depending on the min and max
      if (!amount || typeof amount !== 'number' || amount < service.marketData.minimum || amount > service.marketData.maxLimit) {
        cb(new Error('Invalid amount'));
      } else {
        // Init service data
        service.withdrawalAddress = withdrawalAddress;
        service.returnAddress = returnAddress;
        service.coinIn = coinIn;
        service.coinOut = coinOut;
        service.amount = amount;

        // Check the address
        shapeshiftApiService
          .ValidateAddress(withdrawalAddress, coinOut)
          .then(function onSuccess(response) {
            if (response && response.isvalid) {

              // Prepare the transaction shapeshift side
              shapeshiftApiService.NormalTx(service).then(function onResponse(response) {
                // If error, return it
                if (!response || response.error) {
                  handleError(response, 'Invalid response', cb);
                } else {
                  var txData = response;
  
                  // If the content is not that it was expected, get back an error
                  if (!txData || !txData.orderId || !txData.deposit) {
                    if (cb) {
                      cb(new Error('Invalid response'));
                    }
                  } else {
                    // Get back the data
                    service.depositInfo = txData;
                    var shapeshiftData = {
                      coinIn: coinIn,
                      coinOut: coinOut,
                      toWalletId: service.toWalletId,
                      minAmount: service.marketData.minimum,
                      maxAmount: service.marketData.maxLimit,
                      orderId: txData.orderId,
                      toAddress: txData.deposit
                    };
                    cb(null, shapeshiftData);
                  }
                }
              });
            } else if (cb) {
              cb(new Error('Invalid address or coin'));
            }
          });
      }
    }
  }
})();