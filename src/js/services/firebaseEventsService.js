'use strict';
angular.module('copayApp.services').factory('firebaseEventsService', function firebaseEventsService($log, platformInfo) {
  var root = {};
  var useEvents = platformInfo.isCordova && !platformInfo.isWP;

  var _token = null;

  root.init = function() {
    if (!useEvents || _token) return;
    $log.debug('Starting event registration...');

    FirebasePlugin.getToken(function(token) {
      $log.debug('Get token for events: ' + token);
      $log.debug(token);
      _token = token;
    });
  }

  root.logEvent = function(eventName, params) {
    if (!_token) return;
    var p = params ? params : {};
    FirebasePlugin.logEvent(eventName, p);
  }

  if (useEvents) {
    FirebasePlugin.onTokenRefresh(function(token) {
      if (!token) return;
      $log.debug('Refresh and update token for events...');
      $log.debug(token);
      _token = token;
    });
  }

  return root;
});
