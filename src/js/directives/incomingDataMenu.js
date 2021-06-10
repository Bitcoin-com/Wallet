'use strict';

angular.module('copayApp.directives')
  .directive('incomingDataMenu', function($timeout, $rootScope, $state, externalLinkService, sendFlowService, bitcoinCashJsService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/incomingDataMenu.html',
      link: function(scope, element, attrs) {
        $rootScope.$on('incomingDataMenu.showMenu', function(event, data) {
          $timeout(function() {
            scope.data = data;

            if (scope.data.parsed.privateKey) {
              scope.type = "privateKey";
            } else if (scope.data.parsed.url || scope.data.parsed.bareUrl) {
              scope.type = "url";
            } else if (scope.data.parsed.publicAddress) {
              scope.type = "bitcoinAddress";
              var prefix = scope.data.coin === 'bch' ? (scope.data.parsed.isTestnet ? 'bchtest:' : 'bitcoincash:') : '';
              scope.data.toAddress = (scope.data.parsed.publicAddress.cashAddr ? prefix + scope.data.parsed.publicAddress.cashAddr : false) || scope.data.parsed.publicAddress.legacy || scope.data.parsed.publicAddress.bitpay;
            } else {
              scope.type = "text";
            }

            scope.showMenu = true;
          });
        });
        scope.hide = function() {
          scope.showMenu = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
        scope.goToUrl = function(url) {
          externalLinkService.open(url);
        };
        scope.sendPaymentToAddress = function(bitcoinAddress) {
          scope.showMenu = false;
          sendFlowService.start({
            data: bitcoinAddress
          });
        };
        scope.addToAddressBook = function(bitcoinAddress) {
          scope.showMenu = false;
          $timeout(function() {
            $state.go('tabs.send').then(function() {
              $timeout(function() {
                $state.transitionTo('tabs.send.addressbook', {
                  addressbookEntry: bitcoinAddress
                });
              });
            });
          }, 100);
        };
        scope.scanPaperWallet = function(privateKey) {
          scope.showMenu = false;
          $state.go('tabs.home').then(function() {
            $timeout(function() {
              $state.transitionTo('tabs.home.paperWallet', {
                privateKey: privateKey
              });
            }, 50);
          });
        };
      }
    };
  });
