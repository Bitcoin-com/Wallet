'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('tabSpendController', tabSpendController);
    
  function tabSpendController(bitcoinUriService, $scope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, platformInfo, sendFlowService, gettextCatalog, configService, $ionicPopup, $ionicNavBarDelegate, clipboardService, incomingDataService) {
    
    var vm = this;

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);


    function _onBeforeEnter(event, data) {
    }
  }
  
})();