'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('marcoCoinoController', marcoCoinoController);
    
  function marcoCoinoController(
    $log
    , $scope
    , $sce
    , popupService
    , gettextCatalog
    ) {
    
    var MARCO_COINO_BASE_URL = 'https://marco-coino.firebaseapp.com/marcocoino-embed.html?zoom=5&color=gold';
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
          vm.marcocoinoUrl = $sce.trustAs($sce.RESOURCE_URL, MARCO_COINO_BASE_URL + '&lat=' + latitude + '&long=' + longitude);
        },
        function onGetCurrentPositionError(error) {
          $log.error('Failed to get position. ', error);
        }
      );
    }

    function addMerchant() {
      window.plugins.socialsharing.shareViaEmail(
        'Hi,<br><br>I would like to add a new merchant with the following details:<br><br>- name: <br>- address: <br>- phone: <br>- website url: <br>- category: ', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
        'Add Merchant',
        ['brendon@bitcoin.com'], // TO: must be null or an array
        ['wallet@bitcoin.com'], // CC: must be null or an array
        null, // BCC: must be null or an array
        null, // FILES: can be null, a string, or an array
        function() {},
        function(error) { // If error, popup a message to set the email
          popupService.showAlert(gettextCatalog.getString('E-mail not detected'), gettextCatalog.getString('In order to add a new merchant, please send an email with all the info to addmerchant@bitcoin.com.'));
        }
      );
    }
  }
  
})();