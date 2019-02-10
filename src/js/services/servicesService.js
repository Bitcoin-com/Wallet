'use strict'
angular.module('copayApp.services').factory('servicesService', function(configService, $log, lodash) {
  var root = {};
  var services = [{
    name: 'sideshift',
    title: 'SideShift AI',
    icon: 'icon-sideshift',
    sref: 'tabs.sideshift'
  }];

  root.register = function(serviceInfo) {
    $log.info('Adding Services entry:' + serviceInfo.name);

    if (!lodash.find(services, function(x) {
      return x.name == serviceInfo.name;
    })) {
      services.push(serviceInfo);
    }
  }

  root.unregister = function(serviceName) {

    var newS = lodash.filter(services, function(x) {
      return x.name != serviceName;
    });

    // Found?
    if (newS.length == services.length) return;

    $log.info('Removing Services entry:' + serviceName);
    // This is to preserve services pointer
    while (services.length)
      services.pop();

    while (newS.length)
      services.push(newS.pop());
  };

  root.get = function() {
    return services;
  };

  return root;
});
