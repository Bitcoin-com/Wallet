'use strict';

angular.module('copayApp.services').factory('configService', function(storageService, lodash, $log, $timeout, $rootScope, platformInfo) {
  var root = {};

  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  var defaultConfig = {
    // wallet limits
    limits: {
      totalCopayers: 6,
      mPlusN: 100,
    },

    // Bitcore wallet service URL
    bws: {
      url: 'https://bws.bitcoin.com/bws/api'
    },

    bwscash: {
      url: 'https://bwscash.bitcoin.com/bws/api'
    },

    download: {
      bitpay: {
        url: 'https://wallet.bitcoin.com'
      },
      copay: {
        url: 'https://wallet.bitcoin.com'
      },
      bitcoincom: {
        url: 'https://wallet.bitcoin.com'
      }
    },

    blockExplorer: {
      btc: 'explorer.bitcoin.com/btc',
      bch: 'explorer.bitcoin.com/bch'
    },

    rateApp: {
      bitpay: {
        ios: 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=1149581638&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8',
        android: 'https://play.google.com/store/apps/details?id=com.bitpay.wallet',
        wp: ''
      },
      copay: {
        ios: 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=951330296&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8',
        android: 'https://play.google.com/store/apps/details?id=com.bitpay.copay',
        wp: ''
      },
      bitcoincom: {
        ios: 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=1252903728&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8',
        android: 'https://play.google.com/store/apps/details?id=com.bitcoin.mwallet',
        wp: ''
      }
    },
    // wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: true,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {
        unitName: 'BTC',
        unitToSatoshi: 100000000,
        unitDecimals: 8,
        unitCode: 'btc',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
        priceDisplay: 'fiat', // 'fiat' || 'crypto'
      }
    },

    lock: {
      method: null,
      value: null,
      bannedUntil: null,
    },

    cashSupport: true,

    recentTransactions: {
      enabled: true,
    },

    hideNextSteps: {
      enabled: isWindowsPhoneApp ? true : false,
    },

    rates: {
      url: 'https://insight.bitpay.com:443/api/rates',
    },

    release: {
      url: 'https://api.github.com/repos/Bitcoin-com/Wallet/releases/latest'
    },

    pushNotificationsEnabled: true,

    confirmedTxsNotifications: {
      enabled: true,
    },

    emailNotifications: {
      enabled: false,
    },

    soundsEnabled: true,

    log: {
      filter: 'debug',
    },

    bitcoinAlias: 'btc',
    bitcoinCashAlias: 'bch',
    bitcoinWalletColor: '#F9A254', // Light Orange
    bitcoinCashWalletColor: '#00BD89', // Shamrock
    bitcoinWalletColorIndex: 6, // Light Orange
    bitcoinCashWalletColorIndex: 5, // Shamrock

    homeSectionIsHidden: {
      services: false
    }
  };

  var configCache = null;

  root.getSync = function() {
    if (!configCache)
      throw new Error('configService#getSync called when cache is not initialized');
    return configCache;
  };

  root._queue = [];
  root.whenAvailable = function(cb) {
    if (!configCache) {
      root._queue.push(cb);
      return;
    }
    return cb(configCache);
  };


  root.get = function(cb) {
    storageService.getConfig(function(err, localConfig) {
      if (localConfig) {
        configCache = JSON.parse(localConfig);

        //these ifs are to avoid migration problems
        if (!configCache.bws) {
          configCache.bws = defaultConfig.bws;
        }
        if (!configCache.wallet) {
          configCache.wallet = defaultConfig.wallet;
        }
        if (!configCache.wallet.settings.unitCode) {
          configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
        }

        if (!configCache.hideNextSteps) {
          configCache.hideNextSteps = defaultConfig.hideNextSteps;
        }

        // Always support Bitcoin Cash
        configCache.cashSupport = true;

        if (!configCache.recentTransactions) {
          configCache.recentTransactions = defaultConfig.recentTransactions;
        }
        if (!configCache.pushNotifications) {
          configCache.pushNotifications = defaultConfig.pushNotifications;
        }
        if (!configCache.bitpayAccount) {
          configCache.bitpayAccount = defaultConfig.bitpayAccount;
        }

        if (configCache.wallet.settings.unitCode == 'bit') {
          // Convert to BTC. Bits will be disabled
          configCache.wallet.settings.unitName = defaultConfig.wallet.settings.unitName;
          configCache.wallet.settings.unitToSatoshi = defaultConfig.wallet.settings.unitToSatoshi;
          configCache.wallet.settings.unitDecimals = defaultConfig.wallet.settings.unitDecimals;
          configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
        }

        // If display is not configure, take the default value
        if (!configCache.wallet.settings.priceDisplay) {
          configCache.wallet.settings.priceDisplay = defaultConfig.wallet.settings.priceDisplay;
        }

        // Convert tarascash wallet to new style cash wallet
        if (configCache.bwsbcc && configCache.bwsbcc.url && configCache.bwsbcc.url.indexOf('bwsbcc') >= 0) {
          configCache.bwsbcc = defaultConfig.bwscash.url;
        }

        if (configCache.bwsFor) {
          for (var key in configCache.bwsFor) {
            if (configCache.bwsFor[key].indexOf('bwsbcc') >= 0) {
              configCache.bwsFor[key] = defaultConfig.bwscash.url;
            }
          }
        }
        
        if (!configCache.homeSectionIsHidden) {
          configCache.homeSectionIsHidden = defaultConfig.homeSectionIsHidden;
        }

      } else {
        configCache = lodash.clone(defaultConfig);
      };

      configCache.bwsFor = configCache.bwsFor || {};
      configCache.colorFor = configCache.colorFor || {};
      configCache.colorIndexFor = configCache.colorIndexFor || {};
      configCache.aliasFor = configCache.aliasFor || {};
      configCache.emailFor = configCache.emailFor || {};

      $log.debug('Preferences read:', configCache)

      lodash.each(root._queue, function(x) {
        $timeout(function() {
          return x(configCache);
        }, 1);
      });
      root._queue = [];

      return cb(err, configCache);
    });
  };

  root.set = function(newOpts, cb) {
    var config = lodash.cloneDeep(defaultConfig);
    storageService.getConfig(function(err, oldOpts) {
      oldOpts = oldOpts || {};

      if (lodash.isString(oldOpts)) {
        oldOpts = JSON.parse(oldOpts);
      }
      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOpts)) {
        newOpts = JSON.parse(newOpts);
      }

      lodash.merge(config, oldOpts, newOpts);
      configCache = config;

      $rootScope.$emit('Local/SettingsUpdated');

      storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  root.reset = function(cb) {
    configCache = lodash.clone(defaultConfig);
    storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultConfig);
  };

  return root;
});
