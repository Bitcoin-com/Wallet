'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountController', amountController);

  function amountController(
    configService, 
    gettextCatalog,
    $interval,
    $ionicHistory,
    $log,
    moonPayService, 
    ongoingProcess,
    popupService,
    profileService, 
    $scope
    ) {

    var vm = this;
    vm.onAmountChanged = onAmountChanged;
    vm.onBuy = onBuy;

    var exchangeRateRefreshInterval = null;
    var walletId = '';

    function _initVariables() {
      vm.displayBalanceAsFiat = true;
      vm.inputAmount = 0;
      vm.lineItems = {
        bchQty: 0,
        cost: 0,
        processingFee: 10,
        total: 0
      };
      vm.paymentMethod = null;
      vm.paymentMethodsAreLoading = true;
      vm.rateUsd = 0;
      /*
      vm.paymentMethod = {
        name: 'Visa',
        partialCardNumber: '••• 2244',
        expiryDate: '12/21'
      };
      */
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
          console.log('cards:', cards);
          moonPayService.getDefaultCardId().then(
            function onGetDefaultCardIdSuccess(cardId) {
              if (cardId == null && cards && cards.length > 0) {
                vm.paymentMethod = cards[0];
                moonPayService.setDefaultCardId(cards[0].id);
                console.log(cards[0].id)
              } else {
                console.log(cardId)
                for (var i=0; i<cards.length; ++i) {
                  if (cards[i].id == cardId) {
                    vm.paymentMethod = cards[i];
                    break;
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
          _updateAmount();
          
        },
        function onGetRatesError(err) {
          console.error('Rates error.', err);
          vm.rateUsd = 0;
          // TODO: Display error
        }
      );
    }

    function _getWallet() {
      
      if (walletId) {
        console.log('walletId: "' + walletId +'"');
        vm.wallet = profileService.getWallet(walletId);
      } else {
        var walletOpts = {
          coin: 'bch'
        };
        var wallets = profileService.getWallets(walletOpts);
        console.log('wallet count: ' + wallets.length);
        if (wallets.length > 0) {
          vm.wallet = wallets[0];
        } else {
          vm.wallet = null;
        }
      }
      $scope.wallet = vm.wallet;
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

      _getWallet();
      _getPaymentMethods();
      _getRates();
    }

    function _updateAmount() {
      console.log('_updateAmount()');
      var amount = Math.max(vm.inputAmount, 0);

      if (vm.rateUsd) {
        vm.lineItems.bchQty = amount / vm.rateUsd;
        vm.lineItems.cost = amount;
        vm.lineItems.processingFee = 10; // TODO: Update this with the correct amount
        vm.lineItems.total = amount + vm.lineItems.processingFee;
      }

    }

    function _onBeforeLeave() {
      if (exchangeRateRefreshInterval) {
        $interval.cancel(exchangeRateRefreshInterval);
      }
    }
    

    function onBuy() {
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
              // TODO: Go to add card screen.
            }
          }
        );
        return;
      }

      ongoingProcess.set('buyingBch', true);
      // TODO: Create transaction
      var transaction = {};
      moonPayService.createTransaction(transaction).then(
        function onCreateTransactionSuccess(newTransaction) {
          ongoingProcess.set('buyingBch', false);
          // TODO: Redirect to success screen
        },
        function onCreateTransactionError(err) {
          ongoingProcess.set('buyingBch', false);

          title = gettextCatalog.getString('Purchase Failed');
          message = err.message || gettextCatalog.getString('Failed to create transaction.');
          popupService.showAlert(title, message);
        }
      );
    }

    function _refreshTheExchangeRate(intervalCount) {
      _getRates();
    }
  }
})();
