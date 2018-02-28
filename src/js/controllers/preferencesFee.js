'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $q, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService, $ionicNavBarDelegate) {

  $scope.save = function(newFee) {

    $scope.currentFeeLevel = newFee;

    if ($scope.currentFeeLevel != 'custom') updateCurrentValues();
    else showCustomFeePrompt();

    if ($scope.noSave) return;

    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.init();
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.init = function() {
    $scope.network = $scope.network || 'livenet';
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = $scope.feeLevel || feeService.getCurrentFeeLevel();
    $scope.loadingFee = true;

    var btcFeePromise = $q(function(resolve, reject) {
      feeService.getFeeLevels('btc', function(err, btcFeeLevels) {
        if (err) {
          reject(err);
        } else {
          resolve(btcFeeLevels);
        }
      });
    });

    var bchFeePromise = $q(function(resolve, reject) {
      feeService.getFeeLevels('bch', function(err, bchFeeLevels) {
        if (err) {
          reject(err);
        } else {
          resolve(bchFeeLevels);
        }
      });
    });

    $q.all([btcFeePromise, bchFeePromise]).then(function(levels) {
        $scope.loadingFee = false;
        $scope.feeLevels = levels[0];
        $scope.bchFeeLevels = levels[1];
        updateCurrentValues();
        $timeout(function() {
          $scope.$apply();
        });
      }, function(err) {
        popupService.showAlert(err);
        return;
      });
  };

  var updateCurrentValues = function() {
    if (lodash.isEmpty($scope.feeLevels) || lodash.isEmpty($scope.currentFeeLevel)) return;

    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: $scope.currentFeeLevel
    });

    if (lodash.isEmpty(value)) {
      $scope.feePerSatByteBtc = $scope.currentFeeLevel == 'custom' ? $scope.feePerSatByteBtc : null;
      $scope.avgConfirmationTime = null;
      setMinWarning();
      setMaxWarning();
      return;
    }

    $scope.feePerSatByteBtc = (value.feePerKb / 1000).toFixed();
    $scope.avgConfirmationTime = value.nbBlocks * 10;
    $scope.invalidCustomFeeEntered = false;
    setMinWarning();
    setMaxWarning();

    if (lodash.isEmpty($scope.bchFeeLevels)) return;

    var bchValue = {};
    if ($scope.network == 'livenet') {
      bchValue = lodash.find($scope.bchFeeLevels[$scope.network], {
        level: 'normal'
      });
    } else {
      bchValue = lodash.find($scope.bchFeeLevels[$scope.network], {
        level: $scope.currentFeeLevel
      });
    }

    $scope.feePerSatByteBch = (bchValue.feePerKb / 1000).toFixed();
  };

  $scope.chooseNewFee = function() {
    $scope.hideModal($scope.currentFeeLevel, $scope.customFeePerKB);
  };

  var showCustomFeePrompt = function() {
    $scope.invalidCustomFeeEntered = true;
    $scope.showMaxWarning = false;
    $scope.showMinWarning = false;
    popupService.showPrompt(gettextCatalog.getString('Custom Fee'), gettextCatalog.getString('Set your own fee in satoshis/byte'), null, function(text) {
      if (!text || !parseInt(text) || parseInt(text) <= 0) return;
      $scope.feePerSatByteBtc = parseInt(text);
      $scope.customFeePerKB = ($scope.feePerSatByteBtc * 1000).toFixed();
      setMaxWarning();
      setMinWarning();
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.getMinimumRecommeded = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: 'superEconomy'
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  var setMinWarning = function() {
    if (parseInt($scope.feePerSatByteBtc) < $scope.getMinimumRecommeded()) $scope.showMinWarning = true;
    else $scope.showMinWarning = false;
  };

  var setMaxWarning = function() {
    if (parseInt($scope.feePerSatByteBtc) > 1000) {
      $scope.showMaxWarning = true;
      $scope.invalidCustomFeeEntered = true;
    } else {
      $scope.showMaxWarning = false;
      $scope.invalidCustomFeeEntered = false;
    }
  };

});
