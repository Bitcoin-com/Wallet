'use strict';
angular.module('copayApp.services')
  .factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
    var root = {};

    root.currentLanguage = null;

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
      rateCode: 'USD'
    }, {
      name: 'Català',
      isoCode: 'ca',
      rateCode: 'EUR'
    }, {
      name: 'Čeština',
      isoCode: 'cs',
      rateCode: 'EUR'
    }, {
      name: 'Deutsch',
      isoCode: 'de',
      rateCode: 'EUR'
    }, {
      name: 'Español',
      isoCode: 'es',
      rateCode: 'EUR'
    }, {
      name: 'Français',
      isoCode: 'fr',
      rateCode: 'EUR'
    }, {
      name: 'Italiano',
      isoCode: 'it',
      rateCode: 'EUR'
    }, {
      name: 'Nederlands',
      isoCode: 'nl',
      rateCode: 'EUR'
    }, {
      name: 'Polski',
      isoCode: 'pl',
      rateCode: 'EUR'
    }, {
      name: '日本語',
      isoCode: 'ja',
      useIdeograms: true,
      rateCode: 'JPY'
    }, {
      name: '中文（简体）',
      isoCode: 'zh',
      useIdeograms: true,
      rateCode: 'CNY'
    }, {
      name: 'България',
      isoCode: 'bg',
      rateCode: 'BGN'
    }, {
      name: 'Pусский',
      isoCode: 'ru',
      rateCode: 'RUB'
    }, {
      name: 'Português',
      isoCode: 'pt',
      rateCode: 'EUR'
    }, {
      name: 'Svenska',
      isoCode: 'sv',
      rateCode: 'SEK'
    }, {
      name: '한국어',
      isoCode: 'ko',
      rateCode: 'KRW'
    }, {
      name: 'हिंदी',
      isoCode: 'hi',
      rateCode: 'INR'
    }, {
      name: 'ภาษาไทย',
      isoCode: 'th',
      rateCode: 'THB'
    }, {
      name: 'Tiếng Việt',
      isoCode: 'vi',
      rateCode: 'VND'
    }, {
      name: 'فارسی',
      isoCode: 'fa',
      rateCode: 'IRR'
    }];

    root._detect = function(cb) {
      var userLang, androidLang;
      if (navigator && navigator.globalization) {

        navigator.globalization.getPreferredLanguage(function(preferedLanguage) {
          // works for iOS and Android 4.x
          userLang = preferedLanguage.value;
          userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
          // Set only available languages
          userLang = root.isAvailableLanguage(userLang);
          return cb(userLang);
        });
      } else {
        // Auto-detect browser language
        userLang = navigator.userLanguage || navigator.language;
        userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
        // Set only available languages
        userLang = root.isAvailableLanguage(userLang);
        return cb(userLang);
      }
    };

    root.isAvailableLanguage = function(userLang) {
      return lodash.find(root.availableLanguages, {
        'isoCode': userLang
      }) ? userLang : 'en';
    };

    root._set = function(lang) {
      $log.debug('Setting default language: ' + lang);
      gettextCatalog.setCurrentLanguage(lang);
      root.currentLanguage = lang;

      if (lang == 'zh') lang = lang + '-CN'; // Fix for Chinese Simplified
      amMoment.changeLocale(lang);
    };

    root.getCurrentLanguage = function() {
      return root.currentLanguage;
    };

    root.getCurrentLanguageName = function() {
      return root.getName(root.currentLanguage);
    };

    root.getCurrentLanguageInfo = function() {
      return lodash.find(root.availableLanguages, {
        'isoCode': root.currentLanguage
      });
    };

    root.getLanguages = function() {
      return root.availableLanguages;
    };

    root.init = function(cb, cbSuccess) {
      configService.whenAvailable(function(config) {
        var userLang = config.wallet.settings.defaultLanguage;

        if (userLang && userLang != root.currentLanguage) {
          root._set(userLang);
          if (cb) return cb(userLang);
        } else {
          root._detect(function(lang) {
            root._set(lang);
            if (cb) return cb(lang);
          });
        }
      });
    };

    root.getName = function(lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        'isoCode': lang
      }), 'name');
    };

    root.getRateCode = function(lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        'isoCode': lang
      }), 'rateCode');
    };

    return root;
  });
