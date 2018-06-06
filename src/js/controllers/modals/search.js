'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, $ionicScrollDelegate, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService, externalLinkService, bitcoinCashJsService) {

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
      $scope.searchTermIsAddress = false;
      $scope.searchTermIsTxId = false;

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && $scope.addressbook && $scope.addressbook[tx.addressTo]) addrbook = $scope.addressbook[tx.addressTo].name || $scope.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';

        if ($scope.wallet.coin === 'bch') {

          /**
           * For each address
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

      if (search) {
        if ((search.indexOf('bitcoincash:') === 0 || search[0] === 'C' || search[0] === 'H' || search[0] === 'p' || search[0] === 'q') && search.replace('bitcoincash:', '').length === 42) { // CashAddr
          $scope.searchTermIsAddress = true;
        } else if ((search[0] === "1" || search[0] === "3" || search.substring(0, 3) === "bc1") && search.length >= 26 && search.length <= 35) { // Legacy Addresses
          $scope.searchTermIsAddress = true;
        } else if (search.length === 64) {
          $scope.searchTermIsTxId = true;
        }
      }

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

  $scope.searchOnBlockchain = function(searchTerm) {
    var url = 'https://explorer.bitcoin.com/'+$scope.wallet.coin+'/search/' + searchTerm;
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('Search on Explorer.Bitcoin.com');
    var okText = gettextCatalog.getString('Open Explorer');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

});
