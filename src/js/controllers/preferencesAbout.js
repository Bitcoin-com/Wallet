'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, appConfigService, gettextCatalog, externalLinkService, $ionicNavBarDelegate) {

    $scope.title = gettextCatalog.getString('About') + ' ' + appConfigService.nameCase;
    $scope.version = $window.fullVersion;
    $scope.commitHash = $window.commitHash;

    $scope.openExternalLink = function() {
      var url = 'https://github.com/bitcoin-com/wallet/tree/' + $window.commitHash + '';
      var optIn = true;
      var title = gettextCatalog.getString('Open GitHub Project');
      var message = gettextCatalog.getString('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
      var okText = gettextCatalog.getString('Open GitHub');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openExternalLink2 = function() {
      var url = 'https://github.com/bitpay/copay';
      var optIn = true;
      var title = gettextCatalog.getString('Open GitHub Project');
      var message = gettextCatalog.getString('This will take you to the original Github project for Copay.');
      var okText = gettextCatalog.getString('Open GitHub');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openExternalLinkTermsOfUse = function() {
      console.log('Terms of Use!');
      var url = 'https://www.bitcoin.com/wallet-disclaimer';
      externalLinkService.open(url);
    }

    $scope.openExternalLinkPrivacyPolicy = function() {
      console.log('Privacy Policy!');
      var url = 'https://www.bitcoin.com/privacy-policy';
      externalLinkService.open(url);
    }

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });

  });
