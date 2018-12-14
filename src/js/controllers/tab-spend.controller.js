'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('tabSpendController', tabSpendController);
    
  function tabSpendController(bitcoinUriService, $scope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, platformInfo, sendFlowService, gettextCatalog, configService, $ionicPopup, $ionicNavBarDelegate, clipboardService, incomingDataService) {
    
    var vm = this;

    // Functions
    vm.goToMerchant = goToMerchant;

    // Variables
    vm.merchants = [];


    

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);

    function goToMerchant(index) {
      var merchant = vm.merchants[index];
      console.log('goToMerchant() ' + merchant.name);
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