'use strict';
angular.module('copayApp.services').factory('signVerifyMessageService', function($http, $log, lodash, moment, storageService, configService, platformInfo, servicesService) {
  var root = {};
  var credentials = {};

  var signServicesItem = {
    name: 'signMessage',
    title: 'Sign Message',
    icon: 'icon-sign-message',
    sref: 'tabs.signMessage',
  };

  /*var verifyServicesItem = {
    name: 'verifyMessage',
    title: 'Verify Message',
    icon: 'icon-verify-message',
    sref: 'tabs.verifyMessage',
  };*/

  var register = function() {
    //servicesService.register(signServicesItem);
    //servicesService.register(verifyServicesItem);
  };

  root.signMessage = function(wallet, message) {
    var privKey = wallet.credentials.walletPrivKey;
    var coin = wallet.coin;
    return wallet.signMessage(message, privKey, coin);
  }

  root.verifyMessage = function(message, signature, pubKey, coin) {
    return wallet.verifyMessage(message, signature, pubKey, coin);
  }

  register();
  return root;
});
