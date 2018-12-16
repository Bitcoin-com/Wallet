'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('merchantMapController', merchantMapController);
    
  function merchantMapController(
    externalLinkService
    , $scope
    ) {
    
    var vm = this;

    // Functions
    vm.goToEGifter = goToEGifter;
    vm.goToMerchant = goToMerchant;
    vm.goToPurseIo = goToPurseIo;

    // Variables
    vm.merchants = [];


    

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);

    function goToEGifter() {
      externalLinkService.open('https://www.egifter.com/');
    }

    function goToMerchant(index) {
      var merchant = vm.merchants[index];
      console.log('goToMerchant() ' + merchant.name);
    }

    function goToPurseIo() {
      externalLinkService.open('https://purse.io/?_r=bitcoinwallet');
    }

    function _onBeforeEnter(event, data) {

      // Sample data
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
    }
  }
  
})();