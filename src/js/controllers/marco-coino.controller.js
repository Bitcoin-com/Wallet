'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('marcoCoinoController', marcoCoinoController);
    
  function marcoCoinoController(
    $log
    , $scope
    , $sce
    ) {
    
    var MARCO_COINO_BASE_URL = 'https://marco-coino.firebaseapp.com/marcocoino-embed.html?zoom=5&color=gold';
    var vm = this;

    // Defaults to Tokyo
    vm.marcocoinoUrl = $sce.trustAs($sce.RESOURCE_URL, MARCO_COINO_BASE_URL + '&lat=35.652832&long=139.839478');
  
    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _onBeforeEnter(event, data) {
      
      navigator.geolocation.getCurrentPosition(
        function onGetCurrentPositionSuccess(position) {
          var latitude = position.coords.latitude;
          var longitude = position.coords.longitude;
          vm.marcocoinoUrl = $sce.trustAs($sce.RESOURCE_URL, MARCO_COINO_BASE_URL + '&lat=' + latitude + '&long=' + longitude);
        },
        function onGetCurrentPositionError(error) {
          $log.error('Failed to get position. ', error);
        }
      );
      
 
    }
  }
  
})();