'use strict';

angular.module('copayApp.directives').directive('shapeshiftCoinTrader', function($interval, shapeshiftApiService, profileService) {
  return {
    restrict: 'E',
    transclude: true,
    controller: function($scope, $q) {
        $scope.ShiftState = 'Shift';
        $scope.withdrawalAddress = ''
        $scope.returnAddress = ''
        $scope.amount = '';
        $scope.marketData = {}
        this.withdrawalAddress = function(address) {
            $scope.withdrawalAddress = address;
        };
        this.returnAddress = function(address) {
            $scope.returnAddress = address;
        };
        this.amount = function(amount) {
            $scope.amount = amount;
        };

        $scope.getMarketDataIn = function(coin) {
            if(coin === $scope.coinOut) return $scope.getMarketData($scope.coinOut, $scope.coinIn);
            return $scope.getMarketData(coin, $scope.coinOut);
        };
        $scope.getMarketDataOut = function(coin) {
            if(coin === $scope.coinIn) return $scope.getMarketData($scope.coinOut, $scope.coinIn);
            return $scope.getMarketData($scope.coinIn, coin);
        };
        $scope.getMarketData = function(coinIn, coinOut) {
            $scope.coinIn = coinIn;
            $scope.coinOut= coinOut;
            if($scope.coinIn === undefined || $scope.coinOut === undefined) return;
            shapeshiftApiService
                .marketInfo($scope.coinIn, $scope.coinOut)
                .then(function(marketData){
                    $scope.marketData = marketData;
            });
        };

        /*shapeshiftApiService.coins().then(function(coins){
            $scope.coins = coins;
            $scope.coinIn = coins['BTC'].symbol;
            $scope.coinOut = coins['BCH'].symbol;
            $scope.getMarketData($scope.coinIn, $scope.coinOut);
        });*/

        $scope.coins = {
          'BTC': { name: 'Bitcoin', symbol: 'BTC' },
          'BCH': { name: 'Bitcoin Cash', symbol: 'BCH' }
        };
        $scope.coinIn = $scope.coins['BTC'].symbol;
        $scope.coinOut = $scope.coins['BCH'].symbol;
        $scope.getMarketData($scope.coinIn, $scope.coinOut);

        function checkForError(data){
            if(data.error) return true;
            return false;
        }

        $scope.shiftIt = function(){
            console.log($scope.coinOut)
            var validate=shapeshiftApiService.ValidateAddress($scope.withdrawalAddress, $scope.coinOut);
            validate.then(function(valid){
                console.log($scope.withdrawalAddress)
                console.log(valid)
                var tx = ShapeShift();
                tx.then(function(txData){
                    if(txData['fixedTxData']){
                        txData = txData.fixedTxData;
                        if(checkForError(txData)) return;
                        console.log(txData)
                        var coinPair=txData.pair.split('_');
                        txData.depositType = coinPair[0].toUpperCase();
                        txData.withdrawalType = coinPair[1].toUpperCase();
                        var coin = $scope.coins[txData.depositType].name.toLowerCase();
                        console.log(coin)
                        txData.depositQR = coin + ":" + txData.deposit + "?amount=" + txData.depositAmount
                        $scope.txFixedPending = true;
                    } else if(txData['normalTxData']){
                        txData = txData.normalTxData;
                        if(checkForError(txData)) return;
                        var coin = $scope.coins[txData.depositType.toUpperCase()].name.toLowerCase();
                        txData.depositQR = coin + ":" + txData.deposit;

                    } else if(txData['cancelTxData']){
                        if(checkForError(txData.cancelTxData)) return;
                        if($scope.txFixedPending) {
                            $interval.cancel($scope.txInterval);
                            $scope.txFixedPending = false;
                        }
                        $scope.ShiftState = 'Shift';
                        return;
                    }
                    $scope.depositInfo = txData;
                    console.log($scope.depositInfo)
                    $scope.ShiftState = 'Cancel';
                    $scope.GetStatus();
                    $scope.txInterval=$interval($scope.GetStatus, 8000);
                });
            })
        };

        function ShapeShift() {
            if($scope.ShiftState === 'Cancel') return shapeshiftApiService.CancelTx($scope);
            if(parseFloat($scope.amount) > 0) return shapeshiftApiService.FixedAmountTx($scope);
            return shapeshiftApiService.NormalTx($scope);
        }

        $scope.GetStatus = function(){
            var address = $scope.depositInfo.deposit
            shapeshiftApiService.GetStatusOfDepositToAddress(address).then(function(data){
                $scope.DepositStatus = data;
                if($scope.DepositStatus.status === 'complete'){
                    $interval.cancel($scope.txInterval);
                    $scope.depositInfo = null;
                    $scope.ShiftState = 'Shift'
                }
            });
        }

        $scope.walletsBtc = profileService.getWallets({coin: 'btc'});
        $scope.walletsBch = profileService.getWallets({coin: 'bch'});
        $scope.fromWallet = $scope.walletsBtc[0];
        $scope.toWallet = $scope.walletsBch[0];
        $scope.fromWalletSelectorTitle = 'From';
        $scope.toWalletSelectorTitle = 'To';
        $scope.showFromWallets = false;
        $scope.showFromWalletSelector = function() {
          $scope.showFromWallets = true;
        }
        $scope.showToWallets = false;
        $scope.showToWalletSelector = function() {
          $scope.showToWallets = true;
        }

        $scope.onFromWalletSelect = function(wallet) {
          $scope.fromWallet = wallet;
          //setProtocolHandler();
          //$scope.setAddress();
        };

        $scope.onToWalletSelect = function(wallet) {
          $scope.toWallet = wallet;
          //setProtocolHandler();
          //$scope.setAddress();
        }
    },
    templateUrl: 'views/includes/shapeshift-coin-trader.html'
  }
});
