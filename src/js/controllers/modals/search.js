'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, $ionicScrollDelegate, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService, bitcoinCashJsService) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var wallet;
  var isCordova = platformInfo.isCordova;

  $scope.updateSearchInput = function(search) {
    if (isCordova)
      window.plugins.toast.hide();
    currentTxHistoryPage = 0;
    throttleSearch(search);
    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  }

  var throttleSearch = lodash.throttle(function(search) {

    function filter(search) {
      $scope.filteredTxHistory = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && $scope.addressbook && $scope.addressbook[tx.addressTo]) addrbook = $scope.addressbook[tx.addressTo].name || $scope.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';

        if ($scope.wallet.coin === 'bch') {

          /**
           * One tx in JSON
           * {"txid":"97ed105ea5042a328b68da43439b4..","action":"received","amount":730216,"fees":392,"time":1525661853,"confirmations":1459,"feePerKb":1074,"outputs":[{"amount":730216,"address":"19zA4aP1sAavtHF2wJcMpi..","message":null}],"message":null,"creatorName":"","hasUnconfirmedInputs":false,"amountStr":"0.00730216 BCH","alternativeAmountStr":"7.95 EUR","feeStr":"0.00000392 BCH","amountValueStr":"0.00730216","amountUnitStr":"BCH","safeConfirmed":"6+","lowAmount":false}
           * These two lines should be removed.. because tx.addressTo does not exist.
           * The address is in tx.outputs[..].address, cf. the JSON
           */
          var addr = bitcoinCashJsService.translateAddresses(addressTo);
          addressTo = addr.legacy + addr.bitpay + 'bitcoincash:' + addr.cashaddr

          /**
           * For each address (normally only one)
           * I translate the legacy address and add in the searchable string the 3 kind of addresses
           */
          lodash.each(tx.outputs, function(output) {
            var addr = bitcoinCashJsService.translateAddresses(output.address);
            addressTo += addr.legacy + addr.bitpay + 'bitcoincash:' + addr.cashaddr
          });
        }

        var txid = tx.txid ? tx.txid : '';
        return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment + txid).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var day = ('0' + date.getDate()).slice(-2).toString();
        var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        return [month, day, year].join('/');
      };

      if (lodash.isEmpty(search)) {
        $scope.txHistoryShowMore = false;
        return [];
      }

      $scope.filteredTxHistory = lodash.filter($scope.completeTxHistory, function(tx) {
        if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
        return lodash.includes(tx.searcheableString, search.toLowerCase());
      });

      if ($scope.filteredTxHistory.length > HISTORY_SHOW_LIMIT) $scope.txHistoryShowMore = true;
      else $scope.txHistoryShowMore = false;
      return $scope.filteredTxHistory;
    };

    $scope.txHistorySearchResults = filter(search).slice(0, HISTORY_SHOW_LIMIT);

    if (isCordova)
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + $scope.filteredTxHistory.length));

    $timeout(function() {
      $scope.$apply();
    });

  }, 1000);

  $scope.moreSearchResults = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.showHistory = function() {
    $scope.txHistorySearchResults = $scope.filteredTxHistory ? $scope.filteredTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT) : [];
    $scope.txHistoryShowMore = $scope.filteredTxHistory.length > $scope.txHistorySearchResults.length;
  };

});
