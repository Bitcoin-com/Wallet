'use strict';

(function(){
  angular
    .module('copayApp.controllers')
    .controller('preferencesCashShuffleController', preferencesCashShuffleController);

  function preferencesCashShuffleController(
    bitcoinCashJsService
    , bwcError
    , clipboardService
    , configService
    , gettextCatalog
    , $interval
    , $ionicHistory
    , $ionicModal
    , $ionicNavBarDelegate
    , $ionicPopover
    , lodash
    , $log
    , platformInfo
    , popupService
    , profileService
    , $rootScope
    , $scope
    , sendFlowService
    , soundService
    , $state 
    , storageService
    , $timeout
    , txFormatService
    , walletAddressListenerService
    , walletService
    , $ionicScrollDelegate
    , $filter
    , $stateParams
    , txpModalService
    , externalLinkService
    , addressbookService
    , $window
    , timeService
    , feeService
    , appConfigService
    , rateService
    , walletHistoryService
    , cashshuffleService
    , ongoingProcess
  ) {
    var _ = lodash;

    $scope.cs = cashshuffleService;

    $scope.useCustomServer = cashshuffleService.preferences.serverStatsUri !== cashshuffleService.defaultServerStatsUri;

    $scope.newServerValue = cashshuffleService.preferences.serverStatsUri;

    $scope.saveButtonText = 'Save';

    $scope.preferences = cashshuffleService.preferences;

    $scope.client = cashshuffleService.client;

    $scope.dirtyForm = false;

    $scope.toggleState = {
      cashShuffleEnabled: cashshuffleService.preferences && cashshuffleService.preferences.shufflingEnabled || false,
      onlySpendSuffle: cashshuffleService.preferences && cashshuffleService.preferences.spendOnlyShuffled || false
    };

    $scope.status = {
      coins: {
        all: [],
        shuffled: [],
        unshuffled: [],
        dust: [],
        shuffling: [],
        unconfirmed: []
      },
      stats: {
        totalBch: 0,
        percentComplete: 0,
        percentShuffleableComplete: 0
      }
    };

    $scope.showProgressBar = false;

    $scope.getProgressStat = function() {
      let shuffleProgress = $scope.status.stats.percentShuffleableComplete+'%';
      return shuffleProgress;
    };

    $scope.refreshPreferences = function() {
        cashshuffleService.fetchPreferences().then( function() {

          $scope.toggleState.cashShuffleEnabled = $scope.preferences.shufflingEnabled
          $scope.toggleState.onlySpendSuffle = $scope.preferences.spendOnlyShuffled;

          _.extend($scope.preferences, cashshuffleService.preferences);
          _.extend($scope.client, cashshuffleService.client);

          $timeout(function() {
            $scope.$apply();
          });
        });
    };

    $scope.toggleEnableShuffle = function() {
      $scope.preferences.shufflingEnabled = $scope.toggleState.cashShuffleEnabled;

      cashshuffleService.updateWalletPreferences();
      $timeout(function() {
        $scope.refreshPreferences();
      }, 200);
    };

    $scope.toggleOnlySpendShuffle = function() {
      $scope.preferences.spendOnlyShuffled = $scope.toggleState.onlySpendSuffle;
      cashshuffleService.updateWalletPreferences();
      $timeout(function() {
        $scope.refreshPreferences();
      }, 200);
    };

    $scope.saveCustomShuffleServer = function(restoreTheDefault) {

      try {
        $scope.cs.changeShuffleServer(restoreTheDefault ? $scope.cs.defaultServerStatsUri : $scope.cs.preferences.serverStatsUri);
        $scope.saveButtonText = 'Updated';
      }
      catch(nope) {
        $scope.saveButtonText = 'Save Error';
      }
  
      $timeout(function() {
        $scope.saveButtonText = 'Save';
        $scope.dirtyForm = false;
      }, 3000);

    };

    $scope.$on('$ionicView.enter', function(event, data) {
      $ionicNavBarDelegate.showBar(true);
      $scope.refreshPreferences();
      $scope.computeWalletStats();
    });

    $scope.toggleShuffleWallet = function(someWallet) {
        if (!someWallet) {
          return;
        }

        if (cashshuffleService.preferences.statusByWalletId[someWallet.id]) {
          _.set(cashshuffleService.preferences, 'statusByWalletId['+someWallet.id+']', false);
        }
        else {
          _.set(cashshuffleService.preferences, 'statusByWalletId['+someWallet.id+']', true);
        }

        cashshuffleService.updateWalletPreferences();
        $timeout(function() {
          $scope.refreshPreferences();
        }, 200);

    };

    $scope.computeWalletStats = _.throttle(function() {

      let newData = {
        coins: {
          all: [],
          shuffled: [],
          unshuffled: [],
          dust: [],
          shuffling: [],
          unconfirmed: []
        },
        stats: {
          totalBch: 0,
          unshuffled: 0,
          shuffling: 0,
          shuffled: 0,
          dust: 0,
          unconfirmed: 0
        },
        percentComplete: 0,
        percentShuffleableComplete: 0
      };

      let useWallets = _.filter($scope.getWallets(), { shuffleThisWallet: true });

      for (let oneWallet of useWallets) {
        for (let oneProperty of _.keys(oneWallet.coins)) {
          newData.coins[oneProperty] = newData.coins[oneProperty].concat(oneWallet.coins[oneProperty]);
        }

        for (let oneProperty of _.keys(oneWallet.stats)) {
          newData.stats[oneProperty] += oneWallet.stats[oneProperty];
        }
      }

      if (newData.stats.totalBch) {
        newData.stats.percentComplete = Math.floor(100*Number((newData.stats.shuffled/newData.stats.totalBch).toFixed(8)));
        newData.stats.percentShuffleableComplete = Math.floor( 100*Number( newData.stats.shuffled / ( newData.stats.totalBch === newData.stats.dust ? newData.stats.shuffled/newData.stats.shuffled : newData.stats.totalBch-newData.stats.dust ) ).toFixed(8));
      }

      $scope.showProgressBar = $scope.preferences.shufflingEnabled && useWallets.length >= 2 && newData.stats.totalBch ? true : false;
      _.extend($scope.status, newData);

      $timeout(function() {
        $scope.$apply();
      });
    }, 5000, { trailing: false });

    $scope.getWallets = _.throttle(function() {
        let returnThese = [];

        let bchWallets = profileService.getWallets({ coin: 'bch' });
        for (let oneWallet of bchWallets) {

          let allCoinsInWallet = _.filter(cashshuffleService.coinFactory.coins, { walletId: oneWallet.id });
          let shuffled = _.filter(allCoinsInWallet, { shuffled: true });
          let unshuffled = _.filter(allCoinsInWallet, { shuffled: false });
          let dust = _.filter(allCoinsInWallet, { isDust: true });
          let inShufflePool = _.filter(allCoinsInWallet, { inShufflePool: true });
          let unconfirmed = _.filter(allCoinsInWallet, { confirmations: 0 });

          let totalBchInWallet = _.sum(_.compact(_.map(allCoinsInWallet, 'amountBch')));
          let shuffledBchInWallet = _.sum(_.compact(_.map(shuffled, 'amountBch')));
          let unshuffledBchInWallet = _.sum(_.compact(_.map(unshuffled, 'amountBch')));
          let dustBchInWallet = _.sum(_.compact(_.map(dust, 'amountBch')));
          let shufflingBchInWallet = _.sum(_.compact(_.map(inShufflePool, 'amountBch')));
          let unconfirmedBchInWallet = _.sum(_.compact(_.map(unconfirmed, 'amountBch')));

          let useWalletMessage = shufflingBchInWallet ? 'Now Shuffling '+Number(shufflingBchInWallet.toFixed(5))+' BCH' : undefined;

          _.extend(oneWallet, {
            coins: {
              all: allCoinsInWallet,
              shuffled: shuffled,
              unshuffled: unshuffled,
              dust: dust,
              shuffling: inShufflePool,
              unconfirmed: unconfirmed
            },
            walletMessage: useWalletMessage,
            stats: {
              totalBch: Number(totalBchInWallet.toFixed(8)),
              unshuffled: Number(unshuffledBchInWallet.toFixed(8)),
              shuffling: Number(shufflingBchInWallet.toFixed(8)),
              shuffled: Number(shuffledBchInWallet.toFixed(8)),
              dust: Number(dustBchInWallet.toFixed(8)),
              unconfirmed: Number(unconfirmedBchInWallet.toFixed(8))
            },
            shuffleThisWallet: cashshuffleService.preferences.statusByWalletId[oneWallet.id],
            shufflingComplete: !_.find(allCoinsInWallet, { isDust: false, confirmations: 0, shuffled: false }) ? true : false
          });

          returnThese.push(oneWallet);
        }

        return returnThese;
    }, 1000, { trailing: false });

    let scopeEventListeners = [];

    cashshuffleService
    .serviceReady
    .then( function() {
      scopeEventListeners.push(
        $rootScope.$on('cashshuffle-update-ui', function() {
          try {
            $scope.computeWalletStats();
          }
          catch(nope) {
            return;
          }
        })
      );
    })
    .catch( function(someError) {
      console.log('CashShuffle is disabled or the CashShuffle service has failed', someError);
    });

    window.stuff = {
      scope: $scope,
      lodash: lodash,
      walletService: walletService,
      configService: configService,
      rateService: rateService,
      walletHistoryService: walletHistoryService,
      appConfigService: appConfigService,
      rootScope: $rootScope,
      cashshuffleService: cashshuffleService,
      coins: cashshuffleService.coinFactory.coins,
      profileService: profileService,
      allWallets: profileService.getWallets({ coin: 'bch' }),
      storageService: storageService
    }

  }
})();
