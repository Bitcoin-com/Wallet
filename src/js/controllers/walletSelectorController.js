'use strict';

angular.module('copayApp.controllers').controller('walletSelectorController', function($scope, $rootScope, $state, $log, $ionicHistory, sendFlowService, configService, gettextCatalog, profileService, txFormatService) {

  var fromWalletId = '';
  var priceDisplayAsFiat = false;
  var unitDecimals = 0;
  var unitsFromSatoshis = 0;

  $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
  $scope.$on("$ionicView.enter", onEnter);
  
  function onBeforeEnter(event, data) {
    if (data.direction == "back") {
      sendFlowService.popState();
    }
    console.log('walletSelector onBeforeEnter after back sendflow', sendFlowService.state);

    $scope.params = sendFlowService.getStateClone();

    var config = configService.getSync().wallet.settings;
    priceDisplayAsFiat = config.priceDisplay === 'fiat';
    unitDecimals = config.unitDecimals;
    unitsFromSatoshis = 1 / config.unitToSatoshi;

    switch($state.current.name) {
      case 'tabs.send.wallet-to-wallet':
        $scope.sendFlowTitle = gettextCatalog.getString('Transfer between wallets');
        break;
      case 'tabs.send.destination':
        if ($scope.params.fromWalletId && !$scope.params.thirdParty) {
          $scope.sendFlowTitle = gettextCatalog.getString('Transfer between wallets');
        }
        break;
      default:
        if (!$scope.params.thirdParty) {
          $scope.sendFlowTitle = gettextCatalog.getString('Send');
        }
       // nop
    }

    $scope.coin = false; // Wallets to show (for destination screen or contacts)
    $scope.type = $scope.params['fromWalletId'] ? 'destination' : 'origin'; // origin || destination
    fromWalletId = $scope.params['fromWalletId'];

    if ($scope.type === 'destination' && $scope.params.toAddress) {
      $state.transitionTo(getNextStep($scope.params));
    }

    if ($scope.params.coin) {
      $scope.coin = $scope.params.coin; // Contacts have a coin embedded
    }

    if ($scope.params.amount) { // There is an amount, so presume that it is a payment request
      $scope.sendFlowTitle = gettextCatalog.getString('Payment Request');
      $scope.specificAmount = $scope.specificAlternativeAmount = '';
      $scope.isPaymentRequest = true;
    }
    if ($scope.params.thirdParty) {
      $scope.thirdParty = $scope.params.thirdParty;
    }
  };

  function onEnter (event, data) {
    configService.whenAvailable(function(config) {
      $scope.selectedPriceDisplay = config.wallet.settings.priceDisplay;
    });

    if ($scope.thirdParty) {
      // Third party services specific logic
      handleThirdPartyIfShapeshift();
    }

    prepareWalletLists();
    formatRequestedAmount();
  };

  function formatRequestedAmount() {
    if ($scope.params.amount) {
      var cryptoAmount = (unitsFromSatoshis * $scope.params.amount).toFixed(unitDecimals);
      var cryptoCoin = $scope.coin.toUpperCase();

      txFormatService.formatAlternativeStr($scope.coin, $scope.params.amount, function onFormatAlternativeStr(formatted){
        if (formatted) {
          var fiatParts = formatted.split(' ');
          var fiatAmount = fiatParts[0];
          var fiatCurrrency = fiatParts.length > 1 ? fiatParts[1] : '';

          if (priceDisplayAsFiat) {
            $scope.requestAmount = fiatAmount;
            $scope.requestCurrency = fiatCurrrency;

            $scope.requestAmountSecondary = cryptoAmount;
            $scope.requestCurrencySecondary = cryptoCoin;
          } else {
            $scope.requestAmount = cryptoAmount;
            $scope.requestCurrency = cryptoCoin;

            $scope.requestAmountSecondary = fiatAmount;
            $scope.requestCurrencySecondary = fiatCurrrency;
          }
        }
      }); 
    }
  }

  function getNextStep(params) {
    if (!params.toWalletId && !params.toAddress) { // If we have no toAddress or fromWallet
      return 'tabs.send.destination';
    } else if (!params.amount) { // If we have no amount
      return 'tabs.send.amount';
    } else { // If we do have them
      return 'tabs.send.review';
    }
  }

  function handleThirdPartyIfShapeshift() {
    console.log($scope.thirdParty, $scope.coin);
    if ($scope.thirdParty.id === 'shapeshift' && $scope.type === 'destination') { // Shapeshift wants to know the
      $scope.coin = profileService.getWallet(fromWalletId).coin;
      if ($scope.coin === 'bch') {
        $scope.coin = 'btc';
      } else {
        $scope.coin = 'bch';
      }
    } 
  }

  function prepareWalletLists() {
    var walletsAll = [];
    var walletsSufficientFunds = [];
    $scope.walletsInsufficientFunds = []; // For origin screen

    if ($scope.type === 'origin') {
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send from');

      if ($scope.params.amount) {

        walletsAll = profileService.getWallets({coin: $scope.coin});
        
        walletsAll.forEach(function forWallet(wallet){
          if (wallet.status.availableBalanceSat > $scope.params.amount) {
            walletsSufficientFunds.push(wallet);
          } else {
            $scope.walletsInsufficientFunds.push(wallet);
          }
        });

        if ($scope.coin === 'btc') {
          $scope.walletsBtc = walletsSufficientFunds;
        } else {
          $scope.walletsBch = walletsSufficientFunds;
        }

      } else if ($scope.coin) {
        walletsAll = profileService.getWallets({coin: $scope.coin});
        walletsAll.forEach(function forWallet(wallet){
          if (wallet.status.availableBalanceSat > 0) {
            walletsSufficientFunds.push(wallet);
          } else {
            $scope.walletsInsufficientFunds.push(wallet);
          }
        });

        if ($scope.coin === 'btc') {  
          $scope.walletsBtc = walletsSufficientFunds;
        } else {
          $scope.walletsBch = walletsSufficientFunds;
        }
      } else {
        $scope.walletsBch = profileService.getWallets({coin: 'bch', hasFunds: true});
        $scope.walletsBtc = profileService.getWallets({coin: 'btc', hasFunds: true});
        $scope.walletsInsufficientFunds = profileService.getWallets({coin: $scope.coin, hasNoFunds: true});
      }
      
    } else if ($scope.type === 'destination') {
      if (!$scope.coin) { // Allow for the coin to be set by a third party
        $scope.fromWallet = profileService.getWallet(fromWalletId);
        $scope.coin = $scope.fromWallet.coin; // Only show wallets with the select origin wallet coin
      }
      $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send to');

      if ($scope.coin === 'btc') { // if no specific coin is set or coin is set btc
        $scope.walletsBtc = profileService.getWallets({coin: $scope.coin});
      } else {
        $scope.walletsBch = profileService.getWallets({coin: $scope.coin});
      }
    }
  }

  

  $scope.useWallet = function(wallet) {
    var params = sendFlowService.getStateClone();
    if ($scope.type === 'origin') { // we're on the origin screen, set wallet to send from
      params.fromWalletId = wallet.id;
    } else { // we're on the destination screen, set wallet to send to
      params.toWalletId = wallet.id;
    }
    sendFlowService.pushState(params);
    var nextStep = getNextStep(params);
    console.log('walletSelector nextStep', nextStep);
    $state.transitionTo(nextStep, $scope.params);
  };

  $scope.goBack = function() {
    $ionicHistory.goBack();
  }

});