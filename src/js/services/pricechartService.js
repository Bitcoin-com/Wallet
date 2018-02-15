'use strict';
angular.module('copayApp.services').factory('pricechartService', function($http, $log, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  var nextStepItem = {
    name: 'pricechart',
    title: 'Bitcoin Price Charts',
    icon: 'icon-chart',
    sref: 'tabs.pricechart',
  };

  var register = function() {
        nextStepsService.register(nextStepItem);
  };

  register();
  return root;
});
