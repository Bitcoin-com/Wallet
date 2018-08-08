'use strict'
angular.module('copayApp.services').factory('communityService', function(configService, gettextCatalog, $log, lodash) {
  var root = {};
  var services = [];

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

  var bchRedditItem = {
    name: 'bchreddit',
    title: gettextCatalog.getString('Bitcoin Cash Reddit'),
    icon: 'icon-reddit-white',
    href: 'http://reddit.com/r/btc'
  };

  var bitcoincomTwitterItem = {
    name: 'bitcoincomTwitter',
    title: gettextCatalog.getString('Bitcoin.com Twitter'),
    icon: 'icon-twitter-white',
    href: 'https://twitter.com/BTCTN'
  };

  root.register(bchRedditItem);
  root.register(bitcoincomTwitterItem);

  return root;
});
