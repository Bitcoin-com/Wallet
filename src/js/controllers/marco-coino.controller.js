'use strict';

(function(){

  angular
    .module('bitcoincom.controllers')
    .controller('marcoCoinoController', marcoCoinoController);
    
  function marcoCoinoController(
    gettextCatalog
    , $log
    , popupService
    , $sce
    , $scope
    , $timeout
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
      var socialsharing = window.plugins && window.plugins.socialsharing;
      var emailAddress = gettextCatalog.getString('addbusiness@bitcoin.com');
      var emailBody = gettextCatalog.getString(
        'Hello Bitcoin.com team,<br>' +
        '<br>' +
        'I would like to add a new business that accepts Bitcoin Cash as payment to the map in your Wallet app:<br>' +
        '- Name of the business:<br>' +
        '- Physical address: <br>' +
        '- Type of business: <br>' +
        '<br>' +
        'Information to help locate the business:<br>' +
        '- Google Maps Link: <br>' +
        'or<br>' +
        '- Latitude: <br>' + 
        '- Longitude: <br>' +
        '<br>' +
        'Optional extra Information:<br>' +
        '- Website:<br>' +
        '- Phone number:<br>'
      );
      var emailBodyWithNewlines = emailBody.replace(/<br>/g, '%0D%0A');
      var emailSubject = gettextCatalog.getString('Add a Business');

      if (socialsharing) {
        socialsharing.canShareViaEmail(
          function onCanShareViaEmailSuccess() {
            socialsharing.shareViaEmail(
              emailBody,
              emailSubject,
              [emailAddress], // TO: must be null or an array
              null, // CC: must be null or an array
              null, // BCC: must be null or an array
              null, // FILES: can be null, a string, or an array
              function() {},
              function() {}
            );
          }, function onCanShareViaEmailError() {
            popupService.showAlert(gettextCatalog.getString('E-mail not detected'), gettextCatalog.getString('In order to add a new merchant, please send an email with all the info to addbusiness@bitcoin.com.'));
          }
        );
      } else {
        window.location.href = 'mailto:' + emailAddress + '?subject=' + emailSubject + '&body=' + emailBodyWithNewlines;
      }
    }
  }
  
})();