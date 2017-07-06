'use strict';
angular.module('copayApp.services').factory('pricechartService', function($http, $log, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  var homeItem = {
    name: 'pricechart',
    title: 'Bitcoin Price Chart',
    icon: 'icon-bitcoincom',
    sref: 'tabs.pricechart',
  };

  var nextStepItem = {
    name: 'pricechart',
    title: 'Bitcoin Price Chart',
    icon: 'icon-chart',
    sref: 'tabs.pricechart',
  };

  var register = function() {
        nextStepsService.register(nextStepItem);
  };

  register();
  return root;
});
