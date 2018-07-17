'use strict';

angular.module('copayApp.controllers').controller('shareAppController', function($scope, $stateParams, $timeout, $log, $ionicHistory, $state, $ionicNavBarDelegate, $ionicConfig, platformInfo, configService, storageService, lodash, appConfigService, gettextCatalog) {
  $scope.isCordova = platformInfo.isCordova;
  $scope.title = gettextCatalog.getString("Share {{appName}}", {
    appName: appConfigService.nameCase
  });

  var defaults = configService.getDefaults();
  var content = appConfigService.name == 'copay' ? defaults.download.copay.url : defaults.download.bitpay.url;
  content = 'I love the Bitcoin.com Wallet App! Get yours today! ' + content;

  function quickFeedback(cb) {
    window.plugins.spinnerDialog.show();
    $timeout(window.plugins.spinnerDialog.hide, 300);
    $timeout(cb, 20);
  }

  $scope.shareFacebook = function() {
    quickFeedback(function() {
      var content = 'Try the Bitcoin.com Wallet for free today!'
      window.plugins.socialsharing.shareVia($scope.shareFacebookVia, null, null, null, content);
    });
  };

  $scope.shareTwitter = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareVia($scope.shareTwitterVia, null, null, null, content);
    });
  };

  $scope.shareGooglePlus = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareVia($scope.shareGooglePlusVia, content);
    });
  };

  $scope.shareEmail = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaEmail(content);
    });
  };

  $scope.shareWhatsapp = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaWhatsApp(content);
    });
  };

  $scope.shareMessage = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaSMS(content);
    });
  };

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $ionicNavBarDelegate.showBackButton(true);

    if (!$scope.isCordova) return;
    $scope.animate = true;

    window.plugins.socialsharing.available(function(isAvailable) {
      // the boolean is only false on iOS < 6
      $scope.socialsharing = isAvailable;
      if (isAvailable) {
        window.plugins.socialsharing.canShareVia('com.apple.social.facebook', 'msg', null, null, null, function(e) {
          $scope.shareFacebookVia = 'com.apple.social.facebook';
          $scope.facebook = true;
        }, function(e) {
          window.plugins.socialsharing.canShareVia('com.facebook.katana', 'msg', null, null, null, function(e) {
            $scope.shareFacebookVia = 'com.facebook.katana';
            $scope.facebook = true;
          }, function(e) {
            $log.debug('facebook error: ' + e);
            $scope.facebook = false;
          });
        });
        window.plugins.socialsharing.canShareVia('com.apple.social.twitter', 'msg', null, null, null, function(e) {
          $scope.shareTwitterVia = 'com.apple.social.twitter';
          $scope.twitter = true;
        }, function(e) {
          window.plugins.socialsharing.canShareVia('com.twitter.android', 'msg', null, null, null, function(e) {
            $scope.shareTwitterVia = 'com.twitter.android';
            $scope.twitter = true;
          }, function(e) {
            $log.debug('twitter error: ' + e);
            $scope.twitter = false;
          });
        });
        window.plugins.socialsharing.canShareVia('com.google.android.apps.plus', 'msg', null, null, null, function(e) {
          $scope.shareGooglePlusVia = 'com.google.android.apps.plus';
          $scope.googleplus = true;
        }, function(e) {
          $log.debug('googlePlus error: ' + e);
          $scope.googleplus = false;
        });
        window.plugins.socialsharing.canShareViaEmail(function(e) {
          $scope.email = true;
        }, function(e) {
          $log.debug('email error: ' + e);
          $scope.email = false;
        });
        window.plugins.socialsharing.canShareVia('whatsapp', 'msg', null, null, null, function(e) {
          $scope.whatsapp = true;
        }, function(e) {
          $log.debug('whatsapp error: ' + e);
          $scope.whatsapp = false;
        });
      }
    }, 100);
  });
});
