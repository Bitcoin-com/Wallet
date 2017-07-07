'use strict';

angular.module('copayApp.services').factory('buydotbitcoindotcomService', function($http, $log, $window, $filter, platformInfo, storageService, buyAndSellService, lodash, configService, txFormatService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  root.init = function(cb) {

  };

  var register = function() {

      buyAndSellService.register({
        name: 'buydotbitcoindotcom',
        logo: 'img/bitcoin-com-logo-grey.png',
        location: 'Buy Bitcoin With Credit Card',
        sref: 'tabs.buyandsell.bitcoindotcom'
      });
  };

  register();
  return root;
});
