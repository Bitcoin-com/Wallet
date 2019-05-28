'use strict';

(function(){

  angular
    .module('copayApp.controllers')
    .controller('txDetailsController', txDetailsController);
    
  function txDetailsController(
    bitcoinCashJsService
    , configService
    , externalLinkService
    , feeService
    , gettextCatalog
    , $ionicHistory
    , lodash
    , $log
    , ongoingProcess
    , popupService
    , profileService
    , $rootScope
    , satoshiDiceService
    , $scope
    , $timeout
    , txConfirmNotification
    , txFormatService
    , walletHistoryService
    , walletService
    ) {

    var vm = this;
    
    // Functions
    vm.displayAddress = displayAddress;
    vm.getSatoshiDiceIconUrl = getSatoshiDiceIconUrl;
    vm.getShortNetworkName = getShortNetworkName;
    vm.readMore = readMore;
    vm.txConfirmNotificationChange = txConfirmNotificationChange;
    vm.updateNote = updateNote;
    vm.viewOnBlockchain = viewOnBlockchain;

    // Variables
    vm.actionList = [];
    vm.addressDisplayType = 'legacy';
    vm.alternativeAmountWhenSent = '';
    vm.alternativeIsoCode = '';
    vm.btx = null;
    vm.canToggleAddressType = false;
    vm.cardId = '';
    vm.color = '';
    vm.copayerId = '';
    vm.isShared = false;
    vm.rate = '';
    vm.rateDate = '';
    vm.title = '';
    vm.toName = '';
    vm.txNotification = {};
    vm.txsUnsubscribedForNotifications = true;
    $scope.wallet = null; // Used by an include

    var txId = '';
    var listeners = [];
    var config = configService.getSync();
    var defaults = configService.getDefaults();
    var blockexplorerUrl = '';

    $scope.$on("$ionicView.beforeEnter", _onBeforeEnter);
    $scope.$on("$ionicView.leave", _onLeave);

    function getSatoshiDiceIconUrl() {
      return satoshiDiceService.iconUrl;
    }
    
    function _onBeforeEnter(event, data) {
      txId = data.stateParams.txid;
      vm.title = gettextCatalog.getString('Transaction');
      $scope.wallet = profileService.getWallet(data.stateParams.walletId);
      vm.color = $scope.wallet.color;
      vm.copayerId = $scope.wallet.credentials.copayerId;
      vm.isShared = $scope.wallet.credentials.n > 1;
      vm.txsUnsubscribedForNotifications = config.confirmedTxsNotifications ? !config.confirmedTxsNotifications.enabled : true;

      blockexplorerUrl = defaults.blockExplorer[$scope.wallet.coin];

      vm.canToggleAddressType = false;

      txConfirmNotification.checkIfEnabled(txId, function(res) {
        vm.txNotification = {
          value: res
        };
      });

      updateTx();

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') {
            updateTxDebounced({
              hideLoading: true
            });
          }
        })
      ];
    };

    
    function _onLeave(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    };

    

    function readMore() {
      var url = 'https://walletsupport.bitcoin.com/article/101/transaction-fees';
      var optIn = true;
      var title = null;
      var message = gettextCatalog.getString('Read more in our Wiki');
      var okText = gettextCatalog.getString('Open');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    function updateMemo() {
      walletService.getTxNote($scope.wallet, vm.btx.txid, function(err, note) {
        if (err) {
          $log.warn('Could not fetch transaction note: ' + err);
          return;
        }
        if (!note) return;

        vm.btx.note = note;
        $scope.$apply();
      });
    }

    function initActionList() {
      vm.actionList = [];
      if (vm.btx.action != 'sent' || !vm.isShared) return;

      var actionDescriptions = {
        created: gettextCatalog.getString('Proposal Created'),
        accept: gettextCatalog.getString('Accepted'),
        reject: gettextCatalog.getString('Rejected'),
        broadcasted: gettextCatalog.getString('Broadcasted'),
      };

      vm.actionList.push({
        type: 'created',
        time: vm.btx.createdOn,
        description: actionDescriptions['created'],
        by: vm.btx.creatorName
      });

      lodash.each(vm.btx.actions, function(action) {
        vm.actionList.push({
          type: action.type,
          time: action.createdOn,
          description: actionDescriptions[action.type],
          by: action.copayerName
        });
      });

      vm.actionList.push({
        type: 'broadcasted',
        time: vm.btx.time,
        description: actionDescriptions['broadcasted'],
      });

      $timeout(function() {
        vm.actionList.reverse();
      }, 10);
    }

    function updateTx(opts) {
      opts = opts || {};
      if (!opts.hideLoading) ongoingProcess.set('loadingTxInfo', true);
      walletService.getTx($scope.wallet, txId, function onTx(err, tx) {
        if (!opts.hideLoading) ongoingProcess.set('loadingTxInfo', false);
        if (err) {
          $log.warn('Error getting transaction: ' + err);
          $ionicHistory.goBack();
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not available at this time'));
        }

        vm.btx = txFormatService.processTx($scope.wallet.coin, tx);
        vm.addressDisplayType = 'legacy';

        var cashaddrDate = new Date(2018, 0, 15);
        var txDate = new Date((vm.btx.createdOn || vm.btx.time) * 1000);

        if ($scope.wallet.coin == 'bch' && txDate >= cashaddrDate) {
          if (vm.btx.action === 'sent') {
            var bchAddresses = bitcoinCashJsService.translateAddresses(vm.btx.addressTo);
            vm.btx.cashAddr = bchAddresses.cashaddr;
            vm.btx.cashCopyAddr = 'bitcoincash:' + vm.btx.cashAddr;
          }
          
          lodash.each(vm.btx.outputs, function(output) {
            var bchAddresses = bitcoinCashJsService.translateAddresses(output.address);
            output.cashAddr = bchAddresses.cashaddr;
            output.cashCopyAddr = 'bitcoincash:' + output.cashAddr;
          });

          vm.canToggleAddressType = true;
          vm.addressDisplayType = 'cashAddr';
        }

        vm.btx.displayAddress = vm.btx.addressTo;
        vm.btx.copyAddress = vm.btx.displayAddress;

        txFormatService.formatAlternativeStr($scope.wallet.coin, tx.fees, function(v) {
          vm.btx.feeFiatStr = v;
          vm.btx.feeRateStr = (vm.btx.fees / (vm.btx.amount + vm.btx.fees) * 100).toFixed(2) + '%';
        });

        if (vm.btx.action != 'invalid') {
          if (vm.btx.action == 'sent') vm.title = gettextCatalog.getString('Sent Funds');
          if (vm.btx.action == 'received') vm.title = gettextCatalog.getString('Received Funds');
          if (vm.btx.action == 'moved') vm.title = gettextCatalog.getString('Moved Funds');
        }

        updateMemo();
        initActionList();
        getFiatRate();
        $timeout(function() {
          $scope.$digest();
        });

        feeService.getFeeLevels($scope.wallet.coin, function(err, levels) {
          if (err) return;
          walletService.getLowAmount($scope.wallet, levels, function(err, amount) {
            if (err) return;
            if ($scope.wallet.coin == 'bch') return;

            vm.btx.lowAmount = tx.amount < amount;

            $timeout(function() {
              $scope.$apply();
            });

          });
        });
      });
    };

    var updateTxDebounced = lodash.debounce(updateTx, 5000);

    function updateNote(text) {
      if (typeof text === "undefined") return;
      vm.btx.note = {
        body: text
      };

      $log.debug('Saving memo');

      var args = {
        txid: vm.btx.txid,
        body: text
      };

      walletService.editTxNote($scope.wallet, args, function onEditTxNote(err, res) {
        if (err) {
          $log.debug('Could not save tx comment ' + err);
        }
      });
    }

    function viewOnBlockchain() {
      var btx = vm.btx;
      var url = 'https://' + (vm.getShortNetworkName() == 'test' ? 'test-' : '') + blockexplorerUrl + '/tx/' + btx.txid + '?utm_source=bitcoincomwallet';
      externalLinkService.open(url, false);
    };

    function getShortNetworkName() {
      var n = $scope.wallet.credentials.network;
      return n.substring(0, 4);
    };

    var getFiatRate = function() {
      vm.alternativeIsoCode = $scope.wallet.status.alternativeIsoCode;
      $scope.wallet.getFiatRate({
        code: vm.alternativeIsoCode,
        ts: vm.btx.time * 1000
      }, function onFiatRate(err, res) {
        if (err) {
          $log.debug('Could not get historic rate');
          return;
        }
        if (res && res.rate) {
          vm.rateDate = res.fetchedOn;
          vm.rate = res.rate;

          vm.alternativeAmountWhenSent = (vm.btx.amount / config.wallet.settings.unitToSatoshi) * res.rate;
        }
      });
    };

     function txConfirmNotificationChange() {
      if (vm.txNotification.value) {
        txConfirmNotification.subscribe($scope.wallet, {
          txid: txId
        });
      } else {
        txConfirmNotification.unsubscribe($scope.wallet, txId);
      }
    };

    function displayAddress(type) {
      vm.addressDisplayType = type;
    }

  };

})();