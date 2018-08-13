'use strict';
angular.module('copayApp.services').factory('shapeshiftService', function($http, $log, lodash, moment, storageService, configService, platformInfo, servicesService) {
  var root = {};
  var credentials = {};

  var servicesItem = {
    name: 'shapeshift',
    title: 'Shapeshift',
    icon: 'icon-shapeshift',
    sref: 'tabs.shapeshift',
  };

  var register = function() {
    servicesService.register(servicesItem);
  };

  register();
  return root;
});
