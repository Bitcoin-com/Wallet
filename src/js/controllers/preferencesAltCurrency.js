'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService, $ionicNavBarDelegate) {

    var next = 10;
    var completeAlternativeList = [];

    var popularCurrencyList = [
      {isoCode: 'USD', order: 0},
      {isoCode: 'EUR', order: 1},
      {isoCode: 'JPY', order: 2},
      {isoCode: 'GBP', order: 3},
      {isoCode: 'AUD', order: 4},
      {isoCode: 'CAD', order: 5},
      {isoCode: 'CHF', order: 6},
      {isoCode: 'CNY', order: 7},
      {isoCode: 'KRW', order: 8},
      {isoCode: 'HKD', order: 9},
    ]

    function init() {
      var unusedCurrencyList = [{
        isoCode: 'LTL'
      }, {
        isoCode: 'BTC'
      }, {
        isoCode: 'BCC'
      }, {
        isoCode: 'BCH_BTC'
      }, {
        isoCode: 'BCH'
      }];
      rateService.whenAvailable(function() {

        $scope.listComplete = false;

        var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
        var idx2 = lodash.indexBy($scope.lastUsedAltCurrencyList, 'isoCode');
        var idx3 = lodash.indexBy(popularCurrencyList, 'isoCode');
        var alternatives = rateService.listAlternatives(true);

        lodash.each(alternatives, function(c) {
          if (idx3[c.isoCode]) {
              idx3[c.isoCode].name = c.name;
          }
          if (!idx[c.isoCode] && !idx2[c.isoCode] && !idx3[c.isoCode]) {
            completeAlternativeList.push(c);
          }
        });

        $scope.altCurrencyList = completeAlternativeList.slice(0, 10);
        $scope.lastUsedPopularList = lodash.unique(lodash.union($scope.lastUsedAltCurrencyList, popularCurrencyList), 'isoCode');

        $timeout(function() {
          $scope.$apply();
        });
      });
    }

    $scope.loadMore = function() {
      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;
        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
    };

    $scope.findCurrency = function(search) {
      if (!search) init();
      var list = lodash.unique(lodash.union(completeAlternativeList, lodash.union($scope.lastUsedAltCurrencyList, popularCurrencyList)), 'isoCode');
      $scope.altCurrencyList = lodash.filter(list, function(item) {
        var val = item.name
        var val2 = item.isoCode;
        return lodash.includes(val.toLowerCase(), search.toLowerCase()) || lodash.includes(val2.toLowerCase(), search.toLowerCase());
      });
      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.save = function(newAltCurrency) {
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

        $ionicHistory.goBack();
        saveLastUsed(newAltCurrency);
        walletService.updateRemotePreferences(profileService.getWallets());
      });
    };

    function saveLastUsed(newAltCurrency) {
      $scope.lastUsedAltCurrencyList.unshift(newAltCurrency);
      $scope.lastUsedAltCurrencyList = lodash.uniq($scope.lastUsedAltCurrencyList, 'isoCode');
      $scope.lastUsedAltCurrencyList = $scope.lastUsedAltCurrencyList.slice(0, 3);
      storageService.setLastCurrencyUsed(JSON.stringify($scope.lastUsedAltCurrencyList), function() {});
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      var config = configService.getSync();
      $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;

      storageService.getLastCurrencyUsed(function(err, lastUsedAltCurrency) {
        $scope.lastUsedAltCurrencyList = lastUsedAltCurrency ? JSON.parse(lastUsedAltCurrency) : [];
        init();
      });
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });
  });
