'use strict';

angular.module('copayApp.directives').directive('sideshiftCoinTrader', function($interval, sideshiftApiService, profileService, incomingDataService, ongoingProcess) {
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
        this.fromWalletId = function(id) {
          $scope.fromWalletId = id;
        };
        this.toWalletId = function(id) {
          $scope.toWalletId = id;
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
            sideshiftApiService
                .marketInfo($scope.coinIn, $scope.coinOut)
                .then(function(marketData){
                    $scope.marketData = marketData;
                    $scope.rateString = $scope.marketData.rate.toString() + ' ' + coinOut.toUpperCase() + '/' + coinIn.toUpperCase();
            });
        };

        /*sideshiftApiService.coins().then(function(coins){
            $scope.coins = coins;
            $scope.coinIn = coins['BTC'].symbol;
            $scope.coinOut = coins['BCH'].symbol;
            $scope.getMarketData($scope.coinIn, $scope.coinOut);
        });*/

        $scope.coins = {
          'BTC': { name: 'Bitcoin', symbol: 'BTC' },
          'BCH': { name: 'Bitcoin Cash', symbol: 'BCH' }
        };

        function checkForError(data){
            if(data.error) return true;
            return false;
        }

        $scope.shiftIt = function(){
            ongoingProcess.set('connectingSideshift', true);
            var validate=sideshiftApiService.ValidateAddress($scope.withdrawalAddress, $scope.coinOut);
            validate.then(function(valid){
                //console.log($scope.withdrawalAddress)
                //console.log(valid)
                var tx = Sideshift();
                tx.then(function(txData){
                    if(txData['fixedTxData']){
                        txData = txData.fixedTxData;
                        if(checkForError(txData)) return;
                        //console.log(txData)
                        var coinPair=txData.pair.split('_');
                        txData.depositType = coinPair[0].toUpperCase();
                        txData.withdrawalType = coinPair[1].toUpperCase();
                        var coin = $scope.coins[txData.depositType].name.toLowerCase();
                        //console.log(coin)
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
                    //console.log($scope.marketData);
                    //console.log($scope.depositInfo);
                    var sendAddress = txData.depositQR;
                    if (sendAddress && sendAddress.indexOf('bitcoin cash') >= 0)
                      sendAddress = sendAddress.replace('bitcoin cash', 'bitcoincash');

                    var sideshiftData = {
                      fromWalletId: $scope.fromWalletId,
                      minAmount: $scope.marketData.minimum,
                      maxAmount: $scope.marketData.maxLimit,
                      orderId: $scope.depositInfo.orderId
                    };

                    // How to handle this
                    if (incomingDataService.redir(sendAddress, 'sideshift', sideshiftData)) {
                        ongoingProcess.set('connectingSideshift', false);
                        return;
                    }

                    /*$scope.ShiftState = 'Cancel';
                    $scope.GetStatus();
                    $scope.txInterval=$interval($scope.GetStatus, 8000);*/
                });
            })
        };

        function Sideshift() {
            if($scope.ShiftState === 'Cancel') return sideshiftApiService.CancelTx($scope);
            if(parseFloat($scope.amount) > 0) return sideshiftApiService.FixedAmountTx($scope);
            return sideshiftApiService.NormalTx($scope);
        }

        $scope.GetStatus = function(){
            var address = $scope.depositInfo.deposit
            sideshiftApiService.GetStatusOfDepositToAddress(address).then(function(data){
                $scope.DepositStatus = data;
                if($scope.DepositStatus.status === 'complete'){
                    $interval.cancel($scope.txInterval);
                    $scope.depositInfo = null;
                    $scope.ShiftState = 'Shift'
                }
            });
        }
    },
    templateUrl: 'views/includes/sideshift-coin-trader.html'
  }
});
