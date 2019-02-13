'use strict';

(function () {

angular
  .module('copayApp.controllers')
  .controller('walletSelectorController', walletSelectorController);

  function walletSelectorController (
    configService
    , gettextCatalog
    , ongoingProcess
    , profileService
    , $scope
    , sendFlowService
    , $state
    , $timeout
    , txFormatService
    , walletService
    ) {
    var fromWalletId = '';
    var priceDisplayAsFiat = false;
    var unitDecimals = 0;
    var unitsFromSatoshis = 0;

    //
    // Needs to migrate $scope to vm.
    //
    function initVariables() {
      // Private variables
      fromWalletId = '';
      priceDisplayAsFiat = false;
      unitDecimals = 0;
      unitsFromSatoshis = 0;
    }

    $scope.$on("$ionicView.beforeEnter", onBeforeEnter);
    
    function onBeforeEnter(event, data) {
      if (data.direction == "back") {
        sendFlowService.state.pop();
      }

      // Init before entering on this screen
      initVariables();
      // Then start

      $scope.params = sendFlowService.state.getClone();

      console.log('walletSelector onBeforeEnter after back sendflow', $scope.params);

      var config = configService.getSync().wallet.settings;
      $scope.selectedPriceDisplay = config.priceDisplay;
      priceDisplayAsFiat = config.priceDisplay === 'fiat';
      unitDecimals = config.unitDecimals;
      unitsFromSatoshis = 1 / config.unitToSatoshi;

      if ($scope.params.isWalletTransfer) {
        $scope.sendFlowTitle = gettextCatalog.getString('Transfer between wallets');
      } else if (!$scope.params.thirdParty) {
        $scope.sendFlowTitle = gettextCatalog.getString('Send');
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
        // Third party services specific logic
        handleThirdPartyIfSideshift();
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
            $scope.$apply();
          }
        }); 
      }
    }

    function handleThirdPartyIfSideshift() {
      console.log($scope.params.thirdParty, $scope.coin);
      if ($scope.params.thirdParty.id === 'sideshift') {
        $scope.sendFlowTitle = gettextCatalog.getString('Exchange');

        if ($scope.type === 'destination') { // Sideshift wants to know the
          $scope.coin = profileService.getWallet(fromWalletId).coin;
          if ($scope.coin === 'bch') {
            $scope.coin = 'btc';
          } else {
            $scope.coin = 'bch';
          }
        }
      }
    }

    function prepareWalletLists() {
      var walletsAll = [];
      var walletsSufficientFunds = [];
      $scope.walletsInsufficientFunds = []; // For origin screen
      $scope.walletsBtc = [];
      $scope.walletsBch = [];

      if ($scope.type === 'origin') {
        $scope.headerTitle = gettextCatalog.getString('Choose a wallet to send from');

        if ($scope.params.amount || $scope.coin) {

          ongoingProcess.set('scanning', true);
          walletsAll = profileService.getWallets({coin: $scope.coin});
          walletsAll.forEach(function forWallet(wallet) {
            var walletStatus = null;
            if (wallet.status && wallet.status.isValid) {
              walletStatus = wallet.status;
            } else if (wallet.cachedStatus && wallet.cachedStatus.isValid) {
              walletStatus = wallet.cachedStatus;
            }

            if (!walletStatus) {
              walletService.getStatus(wallet, {}, function onStatus(err, status) {
                
                if (err) {
                  console.error('Failed to get status for wallet list.', err);

                  $timeout(function onTimeout() { // because of async
                      $scope.walletsInsufficientFunds.push(wallet);

                      ongoingProcess.set('scanning', false);
                  }, 60);
                  return;
                }

                wallet.status = status;

                $timeout(function onTimeout() { // because of async
                  if (status.availableBalanceSat > ($scope.params.amount ? $scope.params.amount : 0)) {
                    if (wallet.coin === 'btc') {
                      $scope.walletsBtc.push(wallet);
                    } else {
                      $scope.walletsBch.push(wallet);
                    }
                  } else {
                    $scope.walletsInsufficientFunds.push(wallet);
                  }

                  ongoingProcess.set('scanning', false);
                }, 60);
              });
            } else {
              $timeout(function onTimeout() { // because of async
                if (walletStatus && walletStatus.availableBalanceSat > ($scope.params.amount ? $scope.params.amount : 0)) {
                  walletsSufficientFunds.push(wallet);
                  if (wallet.coin === 'btc') {
                    $scope.walletsBtc.push(wallet);
                  } else {
                    $scope.walletsBch.push(wallet);
                  }
                } else {
                  $scope.walletsInsufficientFunds.push(wallet);
                }
                ongoingProcess.set('scanning', false);
              }, 60);
            }
          });
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
      var params = sendFlowService.state.getClone();
      if ($scope.type === 'origin') { // we're on the origin screen, set wallet to send from
        params.fromWalletId = wallet.id;
      } else { // we're on the destination screen, set wallet to send to
        params.toWalletId = wallet.id;
      }
      sendFlowService.goNext(params);
    };

    $scope.goBack = function() {
      sendFlowService.router.goBack();
    }

  }
})();