'use strict';

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

function reviewController(configService, gettextCatalog, profileService, $scope, txFormatService) {
  var vm = this;
  
  vm.destination = {
    address: '',
    balanceAmount: '',
    balanceCurrency: '',
    coin: '',
    color: '',
    currency: '',
    currencyColor: '',
    kind: '', // 'address', 'contact', 'wallet'
    name: ''
  };
  vm.feeCrypto = '';
  vm.feeFiat = '';
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

  var config = null;
  var coin = '';
  var originWalletId = '';
  var priceDisplayIsFiat = true;
  var satoshis = null;
  var toAddress = '';
  var destinationWalletId = '';


  

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

    configService.get(function onConfig(err, configCache) {
      if (err) {
        $log.err('Error getting config.', err);
      } else {
        config = configCache;
        priceDisplayIsFiat = config.wallet.settings.priceDisplay === 'fiat';
        vm.origin.currencyColor = originWallet.coin === 'btc' ? config.bitcoinWalletColor : config.bitcoinCashWalletColor; 
      }
      updateSendAmounts();
      getOriginWalletBalance(originWallet);
      handleDestinationAsWallet(data.stateParams.toWalletId);
    });
  }  

  function getOriginWalletBalance(originWallet) {
    var balanceText = getWalletBalanceDisplayText(originWallet);
    vm.origin.balanceAmount = balanceText.amount;
    vm.origin.balanceCurrecny = balanceText.currency;
  }

  function getWalletBalanceDisplayText(wallet) {
    var balanceCryptoAmount = '';
    var balanceCryptoCurrencyCode = '';
    var balanceFiatAmount = '';
    var balanceFiatCurrency = ''
    var displayAmount = '';
    var displayCurrency = '';

    var walletStatus = null;
    if (wallet.status.isValid) {
      walletStatus = wallet.status;
    } else if (wallet.cachedStatus.isValid) {
      walletStatus = wallet.cachedStatus;
    }

    if (walletStatus) {
      var cryptoBalanceParts = walletStatus.spendableBalanceStr.split(' ');
      balanceCryptoAmount = cryptoBalanceParts[0];
      balanceCryptoCurrencyCode = cryptoBalanceParts.length > 1 ? cryptoBalanceParts[1] : '';

      if (walletStatus.alternativeBalanceAvailable) {
        balanceFiatAmount = walletStatus.spendableBalanceAlternative;
        balanceFiatCurrency = walletStatus.alternativeIsoCode;
      }
    }

    if (priceDisplayIsFiat) {
      displayAmount = balanceFiatAmount ? balanceFiatAmount : balanceCryptoAmount;
      displayCurrency = balanceFiatAmount ? balanceFiatCurrency : balanceCryptoCurrencyCode;
    } else {
      displayAmount = balanceCryptoAmount;
      displayCurrency = balanceCryptoCurrencyCode;
    }

    return {
      amount: displayAmount,
      currency: displayCurrency
    };
  }

  function handleDestinationAsWallet(walletId) {
    destinationWalletId = walletId;
    if (destinationWalletId) {
      var destinationWallet = profileService.getWallet(destinationWalletId);
      vm.destination.coin = destinationWallet.coin;
      vm.destination.color = destinationWallet.color;
      vm.destination.currency = destinationWallet.coin.toUpperCase();
      vm.destination.kind = 'wallet';
      vm.destination.name = destinationWallet.name;

      if (config) {
        vm.destination.currencyColor = vm.destination.coin === 'btc' ? config.bitcoinWalletColor : config.bitcoinCashWalletColor; 
      }

      var balanceText = getWalletBalanceDisplayText(destinationWallet);
      vm.destination.balanceAmount = balanceText.amount;
      vm.destination.balanceCurrency = balanceText.currency;
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
