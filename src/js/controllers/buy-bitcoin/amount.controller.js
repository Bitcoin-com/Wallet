'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountController', amountController);

  function amountController(
    configService, 
    gettextCatalog,
    $ionicHistory,
    $log,
    moonPayService, 
    onGoingService,
    popupService,
    profileService, 
    $scope
    ) {

    var vm = this;
    vm.onAmountChanged = onAmountChanged;
    vm.onBuy = onBuy;

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
      vm.paymentMethodsAreLoading = true;
      vm.rateUsd = 0;
      /*
      vm.paymentMethod = {
        name: 'Visa',
        partialCardNumber: '••• 2244',
        expiryDate: '12/21'
      };
      */
      vm.wallet = null;
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    // Override for testing
    //var walletId = '693923fb-0554-45a5-838f-6efa26ca917e'; // Backed Up Dev
    //var walletId = '98ada868-82bd-44cb-a334-61d0192b7a81'; // Backed Up Dev Other

    function _getPaymentMethods() {
      moonPayService.getCards().then(
        function onGetCardsSuccess(cards) {
          vm.paymentMethodsAreLoading = false;
          console.log('cards:', cards);
          if (cards && cards.length > 0) {

            

          }
          
          // else case is handled in view
            /*vm.paymentMethod = {
              name: 'Visa',
              partialCardNumber: '••• 2244',
              expiryDate: '12/21'
            };
            return;*/

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
      console.warn('_getRates()');

      moonPayService.getRates('bch').then(
        function onGetRatesSuccess(rates) {
          console.log('Rates:', rates);
          vm.rateUsd = rates.USD;
          _updateAmount();
          
        },
        function onGetRatesError(err) {
          console.error('Rates error.', err);
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

    function onAmountChanged() {
      _updateAmount();
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

      onGoingService.set('buyingBch', true);
      // TODO: Create transaction
      var transaction = {};
      moonPayService.createTransaction(transaction).then(
        function onCreateTransactionSuccess(newTransaction) {
          onGoingService.set('buyingBch', false);
          // TODO: Redirect to success screen
        },
        function onCreateTransactionError(err) {
          onGoingService.set('buyingBch', false);

          title = gettextCatalog.getString('Purchase Failed');
          message = err.message || gettextCatalog.getString('Failed to create transaction.');
          popupService.showAlert(title, message);
        }
      );


    }
  }
})();
