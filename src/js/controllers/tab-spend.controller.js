'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('tabSpendController', tabSpendController);
    
  function tabSpendController(
    externalLinkService
    , gettextCatalog
    , platformInfo
    , $scope
    , uxLanguage
    ) {
    
    var vm = this;

    // Functions
    vm.onCheapAir = onCheapAir
    vm.onStartAccepting = onStartAccepting;
    vm.onEGifter = onEGifter;
    vm.onMerchant = onMerchant;
    vm.onPurseIo = onPurseIo;
    vm.onTravala = onTravala;

    // Variables
    vm.merchants = [];

    var os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';
    
    var startAcceptingLinks = {
      en: 'https://bitcoincashers.org/en/intro/for-merchants/',
      es: 'https://bitcoincashers.org/es/intro/for-merchants/',
      fr: 'https://bitcoincashers.org/fr/intro/for-merchants/',
      pt: 'https://bitcoincashers.org/pt/intro/for-merchants/',
      de: 'https://bitcoincashers.org/de/intro/for-merchants/',
      it: 'https://bitcoincashers.org/it/intro/for-merchants/',
      ja: 'https://bitcoincashers.org/ja/intro/for-merchants/',
      ko: 'https://bitcoincashers.org/ko/intro/for-merchants/',
      zh: 'https://bitcoincashers.org/zh/intro/for-merchants/'
    };

    
    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);

    function _onBeforeEnter(event, data) {

      // Do the setup here so we get the translations
      
      vm.merchants = [
        {
          description: gettextCatalog.getString("Visit the peer-to-peer marketplace now"),
          icon: 'img/merchants/local-bitcoincash.png',
          id: 'merchant_local_bitcoincash',
          name: gettextCatalog.getString('Buy Bitcoin without fees'),
          url: ' https://local.bitcoin.com/r/walletapp'
        },
        {
          description: gettextCatalog.getString("The market's highest paying pool"),
          icon: 'img/merchants/mining_merchant_icon.svg',
          id: 'merchant_bitcoincom_pool',
          name: gettextCatalog.getString('Start mining Bitcoin'),
          url: 'https://pool.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os + '&utm_campaign=Pool'
        },
        {
          description: gettextCatalog.getString('Pay with BCH, get 10% back'),
          icon: 'img/merchants/bitcoin-merchandise.png',
          id: 'merchant_bitcoincom_store',
          name: gettextCatalog.getString('Get your Bitcoin merch'),
          url: 'https://store.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os
        }
      ];
      
      
    }
    
    function onCheapAir() {
      externalLinkService.open('https://www.cheapair.com/');
    }

    function onEGifter() {
      externalLinkService.open('https://giftcards.bitcoin.com/?utm_source=WalletApp&utm_medium=' + os);
    }

    function onMerchant(index) {
      var merchant = vm.merchants[index];
      externalLinkService.open(merchant.url);
    }

    function onPurseIo() {
      externalLinkService.open('https://purse.io/?_r=bitcoinwallet');
    }

    function onTravala() {
      externalLinkService.open('https://www.travala.com/?afp_source=xsHp7u9YeEnDW');
    }

    function onStartAccepting() {
      var currentLanguageCode = uxLanguage.currentLanguage;
      var url = startAcceptingLinks[currentLanguageCode] || startAcceptingLinks.en;
      externalLinkService.open(url);
    }

    
  }
  
})();