'use strict';

angular.module('copayApp.controllers').controller('addressbookAddController', function($scope, $state, $stateParams, $timeout, $ionicHistory, gettextCatalog, addressbookService, popupService, configService) {

  var config = configService.getSync();
  var defaults = configService.getDefaults();

  $scope.bitcoinAlias = (config.bitcoinAlias || defaults.bitcoinAlias).toUpperCase();
  $scope.bitcoinCashAlias = (config.bitcoinCashAlias || defaults.bitcoinCashAlias).toUpperCase();

  $scope.fromSendTab = $stateParams.fromSendTab;

  $scope.addressbookEntry = {
    'address': $stateParams.addressbookEntry || '',
    'name': '',
    'email': '',
    'coin': 'btc'
  };

  $scope.onQrCodeScannedAddressBook = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        data = data.replace(/^bitcoin(cash)?:/, '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.add = function(addressbook) {
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        if ($scope.fromSendTab) $scope.goHome();
        else $ionicHistory.goBack();
      });
    }, 100);
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };

});
