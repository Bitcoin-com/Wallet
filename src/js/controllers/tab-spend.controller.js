'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('tabSpendController', tabSpendController);
    
  function tabSpendController(
    externalLinkService
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

    // Variables
    vm.merchants = [];

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

      // Sample data
      /*
      vm.merchants = [
        {
          description: 'Bits and bobs.',
          name: 'Bob\'s Boutique'
        },
        {
          description: 'Everything eclectic.',
          name: 'Eve\'s Emporium'
        }
      ];
      */
      
    }
    
    function onCheapAir() {
      externalLinkService.open('https://www.cheapair.com/');
    }

    function onEGifter() {
      externalLinkService.open('https://www.egifter.com/');
    }

    function onMerchant(index) {
      var merchant = vm.merchants[index];
    }

    function onPurseIo() {
      externalLinkService.open('https://purse.io/?_r=bitcoinwallet');
    }

    function onStartAccepting() {
      var currentLanguageCode = uxLanguage.currentLanguage;
      var url = startAcceptingLinks[currentLanguageCode] || startAcceptingLinks.en;
      externalLinkService.open(url);
    }

    
  }
  
})();