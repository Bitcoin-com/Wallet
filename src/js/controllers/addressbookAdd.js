'use strict';

angular.module('copayApp.controllers').controller('addressbookAddController', function($scope, $state, $stateParams, $timeout, $ionicHistory, gettextCatalog, addressbookService, popupService, configService, bitcoinCashJsService, platformInfo) {

  var config = configService.getSync();
  var defaults = configService.getDefaults();

  $scope.bitcoinAlias = (config.bitcoinAlias || defaults.bitcoinAlias).toUpperCase();
  $scope.bitcoinCashAlias = (config.bitcoinCashAlias || defaults.bitcoinCashAlias).toUpperCase();

  $scope.fromSendTab = $stateParams.fromSendTab;

  $scope.addressbookEntry = {
    'address': $stateParams.addressbookEntry || '',
    'name': '',
    'email': '',
    'coin': 'bch'
  };

  $scope.onQrCodeScannedAddressBook = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        if (data.result) {
          data = data.result;
        }
        data = data.replace(/^bitcoin(cash)?:/, '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.add = function(addressbook) {
    if ($scope.addressbookEntry.coin == 'bch') {
      var translated = bitcoinCashJsService.readAddress(addressbook.address);
      addressbook.address = translated.legacy;
    }

    var channel = "ga";
    if (platformInfo.isCordova) {
      channel = "firebase";
    }
    var log = new window.BitAnalytics.LogEvent("contact_created", [{
      "coin": $scope.addressbookEntry.coin
    }, {}, {}], [channel, 'leanplum']);
    window.BitAnalytics.LogEventHandlers.postEvent(log);

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
