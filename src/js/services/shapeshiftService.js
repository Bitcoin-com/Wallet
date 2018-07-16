'use strict';
angular.module('copayApp.services').factory('shapeshiftService', function(gettextCatalog, servicesService) {
  var root = {};

  var servicesItem = {
    name: 'shapeshift',
    title: gettextCatalog.getString('Shapeshift'),
    icon: 'icon-shapeshift',
    sref: 'tabs.shapeshift',
  };

  var register = function() {
    servicesService.register(servicesItem);
  };

  register();
  return root;
});
