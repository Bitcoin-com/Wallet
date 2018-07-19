'use strict';

angular.module('copayApp.controllers').controller('amountController', function($scope, $filter, $timeout, $ionicModal, $ionicScrollDelegate, $ionicHistory, storageService, walletService, gettextCatalog, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, txFormatService, ongoingProcess, popupService, bwcError, payproService, profileService, bitcore, amazonService, nodeWebkitService) {

  var _id;
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var SMALL_FONT_SIZE_LIMIT = 10;
  var LENGTH_EXPRESSION_LIMIT = 19;
  var LENGTH_BEFORE_COMMA_EXPRESSION_LIMIT = 8;
  var LENGTH_AFTER_COMMA_EXPRESSION_LIMIT = 8;
  var isNW = platformInfo.isNW;

  var unitIndex = 0;
  var altUnitIndex = 0;
  var availableUnits = [];
  var fiatCode;

  var fixedUnit;

  $scope.amountModel = { amount: 0 };

  $scope.isChromeApp = platformInfo.isChromeApp;
  $scope.isAndroid = platformInfo.isAndroid;
  $scope.isIos = platformInfo.isIOS;

  $scope.isRequestingSpecificAmount = false;

  $scope.$on('$ionicView.leave', function() {
    angular.element($window).off('keydown');
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    initCurrencies();

    if (data.stateParams.shapeshiftOrderId && data.stateParams.shapeshiftOrderId.length > 0) {
      $scope.minShapeshiftAmount = parseFloat(data.stateParams.minShapeshiftAmount);
      $scope.maxShapeshiftAmount = parseFloat(data.stateParams.maxShapeshiftAmount);
      $scope.shapeshiftOrderId = data.stateParams.shapeshiftOrderId;
    }

    // To get the wallet from with the new flow
    $scope.fromWalletId = data.stateParams.fromWalletId;

    if (data.stateParams.noPrefix) {
      $scope.showWarningMessage = data.stateParams.noPrefix != 0;
      if ($scope.showWarningMessage) {
        var message = 'Address doesn\'t contain currency information, please make sure you are sending the correct currency.';
        popupService.showAlert('', message, function() {}, 'Ok');
      }
    }

    $scope.isRequestingSpecificAmount = !!data.stateParams.id;

    var config = configService.getSync().wallet.settings;

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
    };

    // Go to...
    _id = data.stateParams.id; // Optional (BitPay Card ID or Wallet ID)
    $scope.nextStep = data.stateParams.nextStep;

    setAvailableUnits();
    updateUnitUI();

    $scope.hasMaxAmount = true;
    if ($ionicHistory.backView().stateName == 'tabs.receive') {
      $scope.hasMaxAmount = false;
    }

    $scope.showMenu = $ionicHistory.backView() && ($ionicHistory.backView().stateName == 'tabs.send' || $ionicHistory.backView().stateName == 'tabs.bitpayCard');
    $scope.recipientType = data.stateParams.recipientType || null;
    $scope.toAddress = data.stateParams.toAddress;
    $scope.displayAddress = data.stateParams.displayAddress;
    $scope.toName = data.stateParams.toName;
    $scope.toEmail = data.stateParams.toEmail;
    $scope.toColor = data.stateParams.toColor;

    if (!$scope.nextStep && !data.stateParams.toAddress) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    var reNr = /^[1234567890\.]$/;
    var reOp = /^[\*\+\-\/]$/;

    if (!$scope.isAndroid && !$scope.isIos) {
      var disableKeys = angular.element($window).on('keydown', function(e) {
        if (!e.key) return;
        if (e.which === 8) { // you can add others here inside brackets.
          if (!$scope.altCurrencyModal) {
            e.preventDefault();
            $scope.removeDigit();
          }
        }

        if (e.key.match(reNr)) {
          $scope.pushDigit(e.key);
        } else if (e.key.match(reOp)) {
          $scope.pushOperator(e.key);
        } else if (e.keyCode === 86) {
          if (e.ctrlKey || e.metaKey) processClipboard();
        } else if (e.keyCode === 13) $scope.finish();

        $timeout(function() {
          $scope.$apply();
        });
      });
    }

    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;

    $scope.resetAmount();

    // in SAT ALWAYS
    if ($stateParams.toAmount) {
      $scope.amountModel.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
    }

    $scope.processAmount();

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  });

  $scope.goBack = function() {
    if ($scope.shapeshiftOrderId) {
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
    $scope.amountModel.amount = value;
    $scope.processAmount();
    $timeout(function() {
      $scope.$apply();
    });
  };

  function processClipboard() {
    if (!isNW) return;
    var value = nodeWebkitService.readFromClipboard();
    if (value && evaluate(value) > 0) paste(evaluate(value));
  };

  $scope.sendMax = function() {
    $scope.useSendMax = true;
    $scope.finish();
  };

  $scope.toggleAlternative = function() {
    if ($scope.amountModel.amount && isExpression($scope.amountModel.amount)) {
      var amount = evaluate(format($scope.amountModel.amount));
      $scope.globalResult = '= ' + processResult(amount);
    }
  };

  function updateUnitUI() {
    $scope.unit = availableUnits[unitIndex].shortName;
    $scope.alternativeUnit = availableUnits[altUnitIndex].shortName;

    $scope.processAmount();
    $log.debug('Update unit coin @amount unit:' + $scope.unit + " alternativeUnit:" + $scope.alternativeUnit);
  };

  $scope.changeUnit = function() {

    $scope.amountModel.amount = '0';

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

    updateUnitUI();
  };


  $scope.changeAlternativeUnit = function() {

    // Do nothing is fiat is not main unit
    if (!availableUnits[unitIndex].isFiat) return;

    var nextCoin = lodash.findIndex(availableUnits, function(x) {
      if (x.isFiat) return false;
      if (x.id == availableUnits[altUnitIndex].id) return false;
      return true;
    });

    if (nextCoin >= 0) {
      altUnitIndex = nextCoin;
      updateUnitUI();
    }
  };

  function checkFontSize() {
    if ($scope.amountModel.amount && $scope.amountModel.amount.length >= SMALL_FONT_SIZE_LIMIT) $scope.smallFont = true;
    else $scope.smallFont = false;
  };

  $scope.pushDigit = function(digit) {
    if ($scope.amountModel.amount && digit != '.') {
      var amountSplitByComma = $scope.amountModel.amount.split('.');
      if (amountSplitByComma.length > 1 && amountSplitByComma[1].length >= LENGTH_AFTER_COMMA_EXPRESSION_LIMIT) return;
      if (amountSplitByComma.length == 1 && amountSplitByComma[0].length >= LENGTH_BEFORE_COMMA_EXPRESSION_LIMIT) return;
    }

    if ($scope.amountModel.amount && $scope.amountModel.amount.length >= LENGTH_EXPRESSION_LIMIT) return;
    if ($scope.amountModel.amount.indexOf('.') > -1 && digit == '.') return;
    if ($scope.amountModel.amount == '0' && digit == '0') return;
    if (availableUnits[unitIndex].isFiat && $scope.amountModel.amount.indexOf('.') > -1 && $scope.amountModel.amount[$scope.amountModel.amount.indexOf('.') + 2]) return;
    
    if ($scope.amountModel.amount == '0' && digit != '.') { 
      $scope.amountModel.amount = '';
    }

    if ($scope.amountModel.amount == '' && digit == '.') { 
      $scope.amountModel.amount = '0';
    }

    $scope.amountModel.amount = ($scope.amountModel.amount + digit).replace('..', '.');
    checkFontSize();
    $scope.processAmount();
  };

  $scope.pushOperator = function(operator) {
    if (!$scope.amountModel.amount || $scope.amountModel.amount.length == 0) return;
    $scope.amountModel.amount = _pushOperator($scope.amountModel.amount);

    function _pushOperator(val) {
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

  $scope.removeDigit = function() {
    $scope.amountModel.amount = ($scope.amountModel.amount).toString().slice(0, -1);
    $scope.processAmount();
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amountModel.amount = $scope.alternativeAmount = $scope.globalResult = '';
    $scope.allowSend = false;
    checkFontSize();
  };
  

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/modals/altCurrency.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.altCurrencyModal = modal;
      $scope.altCurrencyModal.show();
    });
  };

  $scope.close = function() {
    $scope.altCurrencyModal.remove();
    $scope.altCurrencyModal = false;
  };

  $scope.processAmount = function() {
    var formatedValue = format($scope.amountModel.amount);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      $scope.globalResult = isExpression($scope.amountModel.amount) ? '= ' + processResult(result) : '';

      if (availableUnits[unitIndex].isFiat) {

        var a = fromFiat(result);
        if (a) {
          $scope.alternativeAmount = txFormatService.formatAmount(a * unitToSatoshi, true);
          $scope.allowSend = lodash.isNumber(a) && a > 0
            && (!$scope.shapeshiftOrderId
                || (a >= $scope.minShapeshiftAmount && a <= $scope.maxShapeshiftAmount));
        } else {
          if (result) {
            $scope.alternativeAmount = 'N/A';
          } else {
            $scope.alternativeAmount = null;
          }
          $scope.allowSend = false;
        }
      } else {
        $scope.alternativeAmount = $filter('formatFiatAmount')(toFiat(result));
        $scope.allowSend = lodash.isNumber(result) && result > 0
          && (!$scope.shapeshiftOrderId
              || (result >= $scope.minShapeshiftAmount && result <= $scope.maxShapeshiftAmount));
      }
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

  $scope.finish = function() {

    function finish() {
      var unit = availableUnits[unitIndex];
      var _amount = evaluate(format($scope.amountModel.amount));
      var coin = unit.id;
      if (unit.isFiat) {
        coin = availableUnits[altUnitIndex].id;
      }

      if ($scope.nextStep) {
        $state.transitionTo($scope.nextStep, {
          id: _id,
          amount: $scope.useSendMax ? null : _amount,
          currency: unit.id.toUpperCase(),
          coin: coin,
          useSendMax: $scope.useSendMax,
          fromWalletId: $scope.fromWalletId
        });
      } else {
        var amount = _amount;

        if (unit.isFiat) {
          amount = (fromFiat(amount) * unitToSatoshi).toFixed(0);
        } else {
          amount = (amount * unitToSatoshi).toFixed(0);
        }

        var confirmData = {
          recipientType: $scope.recipientType,
          toAmount: amount,
          toAddress: $scope.toAddress,
          displayAddress: $scope.displayAddress || $scope.toAddress,
          toName: $scope.toName,
          toEmail: $scope.toEmail,
          toColor: $scope.toColor,
          coin: coin,
          useSendMax: $scope.useSendMax,
          fromWalletId: $scope.fromWalletId
        };

        if ($scope.shapeshiftOrderId) {
          var shapeshiftOrderUrl = 'https://www.shapeshift.io/#/status/';
          shapeshiftOrderUrl += $scope.shapeshiftOrderId;
          confirmData.description = shapeshiftOrderUrl;
          confirmData.fromWalletId = $scope.fromWalletId;

          if (confirmData.useSendMax) {
            var wallet = lodash.find(profileService.getWallets({ coin: coin }),
              function(w) {
                return w.id == $scope.fromWalletId;
              });

            var balance = parseFloat(wallet.cachedBalance.substring(0, wallet.cachedBalance.length-4));
            if (balance < $scope.minShapeshiftAmount * 1.04) {
              confirmData.useSendMax = false;
              confirmData.toAmount = $scope.minShapeshiftAmount * unitToSatoshi;
            } else if (balance > $scope.maxShapeshiftAmount) {
              confirmData.useSendMax = false;
              confirmData.toAmount = $scope.maxShapeshiftAmount * unitToSatoshi * 0.99;
            }
          }
        }

        $state.transitionTo('tabs.send.confirm', confirmData);
      }
      $scope.useSendMax = null;
    }

    if ($scope.showWarningMessage) {
      var u = $scope.unit == 'BCH' || $scope.unit == 'BTC' ? $scope.unit : $scope.alternativeUnit;
      var message = 'Are you sure you want to send ' + u.toUpperCase()  + '?';
      popupService.showConfirm(message, '', 'Yes', 'No', function(res) {
        if (!res) {
          $scope.useSendMax = null;
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
    if (!search) initCurrencies();
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
      walletService.updateRemotePreferences(profileService.getWallets());
      var altUnitIndex = lodash.findIndex(availableUnits, {
        isFiat: true
      });
      availableUnits[altUnitIndex].id = newAltCurrency.isoCode;
      availableUnits[altUnitIndex].name = newAltCurrency.isoCode;
      availableUnits[altUnitIndex].shortName = newAltCurrency.isoCode;
      fiatCode = newAltCurrency.isoCode;
      updateUnitUI();
      $scope.close();
    });
  };  
});
