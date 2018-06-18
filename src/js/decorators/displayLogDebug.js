 angular.module('copayApp')
 .config(['$provide', '$logProvider', function($provide, $logProvider) {
  // expose a provider to reach debugEnabled in $log
  $provide.value('$logProvider', $logProvider);
}])
.decorator('$log', ['$logProvider', '$delegate', function($logProvider, $delegate) {
  // override $log.debug to display in Chrome
  $delegate.debug = function () {
    if ($logProvider.debugEnabled()) {
      $delegate.info.apply($delegate, arguments);
    }
  };

  return $delegate;
}]);