'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('sideshiftService', sideshiftService);
  
  function sideshiftService(sideshiftApiService, gettextCatalog) {

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
      if (response && typeof response.error === "string") {
        cb(new Error(response.error));
      } else if (response && response.error && response.error.message) {
        cb(new Error(response.error.message));
      } else {
        cb(new Error(defaultMessage));
      }
    }

    function getMarketData(coinIn, coinOut, cb) {
      service.coinIn = coinIn;
      service.coinOut = coinOut;
      sideshiftApiService
        .marketInfo(service.coinIn, service.coinOut)
        .then(function (response) {
          if (!response || response.error) {
            handleError(response, 'Invalid response from Sideshift', cb);
          } else {
            service.marketData = response;
            service.rateString = service.marketData.rate.toString() + ' ' + coinOut.toUpperCase() + '/' + coinIn.toUpperCase();
            cb(null, response);
          }
        });
    }

    function shiftIt(coinIn, coinOut, withdrawalAddress, returnAddress, amount, cb) {
      // Test if the amount is correct depending on the min and max
      if (!amount || typeof amount !== 'number') {
        cb(new Error(gettextCatalog.getString('Amount is not defined')));
      } else if (amount < service.marketData.minimum) {
        cb(new Error(gettextCatalog.getString('Amount is below the minimun')));
      } else if (amount > service.marketData.maxLimit) {
        cb(new Error(gettextCatalog.getString('Amount is above the limit')));
      } else {
        
        // Init service data
        service.withdrawalAddress = withdrawalAddress;
        service.returnAddress = returnAddress;
        service.coinIn = coinIn;
        service.coinOut = coinOut;
        service.amount = amount;

        // Check the address
        sideshiftApiService
          .ValidateAddress(returnAddress, coinOut)
          .then(function onSuccess(response) {
            if (response && response.isvalid) {
              // Prepare the transaction sideshift side
              sideshiftApiService.NormalTx(service).then(function onResponse(response) {
                // If error, return it
                if (!response || response.error) {
                  handleError(response, gettextCatalog.getString('Invalid response from Sideshift'), cb);
                } else {
                  var txData = response;
  
                  // If the content is not that it was expected, get back an error
                  if (!txData || !txData.orderId || !txData.deposit) {
                    cb(new Error(gettextCatalog.getString('Invalid response from Sideshift')));
                  } else {
                    // Get back the data
                    service.depositInfo = txData;
                    var sideshiftData = {
                      coinIn: coinIn,
                      coinOut: coinOut,
                      toWalletId: service.toWalletId,
                      minAmount: service.marketData.minimum,
                      maxAmount: service.marketData.maxLimit,
                      orderId: txData.orderId,
                      toAddress: txData.deposit
                    };
                    cb(null, sideshiftData);
                  }
                }
              });
            } else {
              cb(new Error(gettextCatalog.getString('Invalid address')));
            }
          });
      }
    }
  }
})();