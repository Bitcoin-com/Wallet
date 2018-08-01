'use strict';

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

function reviewController(configService, $log, $scope,) {
  var vm = this;
  
  vm.primaryAmount = '0';
  vm.primaryCurrency = '';

  vm.secondaryAmount = '';
  vm.secondaryCurrency = '';

  var config;
  var amount = {
    crypto: {
      quantity: 0,
      currency: ''
    },
    fiat: null
  };
  var priceDisplayIsFiat = true;

  $scope.$on("$ionicView.beforeEnter", onBeforeEnter);


  function onBeforeEnter(event, data) {

    amount.crypto.quantity = data.stateParams.toAmount;
    amount.crypto.currency = data.stateParams.coin.toUpperCase();
    console.log('cryptoAmount', cryptoAmount);
    //vm.amount = cryptoAmount.toFixed(8);
    console.log('vm.amount:', vm.amount);

    vm.secondaryAmount = amount.crypto.quantity;
    vm.secondaryCurrency = amount.crypto.currency;

    configService.get(function onConfig(err, configCache) {
      if (err) {
        $log.err('Error getting config.', err);
        return;
      } else {
        console.log('Got config.');
        config = configCache;
        // Use this later if have time
        priceDisplayIsFiat = config.wallet.settings.priceDisplay === 'fiat';
      }
    });
  }  

}
