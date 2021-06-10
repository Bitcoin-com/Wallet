'use strict';

angular.module('copayApp.controllers').controller('preferencesNotificationsController', function($scope, $log, $timeout, appConfigService, lodash, configService, platformInfo, pushNotificationsService, emailService, $ionicNavBarDelegate) {
  var updateConfig = function() {
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.PNEnabledByUser = true;
    $scope.usePushNotifications = platformInfo.isCordova && !platformInfo.isWP;
    $scope.isIOSApp = platformInfo.isIOS && platformInfo.isCordova;

    $scope.pushNotifications = {
      value: config.pushNotificationsEnabled
    };

    var isConfirmedTxsNotificationsEnabled = config.confirmedTxsNotifications ? config.confirmedTxsNotifications.enabled : false;
    $scope.confirmedTxsNotifications = {
      value: isConfirmedTxsNotificationsEnabled
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    $scope.newEmail = lodash.clone($scope.latestEmail);
    var isEmailEnabled = config.emailNotifications ? config.emailNotifications.enabled : false;

    $scope.emailNotifications = {
      value: isEmailEnabled && $scope.newEmail.value ? true : false
    };

    var isSoundEnabled = config.soundsEnabled ? config.soundsEnabled : false;
    $scope.sounds = {
      value: isSoundEnabled
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.pushNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      pushNotificationsEnabled: $scope.pushNotifications.value
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      if (opts.pushNotificationsEnabled)
        pushNotificationsService.init();
      else
        pushNotificationsService.disable();
    });
  };

  $scope.confirmedTxsNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      confirmedTxsNotifications: {
        enabled: $scope.confirmedTxsNotifications.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.emailNotificationsChange = function() {
    var opts = {
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    emailService.updateEmail(opts);

    var channel = "ga";
    if (platformInfo.isCordova) {
      channel = "firebase";
    }
    var log = new window.BitAnalytics.LogEvent("settings_email_notification_toggle", [{
      "toggle": $scope.emailNotifications.value
    }, {}, {}], [channel, 'leanplum']);
    window.BitAnalytics.LogEventHandlers.postEvent(log);
  };

  $scope.soundNotificationsChange = function() {
    if (!$scope.sounds) return;
    var opts = {
      soundsEnabled: $scope.sounds.value
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.save = function() {
    emailService.updateEmail({
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    });

    $scope.latestEmail = {
      value: $scope.newEmail.value
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
    updateConfig();
  });
});
