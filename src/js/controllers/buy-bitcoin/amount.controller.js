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
    vm.onBuy = onBuy;

    var EXTRA_FEE_PERCENTAGE = 5;
    var MOONPAY_FIXED_FEE = 4.99;
    var MOONPAY_VARIABLE_FEE_FRACTION = 0.0499;
    var EXTRA_FEE_FRACTION = EXTRA_FEE_PERCENTAGE * 0.01;
    var exchangeRateRefreshInterval = null;

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
      vm.rateUsd = 0;
      vm.ratesError = '';

      let variables = bitAnalyticsService.getVariablesFromChannel('leanplum');
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
    $scope.$on('$ionicView.beforeLeave', _onBeforeLeave);

    // Override for testing
    //var walletId = '693923fb-0554-45a5-838f-6efa26ca917e'; // Backed Up Dev
    //var walletId = '98ada868-82bd-44cb-a334-61d0192b7a81'; // Backed Up Dev Other

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
          vm.rateUsd = rates.USD;
          vm.ratesError = '';
          _updateAmount();
          
        },
        function onGetRatesError(err) {
          console.error('Rates error.', err);
          vm.rateUsd = 0;
          vm.ratesError = err.message || '';
        }
      );
    }

    function _getWallet() {
      moonPayService.getDefaultWalletId().then(
        function onGetDefaultWalletIdSuccess(walletId) {
          console.log('default walletId:', walletId);
          if (walletId === null) {
            var wallets = profileService.getWallets({
              coin: 'bch'
            });
            console.log('wallets:', vm.wallet);
            if (wallets && wallets.length > 0) {
              vm.wallet = wallets[0];
              moonPayService.setDefaultWalletId(wallets[0].id);
            }
          } else {
            vm.wallet = profileService.getWallet(walletId);
          }
          $scope.wallet = vm.wallet;
          console.log('wallet:', $scope.wallet);
          
        }
      );
    }

    function onAmountChanged() {
      _updateAmount();
    }

    function _onBeforeEnter() {
      console.info('_onBeforeEnter()');
      _initVariables();

      configService.whenAvailable(function onConfigService(config){

        vm.displayBalanceAsFiat = config.wallet.settings.priceDisplay === 'fiat';
        console.log('displayBalanceAsFiat: ' + vm.displayBalanceAsFiat);
      });

      $timeout(function () {
        _getPaymentMethods();
        _getWallet();
        _getRates();
      }, 200);

      bitAnalyticsService.postEvent('buy_bitcoin_buy_instantly_amount_screen_open', [], ['leanplum']);
    }

    function _updateAmount() {
      console.log('_updateAmount()');
      var amount = Math.max(vm.inputAmount, 0);

      if (vm.rateUsd) {
        vm.lineItems.bchQty = amount / vm.rateUsd;
        vm.lineItems.cost = amount;
        var moonpayFee = Math.max(MOONPAY_FIXED_FEE, amount * MOONPAY_VARIABLE_FEE_FRACTION);
        var extraFee = amount * EXTRA_FEE_FRACTION;
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

      if (!vm.rateUsd) {
        message = gettextCatalog.getString("Waiting for exchange rate.");
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

      title = gettextCatalog.getString("Enter Security Code");
      message = gettextCatalog.getString("Enter the 3 digit code on the back of your card.");
      var opts = {
        inputType: 'text'
      };
      popupService.showPrompt(title, message, opts, function onSecurityCode(csc){ 

        if (!csc) {
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

          var transaction = {
            baseCurrencyAmount: vm.inputAmount
            , currencyCode: 'bch'
            , cardCvc: csc
            , cardId: vm.paymentMethod.id
            , extraFeePercentage: EXTRA_FEE_PERCENTAGE
            , walletAddress: toAddressForTransaction
          };
          moonPayService.createTransaction(transaction).then(
            function onCreateTransactionSuccess(newTransaction) {
              ongoingProcess.set('buyingBch', false);

              console.log('Transaction', newTransaction);

              var extraFee = vm.inputAmount * EXTRA_FEE_FRACTION;
              var extraFeeUsd = (vm.rateUsd > 0) ? extraFee / vm.rateUsd : 0;
              bitAnalyticsService.postEvent('bitcoin_purchased_bitcoincom_fee', [{
                'amount': extraFee,
                'price': extraFeeUsd,
                'coin': 'bch'
              }], ['leanplum']);

              var amountUsd = (vm.rateUsd > 0) ? vm.inputAmount / vm.rateUsd : 0;
              bitAnalyticsService.postEvent('bitcoin_purchased', [{
                'amount': vm.inputAmount,
                'price': amountUsd,
                'coin': 'bch'
              }], ['leanplum']);

              var moonpayFee = Math.max(MOONPAY_FIXED_FEE, vm.inputAmount * MOONPAY_VARIABLE_FEE_FRACTION);
              var moonpayFeeUsd = (vm.rateUsd > 0) ? moonpayFee / vm.rateUsd : 0;
              bitAnalyticsService.postEvent('bitcoin_purchased_provider_fee', [{
                'amount': moonpayFee,
                'price': moonpayFeeUsd,
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
      });
    }

    function _refreshTheExchangeRate(intervalCount) {
      _getRates();
    }
  }
})();
