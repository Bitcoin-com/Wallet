'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('marcoCoinoController', marcoCoinoController);
    
  function marcoCoinoController(
    gettextCatalog
    , $log
    , externalLinkService
    , popupService
    , $sce
    , $scope
    , $timeout
    ) {
    
    var MARCO_COINO_BASE_URL = 'https://marco-coino.firebaseapp.com/marcocoino-embed.html?zoom=5&color=gold';
    var ADD_MERCHANT_URL = 'https://marcocoino.bitcoin.com/submit-listing/';
    var vm = this;

    // Functions
    vm.addMerchant = addMerchant;

    // Defaults to Tokyo
    vm.marcocoinoUrl = $sce.trustAs($sce.RESOURCE_URL, MARCO_COINO_BASE_URL + '&lat=35.652832&long=139.839478');
  
    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _onBeforeEnter(event, data) {
      
      navigator.geolocation.getCurrentPosition(
        function onGetCurrentPositionSuccess(position) {

          var latitude = position.coords.latitude;
          var longitude = position.coords.longitude;
          $timeout(function onTimeout() { // Doesn't work on Android if just using $scope.$apply()
            vm.marcocoinoUrl = $sce.trustAs($sce.RESOURCE_URL, MARCO_COINO_BASE_URL + '&lat=' + latitude + '&long=' + longitude);
          }, 1);
        },
        function onGetCurrentPositionError(error) {
          $log.error('Failed to get position for Marco Coino.', error);
        }
      );
    }

    function addMerchant() {
      externalLinkService.open(ADD_MERCHANT_URL);
    }
  }
  
})();
