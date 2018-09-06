'use strict';
angular.module('copayApp.controllers').controller('tourController',
    function ($scope, $state, $log, $timeout, $filter, ongoingProcess, configService, profileService, rateService, popupService, gettextCatalog, lodash, startupService, storageService, uxLanguage, walletService, $q) {

    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.createProfile = function() {
      $log.debug('Creating profile');
      profileService.createProfile(function(err) {
        if (err) $log.warn(err);
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      rateService.whenAvailable(function() {
        var localCurrency = 'USD';
        var btcAmount = 1;
        var rate = rateService.toFiat(btcAmount * 1e8, localCurrency, 'btc');
        $scope.localCurrencySymbol = '$';
        $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(rate.toFixed(2), 10));
        $timeout(function() {
          $scope.$apply();
          $scope.createDefaultWallet();
        })
      });
    });

    var retryCount = 0;
    var creatingWallet = false;
    $scope.createDefaultWallet = function() {
      if (creatingWallet) return;

      creatingWallet = true;
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {
          uxLanguage.init(function(lang) {
            var rateCode = uxLanguage.getRateCode(lang);
            console.log("When Available: rateService");
            rateService.whenAvailable(function() {
              var alternatives = rateService.listAlternatives(true);

              var newAltCurrency = lodash.find(alternatives, {
                'isoCode': rateCode
              });

              configService.whenAvailable(function(config) {
                var opts = {
                  wallet: {
                    settings: {
                      alternativeName: newAltCurrency.name,
                      alternativeIsoCode: newAltCurrency.isoCode,
                    }
                  }
                };
                configService.set(opts, function(err) {
                  if (err) $log.warn(err);

                  profileService.createDefaultWallet(function(err, walletClients) {
                    if (err) {
                      $log.warn(err);

                      return $timeout(function() {
                        $log.warn('Retrying to create default wallet.....:' + ++retryCount);
                        if (retryCount > 3) {
                          ongoingProcess.set('creatingWallet', false);
                          popupService.showAlert(
                              gettextCatalog.getString('Cannot Create Wallet'), err,
                              function() {
                                retryCount = 0;
                                return $scope.createDefaultWallet();
                              }, gettextCatalog.getString('Retry'));
                        } else {
                          return $scope.createDefaultWallet();
                        }
                      }, 2000);
                    }
                    ;

                    ongoingProcess.set('creatingWallet', false);
                    var bchWallet = walletClients[0];
                    var btcWallet = walletClients[1];
                    var bchWalletId = bchWallet.credentials.walletId;
                    var btcWalletId = btcWallet.credentials.walletId;

                    function createAddressPromise(wallet) {
                      return $q(function (resolve, reject) {
                        walletService.getAddress(wallet, true, function (e, addr) {
                          if (e) reject(e);
                          resolve(addr);
                        });
                      });
                    }

                    function goToCollectEmail() {
                      $state.go('onboarding.collectEmail', {
                        bchWalletId: bchWalletId,
                        btcWalletId: btcWalletId
                      });
                    }

                    var bchAddressPromise = createAddressPromise(bchWallet);
                    var btcAddressPromise = createAddressPromise(btcWallet);
                    ongoingProcess.set('generatingNewAddress', true);

                    $q.all([bchAddressPromise, btcAddressPromise]).then(function (addresses) {
                      ongoingProcess.set('generatingNewAddress', false);
                      $state.go('tabs.home');
                    }, function (e) {
                      ongoingProcess.set('generatingNewAddress', false);
                      $log.warn(e);
                      popupService.showAlert(gettextCatalog.getString('Error'), e);
                      $state.go('tabs.home');
                    });
                  });
                });
              });
              $log.debug('Setting default currency : ' + newAltCurrency);
            });
          })
        }, 300);
      };
    });
