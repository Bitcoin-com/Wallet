'use strict';

angular.module('copayApp.controllers').controller('amountController', amountController);

function amountController(configService, $filter, $ionicHistory, $ionicModal, $ionicScrollDelegate, lodash, $log, nodeWebkitService, rateService, $scope, $state, $stateParams, $timeout, txFormatService, platformInfo, popupService, profileService, walletService, $window) {
  var vm = this;

  vm.allowSend = false;
  vm.altCurrencyList = [];
  vm.alternativeAmount = '';
  vm.alternativeUnit = '';
  vm.amount = '0';
  vm.availableFunds = '';
  vm.fromWalletId = '';
  // Use insufficient for logic, as when the amount is invalid, funds being
  // either sufficent or insufficient doesn't make sense.
  vm.fundsAreInsufficient = false;
  vm.globalResult = '';
  vm.hello = 'hi';
  vm.isRequestingSpecificAmount = false;
  vm.listComplete = false;
  vm.lastUsedPopularList = [];
  vm.maxShapeshiftAmount = 0;
  vm.minShapeshiftAmount = 0;
  vm.shapeshiftOrderId = '';
  vm.unit = '';

  vm.changeUnit = changeUnit;
  vm.close = close;
  vm.findCurrency = findCurrency;
  vm.finish = finish;
  vm.goBack = goBack;
  vm.loadMore = loadMore;
  vm.openPopup = openPopup;
  vm.pushDigit = pushDigit;
  vm.removeDigit = removeDigit;
  vm.save = save;
  vm.sendMax = sendMax;
  
  $scope.$on('$ionicView.beforeEnter', onBeforeEnter);
  $scope.$on('$ionicView.leave', onLeave); 

  var LENGTH_EXPRESSION_LIMIT = 19;
  var LENGTH_BEFORE_COMMA_EXPRESSION_LIMIT = 8;
  var LENGTH_AFTER_COMMA_EXPRESSION_LIMIT = 8;

  var _id;
  var altCurrencyModal = null;
  var altUnitIndex = 0;
  var availableFundsInCrypto = '';
  var availableFundsInFiat = '';
  var availableSatoshis = null;
  var availableUnits = [];
  var displayAddress = null;
  var fiatCode;
  var fixedUnit;
  var hasMaxAmount = true;
  var isNW = platformInfo.isNW;
  var isAndroid = platformInfo.isAndroid;
  var isIos = platformInfo.isIOS;
  var lastUsedAltCurrencyList = [];
  var nextStep = null;
  var unitToSatoshi;
  var recipientType = null;
  var satToUnit;
  var showMenu = false;
  var showWarningMessage = false;
  var toAddress = '';
  var toColor = null;
  var toEmail = null;
  var toName = null;
  var unitDecimals;
  var unitIndex = 0;
  var useSendMax = false;

  function onLeave() {
    angular.element($window).off('keydown');
  }

  function onBeforeEnter(event, data) {
  
    initCurrencies();
    vm.hello = 'greetings';
    if (data.stateParams.shapeshiftOrderId && data.stateParams.shapeshiftOrderId.length > 0) {
      vm.minShapeshiftAmount = parseFloat(data.stateParams.minShapeshiftAmount);
      vm.maxShapeshiftAmount = parseFloat(data.stateParams.maxShapeshiftAmount);
      vm.shapeshiftOrderId = data.stateParams.shapeshiftOrderId;
    }

    // To get the wallet from with the new flow
    vm.fromWalletId = data.stateParams.fromWalletId;

    if (data.stateParams.noPrefix) {
      showWarningMessage = data.stateParams.noPrefix != 0;
      if (showWarningMessage) {
        var message = 'Address doesn\'t contain currency information, please make sure you are sending the correct currency.';
        popupService.showAlert('', message, function() {}, 'Ok');
      }
    }

    vm.isRequestingSpecificAmount = !!data.stateParams.id;
    var config = configService.getSync().wallet.settings;

    // Go to...
    _id = data.stateParams.id; // Optional (BitPay Card ID or Wallet ID)
    nextStep = data.stateParams.nextStep;

    setAvailableUnits();
    updateUnitUI();

    if ($ionicHistory.backView().stateName == 'tabs.receive') {
      hasMaxAmount = false;
    }

    showMenu = $ionicHistory.backView() && ($ionicHistory.backView().stateName == 'tabs.send' || $ionicHistory.backView().stateName == 'tabs.bitpayCard');
    recipientType = data.stateParams.recipientType || null;
    toAddress = data.stateParams.toAddress;
    displayAddress = data.stateParams.displayAddress;
    toName = data.stateParams.toName;
    toEmail = data.stateParams.toEmail;
    toColor = data.stateParams.toColor;

    if (!nextStep && !data.stateParams.toAddress) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

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

    // in SAT ALWAYS
    if ($stateParams.toAmount) {
      vm.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
    }

    processAmount();

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);

    function setAvailableUnits() {
      var defaults = configService.getDefaults();
      var configCache = configService.getSync();
      availableUnits = [];

      var hasBCHWallets = profileService.getWallets({
        coin: 'bch'
      }).length;

      if (hasBCHWallets) {
        availableUnits.push({
          name: 'Bitcoin Cash',
          id: 'bch',
          shortName: (configCache.bitcoinCashAlias || defaults.bitcoinCashAlias).toUpperCase(),
        });
      };

      var hasBTCWallets = profileService.getWallets({
        coin: 'btc'
      }).length;

      if (hasBTCWallets) {
        availableUnits.push({
          name: 'Bitcoin',
          id: 'btc',
          shortName: (configCache.bitcoinAlias || defaults.bitcoinAlias).toUpperCase(),
        });
      }

      unitIndex = 0;

      if (data.stateParams.coin) {
        var coins = data.stateParams.coin.split(',');
        var newAvailableUnits = [];

        lodash.each(coins, function(c) {
          var coin = lodash.find(availableUnits, {
            id: c
          });
          if (!coin) {
            $log.warn('Could not find desired coin:' + data.stateParams.coin)
          } else {
            newAvailableUnits.push(coin);
          }
        });

        if (newAvailableUnits.length > 0) {
          availableUnits = newAvailableUnits;
        }
      }


      //  currency have preference
      var fiatName;
      if (data.stateParams.currency) {
        fiatCode = data.stateParams.currency;
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

      if (data.stateParams.fixedUnit) {
        fixedUnit = true;
      }

      unitIndex = lodash.findIndex(availableUnits, {
        isFiat: true
      });

      altUnitIndex = 0;

      if (vm.fromWalletId) {
        var fromWallet = profileService.getWallet(vm.fromWalletId);
        updateAvailableFundsFromWallet(fromWallet);
      }
    };
  };

  function goBack() {
    if (vm.shapeshiftOrderId) {
      $state.go('tabs.send').then(function() {
        $ionicHistory.clearHistory();
        $state.go('tabs.home').then(function() {
            $state.transitionTo('tabs.shapeshift');
        });
      });
    } else {
      $ionicHistory.goBack();
    }
  }

  function paste(value) {
    vm.amount = value;
    processAmount();
    $timeout(function() {
      $scope.$apply();
    });
  };

  function processClipboard() {
    if (!isNW) return;
    var value = nodeWebkitService.readFromClipboard();
    if (value && evaluate(value) > 0) paste(evaluate(value));
  };

  function sendMax() {
    useSendMax = true;
    finish();
  };

  function updateUnitUI() {
    vm.unit = availableUnits[unitIndex].shortName;
    vm.alternativeUnit = availableUnits[altUnitIndex].shortName;

    processAmount();
    $log.debug('Update unit coin @amount unit:' + vm.unit + " alternativeUnit:" + vm.alternativeUnit);
  };

  function changeUnit() {

    vm.amount = '0';

    if (fixedUnit) return;

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
  };

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
  };

  function pushOperator(operator) {
    if (!vm.amount || vm.amount.length == 0) return;
    vm.amount = pushOperator(vm.amount);

    function pushOperator(val) {
      if (!isOperator(lodash.last(val))) {
        return val + operator;
      } else {
        return val.slice(0, -1) + operator;
      }
    };
  };

  function isOperator(val) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  };

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
  };

  function processAmount() {
    var formatedValue = format(vm.amount);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      vm.globalResult = isExpression(vm.amount) ? '= ' + processResult(result) : '';

      if (availableUnits[unitIndex].isFiat) {

        var a = fromFiat(result);
        if (a) {
          var amountInSatoshis = a * unitToSatoshi;
          vm.fundsAreInsufficient = !!vm.fromWalletId 
            && availableSatoshis !== null 
            && availableSatoshis < amountInSatoshis;

          vm.alternativeAmount = txFormatService.formatAmount(amountInSatoshis, true);
          vm.allowSend = lodash.isNumber(a) 
            && a > 0
            && (!vm.shapeshiftOrderId
                || (a >= vm.minShapeshiftAmount && a <= vm.maxShapeshiftAmount))
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
        vm.fundsAreInsufficient = vm.fromWalletId 
          && availableSatoshis !== null 
          && availableSatoshis < result * unitToSatoshi;

        vm.alternativeAmount = $filter('formatFiatAmount')(toFiat(result));
        vm.allowSend = lodash.isNumber(result) 
          && result > 0
          && (!vm.shapeshiftOrderId
              || (result >= vm.minShapeshiftAmount && result <= vm.maxShapeshiftAmount))
          && !vm.fundsAreInsufficient;    
      }

    } else {
      vm.fundsAreInsufficient = false;
    }
  };

  function processResult(val) {
    if (availableUnits[unitIndex].isFiat) return $filter('formatFiatAmount')(val);
    else return txFormatService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);
  };

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, fiatCode, availableUnits[altUnitIndex].id) * satToUnit).toFixed(unitDecimals));
  };

  function toFiat(val) {
    if (!rateService.getRate(fiatCode)) return;

    return parseFloat((rateService.toFiat(val * unitToSatoshi, fiatCode, availableUnits[unitIndex].id)).toFixed(2));
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) return 0;
    return result;
  };

  function format(val) {
    if (!val) return;

    var result = val.toString();

    if (isOperator(lodash.last(val))) result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  function finish() {

    function finish() {
      var unit = availableUnits[unitIndex];
      var _amount = evaluate(format(vm.amount));
      var coin = unit.id;
      if (unit.isFiat) {
        coin = availableUnits[altUnitIndex].id;
      }

      if (nextStep) {
        $state.transitionTo(nextStep, {
          id: _id,
          amount: useSendMax ? null : _amount,
          currency: unit.id.toUpperCase(),
          coin: coin,
          useSendMax: useSendMax,
          fromWalletId: vm.fromWalletId
        });
      } else {
        var amount = _amount;

        if (unit.isFiat) {
          amount = (fromFiat(amount) * unitToSatoshi).toFixed(0);
        } else {
          amount = (amount * unitToSatoshi).toFixed(0);
        }

        var confirmData = {
          recipientType: recipientType,
          toAmount: amount,
          toAddress: toAddress,
          displayAddress: displayAddress || toAddress,
          toName: toName,
          toEmail: toEmail,
          toColor: toColor,
          coin: coin,
          useSendMax: useSendMax,
          fromWalletId: vm.fromWalletId
        };

        if (vm.shapeshiftOrderId) {
          var shapeshiftOrderUrl = 'https://www.shapeshift.io/#/status/';
          shapeshiftOrderUrl += vm.shapeshiftOrderId;
          confirmData.description = shapeshiftOrderUrl;
          confirmData.fromWalletId = vm.fromWalletId;

          if (confirmData.useSendMax) {
            var wallet = lodash.find(profileService.getWallets({ coin: coin }),
              function(w) {
                return w.id == vm.fromWalletId;
              });

            var balance = parseFloat(wallet.cachedBalance.substring(0, wallet.cachedBalance.length-4));
            if (balance < vm.minShapeshiftAmount * 1.04) {
              confirmData.useSendMax = false;
              confirmData.toAmount = vm.minShapeshiftAmount * unitToSatoshi;
            } else if (balance > vm.maxShapeshiftAmount) {
              confirmData.useSendMax = false;
              confirmData.toAmount = vm.maxShapeshiftAmount * unitToSatoshi * 0.99;
            }
          }
        }

        $state.transitionTo('tabs.send.confirm', confirmData);
      }
      useSendMax = null;
    }

    if (showWarningMessage) {
      var u = vm.unit == 'BCH' || vm.unit == 'BTC' ? vm.unit : vm.alternativeUnit;
      var message = 'Are you sure you want to send ' + u.toUpperCase()  + '?';
      popupService.showConfirm(message, '', 'Yes', 'No', function(res) {
        if (!res) {
          useSendMax = null;
          return;
        };
        finish();
      });
    } else {
      finish();
    }

  };


  // Currency

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
      vm.altCurrencyList = completeAlternativeList.slice(0, next);
      next += 10;
      vm.listComplete = vm.altCurrencyList.length >= completeAlternativeList.length;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  };

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
  };

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
  };
  
  function updateAvailableFundsStringIfNeeded() {
    if (vm.fromWalletId && availableSatoshis !== null) {
      availableFundsInFiat = '';
      vm.availableFunds = availableFundsInCrypto;
      var coin = availableUnits[altUnitIndex].isFiat ? availableUnits[unitIndex].id : availableUnits[altUnitIndex].id;
      txFormatService.formatAlternativeStr(coin, availableSatoshis, function formatCallback(formatted){
        if (formatted) {
          availableFundsInFiat = formatted;

          $scope.$apply(function() {
            if (availableUnits[unitIndex].isFiat) {
              vm.availableFunds = availableFundsInFiat;
            } else {
              vm.availableFunds = availableFundsInCrypto;
            }
          });
        }
      });
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
