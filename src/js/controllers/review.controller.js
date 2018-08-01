'use strict';

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

function reviewController(configService, gettextCatalog, profileService, $scope, txFormatService) {
  var vm = this;
  
  vm.origin = {
    balanceAmount: '',
    balanceCurrency: '',
    color: '',
    currency: '',
    currencyColor: '',
    name: '',
  };
  vm.primaryAmount = '';
  vm.primaryCurrency = '';
  vm.secondaryAmount = '';
  vm.secondaryCurrency = '';

  var coin = '';
  var originWalletId = '';
  var priceDisplayIsFiat = true;
  var satoshis = null;
  var toAddress = '';
  var toWalletId = '';


  

  $scope.$on("$ionicView.beforeEnter", onBeforeEnter);


  function onBeforeEnter(event, data) {

    coin = data.stateParams.coin; 
    originWalletId = data.stateParams.fromWalletId;
    satoshis = parseInt(data.stateParams.amount, 10);
    toAddress = data.stateParams.toAddress;
    
    var originWallet = profileService.getWallet(originWalletId);
    vm.origin.currency = originWallet.coin.toUpperCase();
    vm.origin.color = originWallet.color;
    vm.origin.name = originWallet.name;

    configService.get(function onConfig(err, config) {
      if (err) {
        $log.err('Error getting config.', err);
      } else {
        console.log('Got config.');
        //config = configCache;
        // Use this later if have time
        priceDisplayIsFiat = config.wallet.settings.priceDisplay === 'fiat';
        vm.origin.currencyColor = originWallet.coin === 'btc' ? config.bitcoinWalletColor : config.bitcoinCashWalletColor; 
      }
      updateSendAmounts();
      getOriginWalletBalance(originWallet);
    });
  }  

  function getOriginWalletBalance(originWallet) {
    console.log('origin wallet error:', originWallet.error);
    var balanceCryptoAmount = '';
    var balanceCryptoCurrencyCode = '';
    var balanceFiatAmount = '';
    var balanceFiatCurrency = ''

    var originWalletStatus = null;
    if (originWallet.status.isValid) {
      originWalletStatus = originWallet.status;
    } else if (originWallet.cachedStatus.isValid) {
      originWalletStatus = originWallet.cachedStatus;
    } else {
      vm.origin.balanceAmount = '';
      vm.origin.balanceCurrency = '';
      return;
    }

    if (originWalletStatus) {
      var cryptoBalanceParts = originWalletStatus.spendableBalanceStr.split(' ');
      balanceCryptoAmount = cryptoBalanceParts[0];
      balanceCryptoCurrencyCode = cryptoBalanceParts.length > 1 ? cryptoBalanceParts[1] : '';

      if (originWalletStatus.alternativeBalanceAvailable) {
        balanceFiatAmount = originWalletStatus.spendableBalanceAlternative;
        balanceFiatCurrency = originWalletStatus.alternativeIsoCode;
      }
    }

    if (priceDisplayIsFiat) {
      vm.origin.balanceAmount = balanceFiatAmount ? balanceFiatAmount : balanceCryptoAmount;
      vm.origin.balanceCurrency = balanceFiatAmount ? balanceFiatCurrency : balanceCryptoCurrencyCode;
    } else {
      vm.origin.balanceAmount = balanceCryptoAmount;
      vm.origin.balanceCurrency = balanceCryptoCurrencyCode;
    }
  }

  function updateSendAmounts() {
    if (typeof satoshis !== 'number') {
      return;
    }

    var cryptoAmount = '';
    var cryptoCurrencyCode = '';
    var amountStr = txFormatService.formatAmountStr(coin, satoshis);
    if (amountStr) {
      var amountParts = amountStr.split(' ');
      cryptoAmount = amountParts[0];
      cryptoCurrencyCode = amountParts.length > 1 ? amountParts[1] : '';
    }
    // Want to avoid flashing of amount strings so do all formatting after this has returned.
    txFormatService.formatAlternativeStr(coin, satoshis, function(v) {
      if (!v) {
        vm.primaryAmount = cryptoAmount;
        vm.primaryCurrency = cryptoCurrencyCode;
        vm.secondaryAmount = '';
        vm.secondaryCurrency = '';
        return;
      }
      vm.secondaryAmount = vm.primaryAmount;
      vm.secondaryCurrency = vm.primaryCurrency;

      var fiatParts = v.split(' ');
      var fiatAmount = fiatParts[0];
      var fiatCurrency = fiatParts.length > 1 ? fiatParts[1] : '';

      if (priceDisplayIsFiat) {
        vm.primaryAmount = fiatAmount;
        vm.primaryCurrency = fiatCurrency;
        vm.secondaryAmount = cryptoAmount;
        vm.secondaryCurrency = cryptoCurrencyCode;
      } else {
        vm.primaryAmount = cryptoAmount;
        vm.primaryCurrency = cryptoCurrencyCode;
        vm.secondaryAmount = fiatAmount;
        vm.secondaryCurrency = fiatCurrency;
      }
    });
  }

}
