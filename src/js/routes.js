'use strict';

var unsupported, isaosp;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}

//Setting up route
angular.module('copayApp').config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider) {
    $urlRouterProvider.otherwise('/starting');

    // NO CACHE
    //$ionicConfigProvider.views.maxCache(0);

    // TABS BOTTOM
    $ionicConfigProvider.tabs.position('bottom');

    // NAV TITTLE CENTERED
    $ionicConfigProvider.navBar.alignTitle('center');

    // NAV BUTTONS ALIGMENT
    $ionicConfigProvider.navBar.positionPrimaryButtons('left');
    $ionicConfigProvider.navBar.positionSecondaryButtons('right');

    // NAV BACK-BUTTON TEXT/ICON
    $ionicConfigProvider.backButton.icon('icon ion-ios-arrow-thin-left').text('');
    $ionicConfigProvider.backButton.previousTitleText(false);

    // CHECKBOX CIRCLE
    $ionicConfigProvider.form.checkbox('circle');

    // USE NATIVE SCROLLING
    $ionicConfigProvider.scrolling.jsScrolling(false);

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate', 'platformInfo',
      function($delegate, platformInfo) {
        var historicLog = historicLogProvider.$get();

        historicLog.getLevels().forEach(function(levelDesc) {
          var level = levelDesc.level;
          if (platformInfo.isDevel && level == 'error') return;

          var orig = $delegate[level];
          $delegate[level] = function() {
            if (level == 'error')
              console.log(arguments);

            var args = Array.prototype.slice.call(arguments);

            args = args.map(function(v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                // Trim output in mobile
                if (platformInfo.isCordova) {
                  v = v.toString();
                  if (v.length > 3000) {
                    v = v.substr(0, 2997) + '...';
                  }
                }
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });

            try {
              if (platformInfo.isCordova)
                console.log(args.join(' '));

              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('ERROR (at log decorator):', e, args[0]);
            }
          };
        });
        return $delegate;
      }
    ]);

    // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
    // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension|ionic):|data:image\/)/);

    $stateProvider

      /*
       *
       * Other pages
       *
       */

      .state('unsupported', {
        url: '/unsupported',
        templateUrl: 'views/unsupported.html'
      })

      .state('starting', {
        url: '/starting',
        template: '<ion-view id="starting"><ion-content><div class="block-spinner row"><ion-spinner class="spinner-stable" icon="crescent"></ion-spinner></div></ion-content></ion-view>'
      })

      /*
       *
       * URI
       *
       */

      .state('uri', {
        url: '/uri/:url',
        controller: function($stateParams, $log, openURLService, profileService) {
          profileService.whenAvailable(function() {
            $log.info('DEEP LINK from Browser:' + $stateParams.url);
            openURLService.handleURL({
              url: $stateParams.url
            });
          })
        }
      })

      /*
       *
       * Wallet
       *
       */

      .state('tabs.wallet', {
        url: '/wallet/:walletId/:fromOnboarding',
        views: {
          'tab-home@tabs': {
            controller: 'walletDetailsController',
            templateUrl: 'views/walletDetails.html'
          }
        }
      })
      .state('tabs.activity', {
        url: '/activity',
        views: {
          'tab-home@tabs': {
            controller: 'activityController',
            templateUrl: 'views/activity.html',
          }
        }
      })
      .state('tabs.proposals', {
        url: '/proposals',
        views: {
          'tab-home@tabs': {
            controller: 'proposalsController',
            templateUrl: 'views/proposals.html',
          }
        }
      })
      .state('tabs.wallet.tx-details', {
        url: '/tx-details/:txid',
        views: {
          'tab-home@tabs': {
            controller: 'txDetailsController',
            controllerAs: 'vm',
            templateUrl: 'views/tx-details.html'
          }
        }
      })
      .state('tabs.wallet.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'backupWarningController',
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.wallet.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/backup.html',
            controller: 'backupController'
          }
        }
      })
      .state('tabs.wallet.allAddresses', {
        url: '/allAddresses/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/allAddresses.html'
          }
        }
      })

      /*
       *
       * Tabs
       *
       */

      .state('tabs', {
        url: '/tabs',
        abstract: true,
        controller: 'tabsController',
        templateUrl: 'views/tabs.html'
      })
      .state('tabs.home', {
        url: '/home/:fromOnboarding',
        views: {
          'tab-home': {
            controller: 'tabHomeController',
            templateUrl: 'views/tab-home.html',
          }
        }
      })
      .state('tabs.spend', {
        url: '/spend',
        views: {
          'tab-spend': {
            controller: 'tabSpendController',
            controllerAs: 'vm',
            templateUrl: 'views/tab-spend.html',
          }
        }
      })
      .state('tabs.receive', {
        url: '/receive/:walletId',
        views: {
          'tab-receive': {
            controller: 'tabReceiveController',
            templateUrl: 'views/tab-receive.html',
          }
        }
      })
      .state('tabs.scan', {
        url: '/scan',
        views: {
          'tab-scan': {
            controller: 'tabScanController',
            templateUrl: 'views/tab-scan.html',
          }
        }
      })
      .state('scanner', {
        url: '/scanner',
        params: {
          passthroughMode: null,
        },
        controller: 'tabScanController',
        templateUrl: 'views/tab-scan.html'
      })
      .state('tabs.send', {
        url: '/send',
        views: {
          'tab-send': {
            controller: 'tabSendController',
            templateUrl: 'views/tab-send.html',
          }
        }
      })
      .state('tabs.settings', {
        url: '/settings',
        views: {
          'tab-home@tabs': {
            controller: 'tabSettingsController',
            templateUrl: 'views/tab-settings.html',
          }
        }
      })

      /*
       *
       * Send
       *
       */

      .state('tabs.send.amount', {
        url: '/amount',
        views: {
          'tab-send@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.send.wallet-to-wallet', {
        url: '/wallet-to-wallet',
        views: {
          'tab-send@tabs': {
            controller: 'walletSelectorController',
            templateUrl: 'views/walletSelector.html'
          }
        }
      })
      .state('tabs.send.origin', {
        url: '/origin',
        views: {
          'tab-send@tabs': {
            controller: 'walletSelectorController',
            templateUrl: 'views/walletSelector.html',
          }
        }
      })
      .state('tabs.send.destination', {
        url: '/destination',
        views: {
          'tab-send@tabs': {
            controller: 'walletSelectorController',
            templateUrl: 'views/walletSelector.html',
          }
        }
      })
      .state('tabs.send.confirm', {
        url: '/confirm',
        views: {
          'tab-send@tabs': {
            controller: 'confirmController',
            templateUrl: 'views/confirm.html'
          }
        },
        params: {
          paypro: null
        }
      })
      .state('tabs.send.addressbook', {
        url: '/addressbook/add/:fromSendTab/:addressbookEntry',
        views: {
          'tab-send@tabs': {
            templateUrl: 'views/addressbook.add.html',
            controller: 'addressbookAddController'
          }
        }
      })
      .state('tabs.send.review', {
        url: '/review/:thirdParty/:amount/:fromWalletId/:sendMax/:toAddress/:toWalletId',
        views: {
          'tab-send@tabs': {
            controller: 'reviewController',
            controllerAs: 'vm',
            templateUrl: 'views/review.html'
          }
        },
        params: {
          paypro: null
        }
      })

      /*
       *
       * Add
       *
       */

      .state('tabs.add', {
        url: '/add',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/add.html'
          }
        },
        params: {
          coin: 'btc'
        }
      })
      .state('tabs.add.join', {
        url: '/join/:url',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/join.html',
            controller: 'joinController'
          },
        }
      })
      .state('tabs.add.import', {
        url: '/import/:code',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/import.html',
            controller: 'importController'
          },
        },
      })
      .state('tabs.add.create-personal', {
        url: '/create-personal',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-personal.html',
            controller: 'createController'
          },
        }
      })
      .state('tabs.add.create-shared', {
        url: '/create-shared',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-shared.html',
            controller: 'createController'
          },
        }
      })

      /*
       *
       * Global Settings
       *
       */

      .state('tabs.notifications', {
        url: '/notifications',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesNotificationsController',
            templateUrl: 'views/preferencesNotifications.html'
          }
        }
      })
      .state('tabs.language', {
        url: '/language',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesLanguageController',
            templateUrl: 'views/preferencesLanguage.html'
          }
        }
      })
      .state('tabs.fee', {
        url: '/fee',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesFeeController',
            templateUrl: 'views/preferencesFee.html'
          }
        }
      })
      .state('tabs.altCurrency', {
        url: '/altCurrency',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesAltCurrencyController',
            templateUrl: 'views/preferencesAltCurrency.html'
          }
        }
      })
      .state('tabs.priceDisplay', {
        url: '/priceDisplay',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesPriceDisplayController',
            templateUrl: 'views/preferencesPriceDisplay.html'
          }
        }
      })
      .state('tabs.about', {
        url: '/about',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesAbout',
            templateUrl: 'views/preferencesAbout.html'
          }
        }
      })
      .state('tabs.about.logs', {
        url: '/logs',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesLogs',
            templateUrl: 'views/preferencesLogs.html'
          }
        }
      })
      .state('tabs.about.termsOfUse', {
        url: '/termsOfUse',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/termsOfUse.html'
          }
        }
      })
      .state('tabs.advanced', {
        url: '/advanced',
        views: {
          'tab-home@tabs': {
            controller: 'advancedSettingsController',
            templateUrl: 'views/advancedSettings.html'
          }
        }
      })
      .state('tabs.lockSetup', {
        url: '/lockSetup',
        views: {
          'tab-home@tabs': {
            controller: 'lockSetupController',
            templateUrl: 'views/lockSetup.html',
          }
        }
      })
      .state('tabs.pin', {
        url: '/pin/:action',
        views: {
          'tab-home@tabs': {
            controller: 'pinController',
            templateUrl: 'views/pin.html',
            cache: false
          }
        }
      })


      /*
       *
       * Wallet preferences
       *
       */

      .state('tabs.preferences', {
        url: '/preferences/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesController',
            templateUrl: 'views/preferences.html'
          }
        }
      })
      .state('tabs.preferences.preferencesAlias', {
        url: '/preferencesAlias',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesAliasController',
            templateUrl: 'views/preferencesAlias.html'
          }
        }
      })
      .state('tabs.preferences.preferencesColor', {
        url: '/preferencesColor',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesColorController',
            templateUrl: 'views/preferencesColor.html'
          }
        }
      })
      .state('tabs.preferences.backupWarning', {
        url: '/backupWarning/:from',
        views: {
          'tab-home@tabs': {
            controller: 'backupWarningController',
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.preferences.backup', {
        url: '/backup',
        views: {
          'tab-home@tabs': {
            controller: 'backupController',
            templateUrl: 'views/backup.html'
          }
        }
      })
      .state('tabs.preferences.preferencesAdvanced', {
        url: '/preferencesAdvanced',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesAdvancedController',
            templateUrl: 'views/preferencesAdvanced.html'
          }
        }
      })
      .state('tabs.preferences.information', {
        url: '/information',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesInformation',
            templateUrl: 'views/preferencesInformation.html'
          }
        }
      })
      .state('tabs.preferences.addresses', { /* Addresses */
        url: '/addresses/:walletId/:toAddress',
        views: {
          'tab-home@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/addresses.html'
          }
        }
      })
      .state('tabs.preferences.export', {
        url: '/export',
        views: {
          'tab-home@tabs': {
            controller: 'exportController',
            templateUrl: 'views/export.html'
          }
        }
      })
      .state('tabs.preferences.preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesBwsUrlController',
            templateUrl: 'views/preferencesBwsUrl.html'
          }
        }
      })
      .state('tabs.preferences.preferencesHistory', {
        url: '/preferencesHistory',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesHistory',
            templateUrl: 'views/preferencesHistory.html'
          }
        }
      })
      .state('tabs.preferences.preferencesExternal', {
        url: '/preferencesExternal',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesExternalController',
            templateUrl: 'views/preferencesExternal.html'
          }
        }
      })
      .state('tabs.preferences.delete', {
        url: '/delete',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesDeleteWalletController',
            templateUrl: 'views/preferencesDeleteWallet.html'
          }
        }
      })
      .state('tabs.preferencesCash.scan', {
        url: '/cashScan',
        views: {
          'tab-home@tabs': {
            controller: 'cashScanController',
            templateUrl: 'views/cashScan.html'
          }
        }
      })

      /*
       *
       * Addressbook
       *
       */


      .state('tabs.addressbook', {
        url: '/addressbook',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/addressbook.html',
            controller: 'addressbookListController'
          }
        }
      })
      .state('tabs.addressbook.add', {
        url: '/add',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/addressbook.add.html',
            controller: 'addressbookAddController'
          }
        }
      })
      .state('tabs.addressbook.view', {
        url: '/view/:address/:email/:name/:coin',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/addressbook.view.html',
            controller: 'addressbookViewController'
          }
        }
      })

      /*
       *
       * Copayers
       *
       */

      .state('tabs.copayers', {
        url: '/copayers/:walletId',
        views: {
          'tab-home': {
            templateUrl: 'views/copayers.html',
            controller: 'copayersController'
          }
        }
      })

      /*
       *
       * Request Specific amount
       *
       */

      .state('tabs.paymentRequest', {
        url: '/payment-request',
        abstract: true,
        params: {
          id: null,
          nextStep: 'tabs.paymentRequest.confirm',
        }
      })

      .state('tabs.paymentRequest.amount', {
        url: '/amount/:toWalletId',
        views: {
          'tab-receive@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.paymentRequest.confirm', {
        url: '/confirm/:amount/:toWalletId',
        views: {
          'tab-receive@tabs': {
            controller: 'customAmountController',
            controllerAs: 'vm',
            templateUrl: 'views/customAmount.html'
          }
        }
      })

      /*
       *
       * Init backup flow
       *
       */

      .state('tabs.receive.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'backupWarningController',
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.receive.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'backupController',
            templateUrl: 'views/backup.html'
          }
        }
      })

      /*
       *
       * Paper Wallet
       *
       */

      .state('tabs.home.paperWallet', {
        url: '/paperWallet/:privateKey',
        views: {
          'tab-home@tabs': {
            controller: 'paperWalletController',
            templateUrl: 'views/paperWallet.html'
          }
        }
      })
      /*
       *
       * Onboarding
       *
       */

      .state('onboarding', {
        url: '/onboarding',
        abstract: true,
        template: '<ion-nav-view name="onboarding"></ion-nav-view>'
      })
      .state('onboarding.tour', {
        url: '/tour',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/tour.html',
            controller: 'tourController'
          }
        }
      })
      .state('onboarding.collectEmail', {
        url: '/collectEmail/:bchWalletId/:btcWalletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/collectEmail.html',
            controller: 'collectEmailController'
          }
        }
      })
      .state('onboarding.import', {
        url: '/import',
        views: {
          'onboarding': {
            templateUrl: 'views/import.html',
            controller: 'importController'
          },
        },
        params: {
          code: null,
          fromOnboarding: null
        },
      })
      .state('tabs.shareApp', {
        url: '/shareApp',
        views: {
          'tab-home@tabs': {
            controller: 'shareAppController',
            templateUrl: 'views/shareApp.html'
          }
        }
      })
      /*
       *
       * Buy or Sell Bitcoin
       *
       */

      .state('tabs.buyandsell', {
        url: '/buyandsell',
        views: {
          'tab-home': {
            controller: 'buyandsellController',
            templateUrl: 'views/buyandsell.html'
          }
        }
      })

      .state('tabs.buybitcoin', {
        url: '/buy-bitcoin',
        views: {
          'tab-home': {
            controller: 'buyBitcoinHomeController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/home.html'
          }
        }
      })

      .state('tabs.buybitcoin-amount', {
        url: '/buy-bitcoin/amount/:coin',
        views: {
          'tab-home': {
            controller: 'buyBitcoinAmountController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/amount.html'
          }
        }
      })

      .state('tabs.buybitcoin-paymentmethods', {
        url: '/buy-bitcoin/payment-methods',
        views: {
          'tab-home': {
            controller: 'buyBitcoinPaymentMethodsController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/payment-methods.html'
          }
        }
      })

      .state('tabs.buybitcoin-wallets', {
        url: '/buy-bitcoin/wallets/:coin',
        views: {
          'tab-home': {
            controller: 'buyBitcoinWalletsController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/wallets.html'
          }
        }
      })
      
      .state('tabs.buybitcoin-add-card-form', {
        url: '/buy-bitcoin/add-card-form',
        views: {
          'tab-home': {
            controller: 'buyBitcoinAddCardFormController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/add-card-form.html'
          }
        }
      })
      .state('tabs.buybitcoin-welcome', {
        url: '/buy-bitcoin/welcome',
        views: {
          'tab-home': {
            controller: 'buyBitcoinWelcomeController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/welcome.html'
          }
        }
      })

      .state('tabs.buybitcoin-kyc-document-info', {
        url: '/buy-bitcoin/kyc-documentation-info',
        views: {
          'tab-home': {
            controller: 'buyBitcoinKycDocumentInfoController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/kyc-document-info.html'
          }
        }
      })

      .state('tabs.buybitcoin-kyc-document-capture', {
        url: '/buy-bitcoin/kyc-document-capture/:count',
        views: {
          'tab-home': {
            controller: 'buyBitcoinKycDocumentCaptureController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/kyc-document-capture.html'
          }
        }
      })

      .state('tabs.buybitcoin-kyc-document-verify', {
        url: '/buy-bitcoin/kyc-document-verify/:count',
        views: {
          'tab-home': {
            controller: 'buyBitcoinKycDocumentVerifyController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/kyc-document-verify.html'
          }
        }
      })

      .state('tabs.buybitcoin-kyc-status', {
        url: '/buy-bitcoin/kyc-status',
        views: {
          'tab-home': {
            controller: 'buyBitcoinKycStatusController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/kyc-status.html'
          }
        }
      })

      .state('tabs.buybitcoin-kyc-personal-info', {
        url: '/buy-bitcoin/kyc-personal-info',
        views: {
          'tab-home': {
            controller: 'buyBitcoinKycPersonalInfoController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/kyc-personal-info.html'
          }
        }
      })
      .state('tabs.buybitcoin-purchasehistory', {
        url: '/buy-bitcoin/purchase-history',
        views: {
          'tab-home': {
            controller: 'buyBitcoinPurchaseHistoryController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/purchase-history.html'
          }
        }
      })
      .state('tabs.buybitcoin-receipt', {
        url: '/buy-bitcoin/receipt/:moonpayTxId',
        views: {
          'tab-home': {
            controller: 'buyBitcoinReceiptController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/receipt.html'
          }
        }
      })
      .state('tabs.buybitcoin-success', {
        url: '/buy-bitcoin/success/:moonpayTxId/:purchasedAmount',
        views: {
          'tab-home': {
            controller: 'buyBitcoinSuccessController',
            controllerAs: 'vm',
            templateUrl: 'views/buy-bitcoin/success.html'
          }
        }
      })

      /*
       *
       * Glidera
       *
       *
       */

      .state('tabs.buyandsell.glidera', {
        url: '/glidera/:code',
        views: {
          'tab-home@tabs': {
            controller: 'glideraController',
            controllerAs: 'glidera',
            templateUrl: 'views/glidera.html'
          }
        },
        params: {
          coin: 'btc',
        }
      })
      .state('tabs.buyandsell.glidera.amount', {
        url: '/amount/:nextStep/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyGlideraController',
            templateUrl: 'views/buyGlidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.sell', {
        url: '/sell/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'sellGlideraController',
            templateUrl: 'views/sellGlidera.html'
          }
        }
      })
      .state('tabs.preferences.glidera', {
        url: '/glidera',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesGlideraController',
            templateUrl: 'views/preferencesGlidera.html'
          }
        }
      })

      /*
       *
       * Coinbase
       *
       */

      .state('tabs.buyandsell.coinbase', {
        url: '/coinbase/:code',
        views: {
          'tab-home@tabs': {
            controller: 'coinbaseController',
            controllerAs: 'coinbase',
            templateUrl: 'views/coinbase.html'
          }
        },
        params: {
          coin: 'btc',
        }
      })
      .state('tabs.preferences.coinbase', {
        url: '/coinbase',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesCoinbaseController',
            templateUrl: 'views/preferencesCoinbase.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.amount', {
        url: '/amount/:nextStep/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyCoinbaseController',
            templateUrl: 'views/buyCoinbase.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.sell', {
        url: '/sell/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'sellCoinbaseController',
            templateUrl: 'views/sellCoinbase.html'
          }
        }
      })

      /*
       *
       * Gift Cards
       *
       */

      .state('tabs.giftcards', {
        url: '/giftcards',
        abstract: true
      })

      /* buy.Bitcoin.com */
      .state('tabs.buyandsell.bitcoindotcom', {
        url: '/buyBitcoindotcom',
        views: {
          'tab-home@tabs': {
            controller: 'buyBitcoindotcomController',
            templateUrl: 'views/buyBitcoindotcom.html'
          }
        }
      })

      /* Price Chart */
      .state('tabs.pricechart', {
        url: '/pricechart',
        views: {
          'tab-home@tabs': {
            controller: 'pricechartController',
            templateUrl: 'views/pricechart.html'
          }
        }
      })

      /* Sideshift */
      .state('tabs.sideshift', {
        url: '/sideshift/:fromWalletId/:toWalletId',
        views: {
          'tab-home@tabs': {
            controller: 'sideshiftController',
            templateUrl: 'views/sideshift.html'
          }
        }
      })

      /* Message Signing and Verification */
      .state('tabs.signMessage', {
        url: '/signMessage',
        views: {
          'tab-home@tabs': {
            controller: 'signMessageController',
            templateUrl: 'views/signMessage.html'
          }
        }
      })
      .state('tabs.verifyMessage', {
        url: '/verifyMessage',
        views: {
          'tab-home@tabs': {
            controller: 'verifyMessageController',
            templateUrl: 'views/verifyMessage.html'
          }
        }
      })

      /*
       *
       * Spend
       *
       */
      .state('tabs.spend.marcoCoino', {
        url: '/spend/marcocoino',
        views: {
          'tab-spend@tabs': {
            controller: 'marcoCoinoController',
            controllerAs: 'vm',
            templateUrl: 'views/marco-coino.html',
          }
        }
      })

      /*
       *
       * Mercado Libre Gift Card
       *
       */

      .state('tabs.giftcards.mercadoLibre', {
        url: '/mercadoLibre',
        views: {
          'tab-home@tabs': {
            controller: 'mercadoLibreController',
            templateUrl: 'views/mercadoLibre.html'
          }
        }
      })
      .state('tabs.giftcards.mercadoLibre.cards', {
        url: '/cards',
        views: {
          'tab-home@tabs': {
            controller: 'mercadoLibreCardsController',
            templateUrl: 'views/mercadoLibreCards.html'
          }
        },
        params: {
          invoiceId: null
        }
      })
      .state('tabs.giftcards.mercadoLibre.amount', {
        url: '/amount',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        },
        params: {
          nextStep: 'tabs.giftcards.mercadoLibre.buy',
          currency: 'BRL',
          coin: 'btc',
          fixedUnit: 1,
        }
      })
      .state('tabs.giftcards.mercadoLibre.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyMercadoLibreController',
            templateUrl: 'views/buyMercadoLibre.html'
          }
        }
      })

      /*
       *
       * Amazon.com Gift Card
       *
       */

      .state('tabs.giftcards.amazon', {
        url: '/amazon',
        views: {
          'tab-home@tabs': {
            controller: 'amazonController',
            templateUrl: 'views/amazon.html'
          }
        }
      })
      .state('tabs.giftcards.amazon.cards', {
        url: '/cards',
        views: {
          'tab-home@tabs': {
            controller: 'amazonCardsController',
            templateUrl: 'views/amazonCards.html'
          }
        },
        params: {
          invoiceId: null
        }
      })
      .state('tabs.giftcards.amazon.amount', {
        url: '/amount',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        },
        params: {
          nextStep: 'tabs.giftcards.amazon.buy',
          currency: 'USD',
          coin: 'btc',
          fixedUnit: true,
        }
      })
      .state('tabs.giftcards.amazon.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyAmazonController',
            templateUrl: 'views/buyAmazon.html'
          }
        }
      })

      /*
       *
       * BitPay Card
       *
       */

      .state('tabs.bitpayCardIntro', {
        url: '/bitpay-card-intro/:secret/:email/:otp',
        views: {
          'tab-home@tabs': {
            controller: 'bitpayCardIntroController',
            templateUrl: 'views/bitpayCardIntro.html'
          }
        }
      })
      .state('tabs.bitpayCard', {
        url: '/bitpay-card',
        views: {
          'tab-home@tabs': {
            controller: 'bitpayCardController',
            controllerAs: 'bitpayCard',
            templateUrl: 'views/bitpayCard.html'
          }
        },
        params: {
          id: null,
          currency: 'USD',
          coin: 'btc',
          useSendMax: null
        }
      })
      .state('tabs.bitpayCard.amount', {
        url: '/amount/:nextStep',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            controllerAs: 'vm',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.bitpayCard.topup', {
        url: '/topup/:amount',
        views: {
          'tab-home@tabs': {
            controller: 'topUpController',
            templateUrl: 'views/topup.html'
          }
        }
      })
      .state('tabs.preferences.bitpayServices', {
        url: '/bitpay-services',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesBitpayServicesController',
            templateUrl: 'views/preferencesBitpayServices.html'
          }
        }
      });
  })
  .run(function(
    bitAnalyticsService
    , leanplumConfig
    , $rootScope
    , $state
    , $location
    , $log
    , $timeout
    , startupService
    , ionicToast
    , fingerprintService
    , $ionicHistory
    , $ionicPlatform
    , $window
    , appConfigService
    , lodash
    , platformInfo
    , profileService
    , uxLanguage
    , gettextCatalog
    , openURLService
    , storageService
    , scannerService
    , configService
    , emailService
    /* plugins START HERE => */
    , pushNotificationsService
    , glideraService
    , amazonService
    , bitpayCardService
    , applicationService
    , mercadoLibreService
    , rateService
    ) {
    
    $ionicPlatform.ready(function() {
      
      leanplumConfig.variables = leanplumConfig.variables || {};
      leanplumConfig.variables.bitcoincom_fee = 5;
      
      // Init BitAnalytics
      var os = platformInfo.isAndroid ? 'android' : platformInfo.isIOS ? 'ios' : 'desktop';
      window.BitAnalytics.initialize(os, $window.fullVersion, {"firebase": {}, 
        "ga": {
          "trackingId": "UA-59964190-23",
          "eventLabels": ["id", "icon-off"]
        },
        "adjust": {
          "token": "au1onbhgg5q8",
          "environment" : "production",
          "eventTypes": {
            "banner_click": "sc5i8u",
            "buy_bitcoin_click": "t1vcdz",
            "transfer_success": "f68evo",
            "wallet_created": "nd3dg5",
            "wallet_opened": "4n39l7"
          }
        },
        leanplum: leanplumConfig
      });
      bitAnalyticsService.init();

      configService.whenAvailable(function(config) {
        pushNotificationsService.init();
      });
      //firebaseEventsService.init();

      var channel = "ga";
      if (platformInfo.isCordova) {
        channel = "firebase";
      }

      // Send a log to test
      var log = new window.BitAnalytics.LogEvent("wallet_opened", [{}, {}, {}], [channel, 'leanplum']);
      window.BitAnalytics.LogEventHandlers.postEvent(log);

      var actionBanner = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'banner_click', 
        class: 'track_banner_click', 
        params: ['href-banner', 'id'], 
        channels: [channel, 'adjust', 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBanner);

      var actionBuyBitcoin = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_click', 
        class: 'track_buy_bitcoin_click', 
        params: ['href', 'id'], 
        channels: [channel, 'adjust', 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoin);

      var actionLinkClickOut = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'link_click_out', 
        class: 'track_link_click_out', 
        params: ['href', 'id'], 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionLinkClickOut);

      var actionTabOpen = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'tab_open', 
        class: 'track_tab_open', 
        params: ['href', 'title', 'icon-off'], 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionTabOpen);

      var actionSideshiftStart = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'sideshift_start_click', 
        class: 'track_sideshift_start_click', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionSideshiftStart);

      // Buy Bitcoin Welcome Screen

      var actionBuyBitcoinWelcomeScreenClose = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_welcome_screen_close', 
        class: 'track_buy_bitcoin_welcome_screen_close', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinWelcomeScreenClose);

      // Buy Bitcoin Main Screen

      var actionBuyBitcoinScreenClose = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_close', 
        class: 'track_buy_bitcoin_screen_close', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinScreenClose);

      var actionBuyBitcoinTapOnBuyInstantly = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_tap_on_buy_instantly', 
        class: 'track_buy_bitcoin_tap_on_buy_instantly',
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinTapOnBuyInstantly);

      var actionBuyBitcoinTapOnPurchaseHistory = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_tap_on_purchase_history', 
        class: 'track_buy_bitcoin_tap_on_purchase_history', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinTapOnPurchaseHistory);

      var actionBuyBitcoinTapOnPaymentMethods = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_tap_on_payment_methods', 
        class: 'track_buy_bitcoin_tap_on_payment_methods', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinTapOnPaymentMethods);

      var actionBuyBitcoinTapOnPrivacyPolicy = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_tap_on_privacy_policy', 
        class: 'track_buy_bitcoin_tap_on_privacy_policy', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinTapOnPrivacyPolicy);

      var actionBuyBitcoinTapOnTermsOfService = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_screen_tap_on_terms_of_service', 
        class: 'track_buy_bitcoin_tap_on_terms_of_service', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinTapOnTermsOfService);

      var actionBuyBitcoinBuyInstantlyAmountChooseWallet = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_buy_instantly_amount_screen_tap_on_choose_wallet', 
        class: 'track_buy_bitcoin_buy_instantly_amount_screen_tap_on_choose_wallet', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinBuyInstantlyAmountChooseWallet);

      var actionBuyBitcoinBuyInstantlyAmountChoosePaymentMethod = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_buy_instantly_amount_screen_tap_on_choose_payment_method', 
        class: 'track_buy_bitcoin_buy_instantly_amount_screen_tap_on_choose_payment_method', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinBuyInstantlyAmountChoosePaymentMethod);
      
      var actionBuyBitcoinPurchaseSuccessSeeWallet = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_purchase_success_screen_tap_on_see_wallet', 
        class: 'track_buy_bitcoin_purchase_success_screen_tap_on_see_wallet', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinPurchaseSuccessSeeWallet);
      
      var actionBuyBitcoinPurchaseSuccessSeeReceipt = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_purchase_success_screen_tap_on_see_receipt', 
        class: 'track_buy_bitcoin_purchase_success_screen_tap_on_see_receipt', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinPurchaseSuccessSeeReceipt);

      var actionBuyBitcoinPurchaseSuccessSeePurchaseHistory = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_purchase_success_screen_tap_on_see_purchase_history', 
        class: 'track_buy_bitcoin_purchase_success_screen_tap_on_see_purchase_history', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinPurchaseSuccessSeePurchaseHistory);
      
      var actionBuyBitcoinPurchaseSuccessMakeAnotherPurchase = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'buy_bitcoin_purchase_success_screen_tap_on_make_another_purchase', 
        class: 'track_buy_bitcoin_purchase_success_screen_tap_on_make_another_purchase', 
        channels: [channel, 'leanplum']
      });
      window.BitAnalytics.ActionHandlers.trackAction(actionBuyBitcoinPurchaseSuccessMakeAnotherPurchase);
      

      // Init language
      uxLanguage.init(function (lang) {

        // Try to load the profile
        profileService.loadAndBindProfile(function(err) {
          
          // If err, first time so I define the currency rate by language
          if (err) {
            var rateCode = uxLanguage.getRateCode(lang);

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
                });
              });
              $log.debug('Setting default currency : ' + newAltCurrency);
            });
          };
        });
      });
      
      if (screen.width < 768 && platformInfo.isCordova)
        screen.lockOrientation('portrait');

      if (ionic.Platform.isAndroid() && platformInfo.isCordova && StatusBar) {
        StatusBar.backgroundColorByHexString('#FBFCFF');
      }

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard && !platformInfo.isWP) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      window.addEventListener('native.keyboardshow', function() {
        document.body.classList.add('keyboard-open');
      });

      $ionicPlatform.registerBackButtonAction(function(e) {

        //from root tabs view
        var matchHome = $ionicHistory.currentStateName() == 'tabs.home' ? true : false;
        var matchReceive = $ionicHistory.currentStateName() == 'tabs.receive' ? true : false;
        var matchScan = $ionicHistory.currentStateName() == 'tabs.scan' ? true : false;
        var matchSend = $ionicHistory.currentStateName() == 'tabs.send' ? true : false;
        var matchSettings = $ionicHistory.currentStateName() == 'tabs.settings' ? true : false;

        var fromTabs = matchHome | matchReceive | matchScan | matchSend | matchSettings;

        //onboarding with no back views
        var matchCollectEmail = $ionicHistory.currentStateName() == 'onboarding.collectEmail' ? true : false;
        var noBackView = $ionicHistory.backView().stateName == 'starting' ? true : false;

        var fromOnboarding = matchCollectEmail ;

        //views with disable backbutton
        var matchComplete = $ionicHistory.currentStateName() == 'tabs.rate.complete' ? true : false;
        var matchLockedView = $ionicHistory.currentStateName() == 'lockedView' ? true : false;
        var matchPin = $ionicHistory.currentStateName() == 'pin' ? true : false;

        if ($ionicHistory.backView() && !fromTabs && !fromOnboarding && !matchComplete && !matchPin && !matchLockedView) {
          $ionicHistory.goBack();
        } else
        if ($rootScope.backButtonPressedOnceToExit) {
          navigator.app.exitApp();
        } else {
          $rootScope.backButtonPressedOnceToExit = true;
          $rootScope.$apply(function() {
            ionicToast.show(gettextCatalog.getString('Press again to exit'), 'bottom', false, 1000);
          });
          $timeout(function() {
            $rootScope.backButtonPressedOnceToExit = false;
          }, 3000);
        }
        e.preventDefault();
      }, 101);

      $ionicPlatform.on('pause', function() {
        // Nothing to do
      });

      $ionicPlatform.on('resume', function() {
        applicationService.appLockModal('check');
      });

      $ionicPlatform.on('menubutton', function() {
        window.location = '#/preferences';
      });

      $log.info('Init profile...');
      // Try to open local profile
      profileService.loadAndBindProfile(function(err) {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        if (err) {
          if (err.message && err.message.match('NOPROFILE')) {
            $log.debug('No profile... redirecting');
            $state.go('onboarding.tour');
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            $scope.setRateByLanguage();
            if (lodash.isEmpty(profileService.getWallets())) {
              $log.debug('No wallets and no disclaimer... redirecting');
              $state.go('onboarding.tour');
            } else {
              $log.debug('Display disclaimer... redirecting');
              $state.go('onboarding.disclaimer', {
                resume: true
              });
            }
          } else {
            throw new Error(err); // TODO
          }
        } else {
          profileService.storeProfileIfDirty();
          $log.debug('Profile loaded ... Starting UX.');
          scannerService.gentleInitialize();
          // Reload tab-home if necessary (from root path: starting)
          $state.go('starting', {}, {
            'reload': true,
            'notify': $state.current.name == 'starting' ? false : true
          }).then(function() {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              historyRoot: true
            });
            $state.transitionTo('tabs.home').then(function() {
              // Clear history
              $ionicHistory.clearHistory();
            });
            applicationService.appLockModal('check');
          });
        };
        
        // After everything have been loaded
        $timeout(function() {
          emailService.init(); // Update email subscription if necessary
          openURLService.init();
        }, 1000);
      });
    });

    if (platformInfo.isNW) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin(appConfigService.nameCase);
      } catch (e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }
    
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (document.body.classList.contains('keyboard-open')) {
        document.body.classList.remove('keyboard-open');
        $log.debug('Prevented keyboard open bug..');
      }

      $log.debug('Route change from:', fromState.name || '-', ' to:', toState.name);
      $log.debug('            toParams:' + JSON.stringify(toParams || {}));
      $log.debug('            fromParams:' + JSON.stringify(fromParams || {}));
    });
  });
