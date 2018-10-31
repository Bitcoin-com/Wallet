'use strict';

(function() {
  angular
      .module('bitcoincom.controllers')
      .controller('buyBitcoinAmountController', amountController);

  function amountController(configService, profileService, $scope) {
    var vm = this;

    vm.focussedEl = false;

    function _initVariables() {
      vm.displayBalanceAsFiat = true;
      vm.inputValue = 1;
      vm.lineItems = {
        cost: 125,
        processingFee: 10,
        total: 13511
      };
      vm.paymentMethod = {
        name: 'Visa',
        partialCardNumber: '••• 2244',
        expiryDate: '12/21'
      };
      vm.wallet = null;
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    //var walletId = '693923fb-0554-45a5-838f-6efa26ca917e'; // Backed Up Dev
    var walletId = '98ada868-82bd-44cb-a334-61d0192b7a81'; // Backed Up Dev Other

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();

      configService.whenAvailable(function onConfigService(config){

        vm.displayBalanceAsFiat = config.wallet.settings.priceDisplay === 'fiat';
        console.log('displayBalanceAsFiat: ' + vm.displayBalanceAsFiat);
      });

      // TODO: What if no wallet available?
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
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    var walletId = '693923fb-0554-45a5-838f-6efa26ca917e';

    function _onBeforeEnter() {
      console.log('_onBeforeEnter()');
      _initVariables();

    }

  }
})();
