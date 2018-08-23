'use strict';

angular.module('copayApp.controllers').controller('amountController', amountController);

function amountController(configService, $filter, gettextCatalog, $ionicHistory, $ionicModal, $ionicScrollDelegate, lodash, $log, nodeWebkitService, rateService, $scope, $state, $timeout, sendFlowService, shapeshiftService, txFormatService, platformInfo, profileService, walletService, $window) {
  var vm = this;

  vm.allowSend = false;
  vm.altCurrencyList = [];
  vm.alternativeAmount = '';
  vm.alternativeUnit = '';
  vm.amount = '0';
  vm.availableFunds = '';
  // Use insufficient for logic, as when the amount is invalid, funds being
  // either sufficent or insufficient doesn't make sense.
  vm.fundsAreInsufficient = false;
  vm.globalResult = '';
  vm.isRequestingSpecificAmount = false;
  vm.listComplete = false;
  vm.lastUsedPopularList = [];
  vm.maxAmount = 0;
  vm.minAmount = 0;
  vm.thirdParty = false;
  vm.unit = '';

  vm.changeUnit = changeUnit;
  vm.close = close;
  vm.findCurrency = findCurrency;
  vm.finish = finish;
  vm.goBack = goBack;
  vm.loadMore = loadMore;
  vm.next = next;
  vm.openPopup = openPopup;
  vm.pushDigit = pushDigit;
  vm.removeDigit = removeDigit;
  vm.save = save;
  vm.sendMax = sendMax;
  vm.errorMessage = '';

  $scope.$on('$ionicView.beforeEnter', onBeforeEnter);
  $scope.$on('$ionicView.leave', onLeave);

  var LENGTH_EXPRESSION_LIMIT = 19;
  var LENGTH_BEFORE_COMMA_EXPRESSION_LIMIT = 8;
  var LENGTH_AFTER_COMMA_EXPRESSION_LIMIT = 8;

  var altCurrencyModal = null;
  var altUnitIndex = 0;
  var availableFundsInCrypto = '';
  var availableFundsInFiat = '';
  var availableSatoshis = null;
  var availableUnits = [];
  var fiatCode;
  var isNW = platformInfo.isNW;
  var isAndroid = platformInfo.isAndroid;
  var isIos = platformInfo.isIOS;
  var lastUsedAltCurrencyList = [];
  var passthroughParams = {};
  var satToUnit;
  var unitDecimals;
  var unitIndex = 0;
  var unitToSatoshi;
  var useSendMax = false;

  function onLeave() {
    angular.element($window).off('keydown');
  }

  function onBeforeEnter(event, data) {
    if (data.direction == "back") {
      sendFlowService.popState();
    }
    console.log('amount onBeforeEnter after back sendflow ', sendFlowService.state);
    
    initCurrencies();

    passthroughParams = sendFlowService.getStateClone();

    vm.fromWalletId = passthroughParams.fromWalletId;
    vm.toWalletId = passthroughParams.toWalletId;
    vm.minAmount = parseFloat(passthroughParams.minAmount);
    vm.maxAmount = parseFloat(passthroughParams.maxAmount);

    if (passthroughParams.thirdParty) {
      vm.thirdParty = passthroughParams.thirdParty; // Parse stringified JSON-object
      if (vm.thirdParty) {
        if (vm.thirdParty.id === 'shapeshift') {
          if (!vm.thirdParty.data) {
            vm.thirdParty.data = {};
          }
          vm.thirdParty.data['fromWalletId'] = vm.fromWalletId;

          vm.fromWallet = profileService.getWallet(vm.fromWalletId);
          vm.toWallet = profileService.getWallet(vm.toWalletId);

          shapeshiftService.getMarketData(vm.fromWallet.coin, vm.toWallet.coin, function(data) {
            vm.thirdParty.data['minAmount'] = vm.minAmount = parseFloat(data.minimum);
            vm.thirdParty.data['maxAmount'] = vm.maxAmount = parseFloat(data.maxLimit);
          });
        }
      }
    }

    vm.isRequestingSpecificAmount = !passthroughParams.fromWalletId;

    var config = configService.getSync().wallet.settings;

    setAvailableUnits();
    updateUnitUI();

    var reNr = /^[1234567890\.]$/;
    var reOp = /^[\*\+\-\/]$/;

    if (!isAndroid && !isIos) {
      var disableKeys = angular.element($window).on('keydown', function(e) {
        if (!e.key) return;
        if (e.which === 8) { // you can add others here inside brackets.
          if (!altCurrencyModal) {
            e.preventDefault();
            vm.removeDigit();
          }
        }

        if (e.key.match(reNr)) {
          vm.pushDigit(e.key);
        } else if (e.key.match(reOp)) {
          pushOperator(e.key);
        } else if (e.keyCode === 86) {
          if (e.ctrlKey || e.metaKey) processClipboard();
        } else if (e.keyCode === 13) vm.finish();

        $timeout(function() {
          $scope.$apply();
        });
      });
    }

    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitDecimals = config.unitDecimals;

    resetAmount();

    processAmount();

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);

    function setAvailableUnits() {
      var defaults = configService.getDefaults();
      var configCache = configService.getSync();
      availableUnits = [];

      var coinFromWallet = '';
      if (passthroughParams.fromWalletId) {
        var fromWallet = profileService.getWallet(passthroughParams.fromWalletId);
        coinFromWallet = fromWallet.coin;
      } else {
        var toWallet = profileService.getWallet(passthroughParams.toWalletId);
        coinFromWallet = toWallet.coin;
      }

      if (coinFromWallet === 'bch') {
        availableUnits.push({
          name: 'Bitcoin Cash',
          id: 'bch',
          shortName: (configCache.bitcoinCashAlias || defaults.bitcoinCashAlias).toUpperCase(),
        });
      };

      if (coinFromWallet === 'btc') {
        availableUnits.push({
          name: 'Bitcoin',
          id: 'btc',
          shortName: (configCache.bitcoinAlias || defaults.bitcoinAlias).toUpperCase(),
        });
      }

      unitIndex = 0;


      //  currency have preference
      var fiatName;
      if (passthroughParams.currency) {
        fiatCode = passthroughParams.currency;
        altUnitIndex = unitIndex
        unitIndex = availableUnits.length;
      } else {
        fiatCode = config.alternativeIsoCode || 'USD';
        fiatName = config.alternanativeName || fiatCode;
        altUnitIndex = availableUnits.length;
      }

      availableUnits.push({
        name: fiatName || fiatCode,
        // TODO
        id: fiatCode,
        shortName: fiatCode,
        isFiat: true,
      });

      unitIndex = lodash.findIndex(availableUnits, {
        isFiat: true
      });

      altUnitIndex = 0;

      if (passthroughParams.fromWalletId) {
        var fromWallet = profileService.getWallet(passthroughParams.fromWalletId);
        updateAvailableFundsFromWallet(fromWallet);
      }
    }
  }

  function goBack() {
    $ionicHistory.goBack();
  }

  function paste(value) {
    vm.amount = value;
    processAmount();
    $timeout(function() {
      $scope.$apply();
    });
  }

  function processClipboard() {
    if (!isNW) return;
    var value = nodeWebkitService.readFromClipboard();
    if (value && evaluate(value) > 0) paste(evaluate(value));
  }

  function sendMax() {
    useSendMax = true;
    finish();
  }

  function updateUnitUI() {
    vm.unit = availableUnits[unitIndex].shortName;
    vm.alternativeUnit = availableUnits[altUnitIndex].shortName;

    processAmount();
    $log.debug('Update unit coin @amount unit:' + vm.unit + " alternativeUnit:" + vm.alternativeUnit);
  }

  function changeUnit() {

    vm.amount = '0';

    if (!(availableUnits[unitIndex].isFiat && availableUnits.length > 2 && altUnitIndex == 0)) {
      unitIndex++;
      if (unitIndex >= availableUnits.length) unitIndex = 0;
    }

    if (availableUnits[unitIndex].isFiat) {
      altUnitIndex = altUnitIndex == 0 && availableUnits.length > 2 ? 1 : 0;
    } else {
      altUnitIndex = lodash.findIndex(availableUnits, {
        isFiat: true
      });
    }

    updateAvailableFundsStringIfNeeded();
    updateUnitUI();
  }

  function pushDigit(digit) {
    if (vm.amount && digit != '.') {
      var amountSplitByComma = vm.amount.split('.');
      if (amountSplitByComma.length > 1 && amountSplitByComma[1].length >= LENGTH_AFTER_COMMA_EXPRESSION_LIMIT) return;
      if (amountSplitByComma.length == 1 && amountSplitByComma[0].length >= LENGTH_BEFORE_COMMA_EXPRESSION_LIMIT) return;
    }

    if (vm.amount && vm.amount.length >= LENGTH_EXPRESSION_LIMIT) return;
    if (vm.amount.indexOf('.') > -1 && digit == '.') return;
    if (vm.amount == '0' && digit == '0') return;
    if (availableUnits[unitIndex].isFiat && vm.amount.indexOf('.') > -1 && vm.amount[vm.amount.indexOf('.') + 2]) return;
    
    if (vm.amount == '0' && digit != '.') {
      vm.amount = '';
    }

    if (vm.amount == '' && digit == '.') {
      vm.amount = '0';
    }

    vm.amount = (vm.amount + digit).replace('..', '.');
    processAmount();
  }

  function pushOperator(operator) {
    if (!vm.amount || vm.amount.length == 0) return;
    vm.amount = pushOperator(vm.amount);

    function pushOperator(val) {
      if (!isOperator(lodash.last(val))) {
        return val + operator;
      } else {
        return val.slice(0, -1) + operator;
      }
    }
  }

  function isOperator(val) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  }

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  }

  function removeDigit() {
    vm.amount = (vm.amount).toString().slice(0, -1);
    processAmount();
  }

  function resetAmount() {
    vm.amount = vm.alternativeAmount = vm.globalResult = '0';
    vm.allowSend = false;
  }
  

  function openPopup() {
    $ionicModal.fromTemplateUrl('views/modals/altCurrency.html', {
      scope: $scope
    }).then(function(modal) {
      altCurrencyModal = modal;
      altCurrencyModal.show();
    });
  }

  function close() {
    altCurrencyModal.remove();
    altCurrencyModal = null;
  }

  function processAmount() {
    var formatedValue = format(vm.amount);
    var result = evaluate(formatedValue);

    var amountInCrypto = 0;

    if (lodash.isNumber(result)) {
      vm.globalResult = isExpression(vm.amount) ? '= ' + processResult(result) : '';

      if (availableUnits[unitIndex].isFiat) {

        var a = fromFiat(result);
        if (a) {
          amountInCrypto = a;
          var amountInSatoshis = a * unitToSatoshi;
          vm.fundsAreInsufficient = !!passthroughParams.fromWalletId 
            && availableSatoshis !== null 
            && availableSatoshis < amountInSatoshis;

          vm.alternativeAmount = txFormatService.formatAmount(amountInSatoshis, true);
          vm.allowSend = lodash.isNumber(a)
            && a > 0
            && (!vm.minAmount || a >= vm.minAmount)
            && (!vm.maxAmount || a <= vm.maxAmount)
            && !vm.fundsAreInsufficient;
        } else {
          if (result) {
            vm.alternativeAmount = 'N/A';
          } else {
            vm.alternativeAmount = null;
          }
          vm.fundsAreInsufficient = false;
          vm.allowSend = false;
        }
      } else {
        amountInCrypto = result;
        vm.fundsAreInsufficient = passthroughParams.fromWalletId 
          && availableSatoshis !== null 
          && availableSatoshis < result * unitToSatoshi;

        vm.alternativeAmount = $filter('formatFiatAmount')(toFiat(result));
        vm.allowSend = lodash.isNumber(result)
          && result > 0
          && (!vm.minAmount || result >= vm.minAmount)
          && (!vm.maxAmount || result <= vm.maxAmount)
          && !vm.fundsAreInsufficient;
      }

    } else {
      vm.fundsAreInsufficient = false;
    }

    if (vm.fundsAreInsufficient) {
      vm.errorMessage = gettextCatalog.getString('Not enough available funds');

    } else if (amountInCrypto && vm.thirdParty && vm.thirdParty.id === 'shapeshift') {
      if (amountInCrypto < vm.minAmount) {
        vm.errorMessage = gettextCatalog.getString('Amount is below minimum');

      } else if (amountInCrypto > vm.maxAmount) {
        vm.errorMessage = gettextCatalog.getString('Amount is above maximum');

      } else {
        vm.errorMessage = '';
      }
    } else {
      vm.errorMessage = '';
    }
  }

  function processResult(val) {
    if (availableUnits[unitIndex].isFiat) return $filter('formatFiatAmount')(val);
    else return txFormatService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);
  }

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, fiatCode, availableUnits[altUnitIndex].id) * satToUnit).toFixed(unitDecimals));
  }

  function toFiat(val) {
    if (!rateService.getRate(fiatCode)) return;

    return parseFloat((rateService.toFiat(val * unitToSatoshi, fiatCode, availableUnits[unitIndex].id)).toFixed(2));
  }

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) return 0;
    return result;
  }

  function format(val) {
    if (!val) return;

    var result = val.toString();

    if (isOperator(lodash.last(val))) result = result.slice(0, -1);

    return result.replace('x', '*');
  }

  function finish() {
    var unit = availableUnits[unitIndex];
    var uiAmount = evaluate(format(vm.amount));

    var satoshis = 0;
    if (unit.isFiat) {
      satoshis = (fromFiat(uiAmount) * unitToSatoshi).toFixed(0);
    } else {
      satoshis = (uiAmount * unitToSatoshi).toFixed(0);
    }

    var confirmData = {
      amount: useSendMax ? undefined : satoshis,
      displayAddress: passthroughParams.displayAddress,
      fromWalletId: passthroughParams.fromWalletId,
      sendMax: useSendMax,
      toAddress: passthroughParams.toAddress,
      toWalletId: passthroughParams.toWalletId
    };

    if (vm.thirdParty) {
      confirmData.thirdParty = vm.thirdParty;
    }

    sendFlowService.pushState(confirmData);
    if (!confirmData.fromWalletId) {
      $state.transitionTo('tabs.paymentRequest.confirm', confirmData);
    } else {
      $state.transitionTo('tabs.send.review', confirmData);
      $scope.useSendMax = null;
    }
  }


  // Currency

  var nextCurrencies = 10;
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
  ];

  function initCurrencies() {
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

      vm.listComplete = false;

      var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
      var idx2 = lodash.indexBy(lastUsedAltCurrencyList, 'isoCode');
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

      vm.altCurrencyList = completeAlternativeList.slice(0, 10);
      vm.lastUsedPopularList = lodash.unique(lodash.union(lastUsedAltCurrencyList, popularCurrencyList), 'isoCode');

      rateService.updateRates();

      $timeout(function() {
        $scope.$apply();
      });
    });
  }

  function loadMore() {
    $timeout(function() {
      vm.altCurrencyList = completeAlternativeList.slice(0, nextCurrencies);
      nextCurrencies += 10;
      vm.listComplete = vm.altCurrencyList.length >= completeAlternativeList.length;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  }

  function next() {
    useSendMax = false;
    vm.finish();
  }

  function findCurrency(search) {
    if (!search) initCurrencies();
    var list = lodash.unique(lodash.union(completeAlternativeList, lodash.union(lastUsedAltCurrencyList, popularCurrencyList)), 'isoCode');
    vm.altCurrencyList = lodash.filter(list, function(item) {
      var val = item.name
      var val2 = item.isoCode;
      return lodash.includes(val.toLowerCase(), search.toLowerCase()) || lodash.includes(val2.toLowerCase(), search.toLowerCase());
    });
    $timeout(function() {
      $scope.$apply();
    });
  }

  function save(newAltCurrency) {
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
      walletService.updateRemotePreferences(profileService.getWallets());
      var altUnitIndex = lodash.findIndex(availableUnits, {
        isFiat: true
      });
      availableUnits[altUnitIndex].id = newAltCurrency.isoCode;
      availableUnits[altUnitIndex].name = newAltCurrency.isoCode;
      availableUnits[altUnitIndex].shortName = newAltCurrency.isoCode;
      fiatCode = newAltCurrency.isoCode;
      updateAvailableFundsStringIfNeeded();
      updateUnitUI();
      close();
    });
  }

  function updateAvailableFundsStringIfNeeded() {
    if (passthroughParams.fromWalletId && availableSatoshis !== null) {
      availableFundsInFiat = '';
      vm.availableFunds = availableFundsInCrypto;

      if (availableUnits[unitIndex].isFiat) {
        var coin = availableUnits[altUnitIndex].id;
        txFormatService.formatAlternativeStr(coin, availableSatoshis, function formatCallback(formatted){
          if (formatted) {
            availableFundsInFiat = formatted;

            $scope.$apply(function() {
              vm.availableFunds = availableFundsInFiat;
            });
          }
        });
      }
    }
  }

  function updateAvailableFundsFromWallet(wallet) {
    if (wallet.status && wallet.status.isValid) {
      availableFundsInCrypto = wallet.status.spendableBalanceStr;
      availableSatoshis = wallet.status.spendableAmount;
      if (wallet.status.alternativeBalanceAvailable) {
        availableFundsInFiat = wallet.status.spendableBalanceAlternative + ' ' + wallet.status.alternativeIsoCode;
      } else {
        availableFundsInFiat = '';
      }

    } else if (wallet.cachedStatus && wallet.status.isValid) {

      if (wallet.cachedStatus.alternativeBalanceAvailable) {
        availableFundsInFiat = wallet.cachedStatus.spendableBalanceAlternative + ' ' + wallet.cachedStatus.alternativeIsoCode;
      } else {
        availableFundsInFiat = '';
      }
      availableFundsInCrypto = wallet.cachedStatus.spendableBalanceStr;
      availableSatoshis = wallet.cachedStatus.spendableAmount;

    } else {

      availableFundsInFiat = '';
      availableFundsInCrypto = '';
      availableSatoshis = null;
    }

    if (availableUnits[unitIndex].isFiat) {
      vm.availableFunds = availableFundsInFiat || availableFundsInCrypto;
    } else {
      vm.availableFunds = availableFundsInCrypto;
    }
  }
}
