'use strict';

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

function reviewController(configService, $log, $scope, txFormatService) {
  var vm = this;
  
  vm.primaryAmount = '';
  vm.primaryCurrency = '';

  vm.secondaryAmount = '';
  vm.secondaryCurrency = '';


  var coin = '';
  //var config = null;
  var satoshis = null;

  //var priceDisplayIsFiat = true;

  $scope.$on("$ionicView.beforeEnter", onBeforeEnter);


  function onBeforeEnter(event, data) {

    satoshis = parseInt(data.stateParams.amount, 10);
    coin = data.stateParams.coin; 

    updateAmount();


    /*
    //amount.crypto.quantity = ;
    amount.crypto.currency = data.stateParams.coin.toUpperCase();
    console.log('crypto:', JSON.stringify(amount.crypto));
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
    */
  }  

  function updateAmount() {
    if (typeof satoshis !== 'number') {
      return;
    }

    var amountStr = txFormatService.formatAmountStr(coin, satoshis);
    var amountParts = amountStr.split(' ');
    vm.primaryAmount = amountParts[0];
    vm.primaryCurrency = amountParts[1];
    txFormatService.formatAlternativeStr(coin, satoshis, function(v) {
      if (!v) {
        vm.secondaryAmount = '';
        vm.secondaryCurrency = '';
        return;
      }
      vm.secondaryAmount = vm.primaryAmount;
      vm.secondaryCurrency = vm.primaryCurrency;

      var fiatParts = v.split(' ');
      vm.primaryAmount = fiatParts[0];
      vm.primaryCurrency = fiatParts[1];
    });
  }

}
