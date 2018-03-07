'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($timeout, $scope, $log, $ionicModal, lodash, txpModalService, profileService, walletService, ongoingProcess, popupService, gettextCatalog, $state, $ionicNavBarDelegate) {
    $scope.openTxpModal = txpModalService.open;
    $scope.fetchingNotifications = true;

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          $log.error(err);
          return;
        }

        var txIdList = [];

        var notificationsBeforeCheck = n.length;

        for (var i=0; i<n.length; i++) {
            var txId = n[i].txid;
            if (txIdList.includes(txId)) {
                n.splice(i, 1);
                i = i - 1;
            } else {
                txIdList.push(txId)
            }
        }

        var notificationsAfterCheck = n.length;
        var removedNotifications = notificationsBeforeCheck - notificationsAfterCheck;

        console.log(n);

        $scope.fetchingNotifications = false;
        $scope.notifications = n;

        profileService.getTxps({}, function(err, txps, n) {
          if (err) $log.error(err);
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });

    $scope.openNotificationModal = function(n) {
      if (n.txid) {
        $state.transitionTo('tabs.wallet.tx-details', {
          txid: n.txid,
          walletId: n.walletId
        });
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) txpModalService.open(txp);
        else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(n.wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };
  });
