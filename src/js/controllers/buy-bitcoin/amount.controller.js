'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountController', amountController);

  function amountController(
    configService , gettextCatalog, ongoingProcess, popupService, bitcoinCashJsService
    , moonPayService, profileService, walletService, bitAnalyticsService
    , $interval, $ionicHistory, $scope, $state, $timeout
  ) {

    var vm = this;
    vm.onAmountChanged = onAmountChanged;
    vm.onAmountFocus = onAmountFocus;
    vm.onBuy = onBuy;

    var EXTRA_FEE_PERCENTAGE = 5;
    var MOONPAY_FIXED_FEE = 4.99;
    var MOONPAY_VARIABLE_FEE_FRACTION = 0.0499;
    var EXTRA_FEE_FRACTION = EXTRA_FEE_PERCENTAGE * 0.01;
    var amountInputElement = null;
    var exchangeRateRefreshInterval = null;
    var prohibitedCharactersRegex = /[^0-9\.]+/;
    
    function _initVariables() {
      vm.displayBalanceAsFiat = true;
      vm.inputAmount = 0;
      vm.lineItems = {
        bchQty: 0,
        cost: 0,
        processingFee: 0,
        total: 0
      };
      vm.paymentMethod = null;
      vm.paymentMethodsAreLoading = true;
      vm.rateEur = 0;
      vm.rateUsd = 0;
      vm.ratesError = '';
      vm.walletsAreLoading = true;


      
      var variables = bitAnalyticsService.getVariablesFromChannel('leanplum');
      if (variables && variables.bitcoincom_fee) {
        EXTRA_FEE_PERCENTAGE = variables.bitcoincom_fee;
      }
      

      if (exchangeRateRefreshInterval) {
        $interval.cancel(exchangeRateRefreshInterval);
      }
      exchangeRateRefreshInterval = $interval(_refreshTheExchangeRate, 5000);
      vm.wallet = null;
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);
    $scope.$on('$ionicView.afterEnter', _onAfterEnter);
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    function _getPaymentMethods() {
      moonPayService.getCards().then(
        function onGetCardsSuccess(cards) {
          moonPayService.getDefaultCardId().then(
            function onGetDefaultCardIdSuccess(cardId) {
              if (cards && cards.length > 0) {
                if (cardId == null) {
                  vm.paymentMethod = cards[0];
                  moonPayService.setDefaultCardId(cards[0].id);
                } else {
                  var cardWasFound = false;
                  for (var i = 0; i < cards.length; ++i) {
                    if (cards[i].id === cardId) {
                      cardWasFound = true;
                      vm.paymentMethod = cards[i];
                      break;
                    }
                  }
                  if (!cardWasFound) {
                    vm.paymentMethod = cards[0];
                    moonPayService.setDefaultCardId(cards[0].id);
                  }
                }
              }
            }
          );
          vm.paymentMethodsAreLoading = false;
        },
        function onGetCardsError(err) {
          var title = gettextCatalog.getString('Error Getting Payment Methods');
          var message = err.message || gettextCatalog.getString('An error occurred when getting your payment methods.');
          var okText = gettextCatalog.getString('Go Back');
          popupService.showAlert(title, message, 
            function onAlertDismissed() {
              $ionicHistory.goBack();
            }, 
            okText
          );
        }
      );
    }

    function _getRates() {

      moonPayService.getRates('bch').then(
        function onGetRatesSuccess(rates) {
          console.log('Rates:', rates);
          vm.rateEur = rates.EUR;
          vm.rateUsd = rates.USD;
          vm.ratesError = '';
          _updateAmount();
          
        },
        function onGetRatesError(err) {
          console.error('Rates error.', err);
          vm.rateEur = 0;
          vm.rateUsd = 0;
          vm.ratesError = err.message || '';
        }
      );
    }

    function _getWallet() {
      moonPayService.getDefaultWalletId().then(
        function onGetDefaultWalletIdSuccess(walletId) {
          console.log('default walletId: "' + walletId + '"');
          if (walletId) {
            vm.wallet = profileService.getWallet(walletId);
          } else{
            var wallets = profileService.getWallets({
              coin: 'bch'
            });
            console.log('wallets:', vm.wallets);
            if (wallets && wallets.length > 0) {
              vm.wallet = wallets[0];
              moonPayService.setDefaultWalletId(wallets[0].id);
            }
          }
          $scope.wallet = vm.wallet;
          console.log('wallet:', $scope.wallet);
          vm.walletsAreLoading = false;
        }, function onGetDefaultWalletIdError() {
          vm.walletsAreLoading = false;
        }
      );
    }

    function _onAfterEnter() {
      $timeout(function () {
        _getPaymentMethods();
        _getWallet();
        _getRates();
      }, 200);

      var inputs = angular.element(document).find("input");
      var inputsLen = inputs.length;
      var input = null;
      for (var i = 0; i < inputsLen; i++) {
        input = inputs[i];
        if (input.id === 'amount-input') {
          amountInputElement = input;
          break;
        }
      }
    }

    function onAmountChanged() {
      _updateAmount();
    }

    function onAmountFocus() {

      var amount = _sanitisedAmountNumber(amountInputElement.value);
      if (!amount) {
        amountInputElement.value = '';
      }
      
    }

    function _onBeforeEnter() {
      console.info('_onBeforeEnter()');
      _initVariables();

      configService.whenAvailable(function onConfigService(config){
        vm.displayBalanceAsFiat = config.wallet.settings.priceDisplay === 'fiat';
        console.log('displayBalanceAsFiat: ' + vm.displayBalanceAsFiat);
      });

      bitAnalyticsService.postEvent('buy_bitcoin_buy_instantly_amount_screen_open', [], ['leanplum']);
    }

    function _updateAmount() {
      console.log('_updateAmount()');
      var amountRaw = amountInputElement.value;
      console.log('amountRaw: \"' + amountRaw + '".');

      amountInputElement.value =  amountRaw.replace(prohibitedCharactersRegex,'');

      var amount = _sanitisedAmountNumber(amountRaw);

      if (vm.rateEur) {
        vm.lineItems.bchQty = amount / vm.rateEur;
        vm.lineItems.cost = amount;
        var moonpayFee = amount > 0 ? Math.max(MOONPAY_FIXED_FEE, amount * MOONPAY_VARIABLE_FEE_FRACTION) : 0;
        var extraFee = amount > 0 ? amount * EXTRA_FEE_FRACTION : 0;
        vm.lineItems.processingFee = moonpayFee + extraFee;
        vm.lineItems.total = amount + vm.lineItems.processingFee;
      }
    }

    function _onBeforeLeave() {
      if (exchangeRateRefreshInterval) {
        $interval.cancel(exchangeRateRefreshInterval);
      }

      bitAnalyticsService.postEvent('buy_bitcoin_buy_instantly_amount_screen_close', [], ['leanplum']);
    }
    

    function onBuy() {
      bitAnalyticsService.postEvent('buy_bitcoin_buy_instantly_amount_screen_tap_on_buy', [{
        'amount': vm.inputAmount
      }], ['leanplum']);

      var title = gettextCatalog.getString('Unable to Purchase');
      var message = '';
      var okText = '';
      var cancelText = '';

      var amountBch = _sanitisedAmountNumber(vm.inputAmount.toString());
      if (!amountBch) {
        message = gettextCatalog.getString('Amount must be a positive number.');
        popupService.showAlert(title, message);
        return;
      }

      if (!vm.rateEur) {
        message = gettextCatalog.getString('Waiting for exchange rate.');
        popupService.showAlert(title, message);
        return;
      }

      if (!vm.wallet) {
        message = gettextCatalog.getString('You must have a Bitcoin Cash (BCH) wallet to deposit in to.');
        popupService.showAlert(title, message);
        return;
      }

      if (!vm.paymentMethod) {
        message = gettextCatalog.getString('You must add a credit or debit card to buy Bitcoin Cash (BCH).');
        okText = gettextCatalog.getString('Add Card');
        cancelText = gettextCatalog.getString('Cancel');
        popupService.showConfirm(title, message, okText, cancelText,
          function onDismissed(ok) {
            if (ok) {
              $state.go('tabs.buybitcoin-add-card-form');
            }
          }
        );
        return;
      }

      ongoingProcess.set('buyingBch', true);

      walletService.getAddress(vm.wallet, true, function onGetWalletAddress(err, toAddress) {
        if (err) {
          ongoingProcess.set('buyingBch', false);
          console.log(err);

          message = err.message || gettext.getString('Could not create address');
          popupService.showAlert(title, message);
          return;
        }

        var toCashAddress = bitcoinCashJsService.translateAddresses(toAddress).cashaddr;
        var addressParts = toCashAddress.split(':');
        var toAddressForTransaction = addressParts.length === 2 ? addressParts[1] : toCashAddress;

        // Override to testnet address for testing
        //  toAddressForTransaction = 'qpa09d2upua473rm2chjxev3uxlrgpnavux2q8avqc';

        var transaction = {
          baseCurrencyAmount: amountBch
          , currencyCode: 'bch'
          , cardId: vm.paymentMethod.id
          , extraFeePercentage: EXTRA_FEE_PERCENTAGE
          , walletAddress: toAddressForTransaction
        };
        moonPayService.createTransaction(transaction).then(
          function onCreateTransactionSuccess(newTransaction) {
            ongoingProcess.set('buyingBch', false);

            console.log('Transaction', newTransaction);

            var extraFee = amountBch * EXTRA_FEE_FRACTION;
            var extraFeeEur = (vm.rateEur > 0) ? extraFee / vm.rateEur : 0;
            bitAnalyticsService.postEvent('bitcoin_purchased_bitcoincom_fee', [{
              'amount': extraFee,
              'price': extraFeeEur,
              'coin': 'bch'
            }], ['leanplum']);

            var amountEur = (vm.rateEur > 0) ? amountBch / vm.rateEur : 0;
            bitAnalyticsService.postEvent('bitcoin_purchased', [{
              'amount': amountBch,
              'price': amountEur,
              'coin': 'bch'
            }], ['leanplum']);

            var moonpayFee = Math.max(MOONPAY_FIXED_FEE, amountBch * MOONPAY_VARIABLE_FEE_FRACTION);
            var moonpayFeeEur = (vm.rateEur > 0) ? moonpayFee / vm.rateEur : 0;
            bitAnalyticsService.postEvent('bitcoin_purchased_provider_fee', [{
              'amount': moonpayFee,
              'price': moonpayFeeEur,
              'coin': 'bch'
            }], ['leanplum']);

            $ionicHistory.nextViewOptions({
              disableAnimation: true,
              historyRoot: true
            });
            $state.go('tabs.home').then(
              function() {
                $state.go('tabs.buybitcoin').then(
                  function () {
                    $state.go('tabs.buybitcoin-success', { 
                      moonpayTxId: newTransaction.id,
                      purchasedAmount: vm.lineItems.cost
                    });
                  }
                );
              }
            );

          },
          function onCreateTransactionError(err) {
            ongoingProcess.set('buyingBch', false);

            title = gettextCatalog.getString('Purchase Failed');
            message = err.message || gettextCatalog.getString('Failed to create transaction.');
            popupService.showAlert(title, message);
          }
        );
      });
    }

    function _refreshTheExchangeRate(intervalCount) {
      _getRates();
    }

    function _sanitisedAmountNumber(amountString) {
      var cleanAmountString = amountString.replace(prohibitedCharactersRegex,'');
      var amountNumber = parseFloat(cleanAmountString);
      amountNumber = isNaN(amountNumber) ? 0 : Math.max(0, amountNumber);
      return parseFloat(amountNumber.toFixed(2));
    }
  }
})();
