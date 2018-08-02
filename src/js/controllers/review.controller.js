'use strict';

angular
  .module('copayApp.controllers')
  .controller('reviewController', reviewController);

function reviewController(addressbookService, configService, $ionicConfig, $log, profileService,  $scope, txFormatService) {
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
  vm.fee = {
    cryptoAmount: '',
    cryptoCurrencyCode: '',
    cryptoDescription: '',
    fiatAmount: '',
    fiatCurrency: ''
  };
  vm.fee
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
  var configFeeLevel = '';
  var coin = '';
  var originWalletId = '';
  var priceDisplayIsFiat = true;
  var satoshis = null;
  var toAddress = '';
  var destinationWalletId = '';


  $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
  $scope.$on("$ionicView.beforeLeave", onBeforeLeave);
  $scope.$on("$ionicView.enter", onEnter);



  function onBeforeEnter(event, data) {

    // Dummy values for testing
    vm.fee = {
      cryptoAmount: '0.00195823',
      cryptoCurrencyCode: 'BCH',
      cryptoDescription: 'Less than 1 cent',
      fiatAmount: '',
      fiatCurrency: ''
    };

    originWalletId = data.stateParams.fromWalletId;
    // For testing only
    //originWalletId = data.stateParams.fromWalletId || 'bf00af8f-0788-4b57-b30a-0390747407e9';
    satoshis = parseInt(data.stateParams.amount, 10);
    toAddress = data.stateParams.toAddr;
    
    var originWallet = profileService.getWallet(originWalletId);
    vm.origin.currency = originWallet.coin.toUpperCase();
    vm.origin.color = originWallet.color;
    vm.origin.name = originWallet.name;
    coin = originWallet.coin;

    configService.get(function onConfig(err, configCache) {
      if (err) {
        $log.err('Error getting config.', err);
      } else {
        config = configCache;
        priceDisplayIsFiat = config.wallet.settings.priceDisplay === 'fiat';
        vm.origin.currencyColor = originWallet.coin === 'btc' ? config.bitcoinWalletColor : config.bitcoinCashWalletColor; 
      }

      configFeeLevel = config.wallet.settings.feeLevel ? config.wallet.settings.feeLevel : 'normal';

      updateSendAmounts();
      getOriginWalletBalance(originWallet);
      handleDestinationAsAddress(toAddress, coin);
      handleDestinationAsWallet(data.stateParams.toWalletId);
    });
  }
  
  function onBeforeLeave(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  }

  function onEnter(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  };

  function getOriginWalletBalance(originWallet) {
    var balanceText = getWalletBalanceDisplayText(originWallet);
    vm.origin.balanceAmount = balanceText.amount;
    vm.origin.balanceCurrency = balanceText.currency;
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

  function handleDestinationAsAddress(address, originCoin) {
    if (!address) {
      return;
    }

    // Check if the recipient is a contact
    addressbookService.get(originCoin + address, function(err, contact) { 
      if (!err && contact) {
        console.log('destination is contact');
        handleDestinationAsContact(contact);
      } else {
        console.log('destination is address');
        vm.destination.address = address;
        vm.destination.kind = 'address';
      }
    });

  }

  function handleDestinationAsContact(contact) {
    vm.destination.kind = 'contact';
    vm.destination.name = contact.name;
    vm.destination.color = contact.coin === 'btc' ? config.bitcoinWalletColor : config.bitcoinCashWalletColor; 
    vm.destination.currency = contact.coin.toUpperCase();
    vm.destination.currencyColor = vm.destination.color;
  }

  function handleDestinationAsWallet(walletId) {
    destinationWalletId = walletId;
    if (!destinationWalletId) {
      return;
    }

    console.log('destination is wallet');
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
