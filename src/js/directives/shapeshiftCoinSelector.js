'use strict';

angular.module('copayApp.directives').directive('shapeshiftCoinSelector', function(shapeshiftApiService) {
    return {
        require:['^shapeshiftCoinTrader'],
        restrict: 'E',
        transclude: false,
        scope: {
            coins: '=coins',
            label:'=label',
            selectedCoin:'=selectedCoin',
            getMarketData: '=getMarketData',
            amount:'=amount',
            marketData:'=marketData',
            coinAddress:'=coinAddress',
            walletId:'=walletId',
            direction:'=direction',
        },
        link: function(scope, element, attrs, controllers) {
            var coinTraderCtrl = controllers[0];

            scope.selectedCoinModel = {
              coin: scope.selectedCoin
            }

            scope.$watch('selectedCoin', function(newVal) {
              scope.getMarketData(newVal);
            });

            scope.$watch('coinAddress', function(newVal) {
                if(scope.direction === 'in')
                    coinTraderCtrl.returnAddress(newVal);
                else if(scope.direction === 'out')
                    coinTraderCtrl.withdrawalAddress(newVal);
            });
            scope.$watch('amount', function(newVal) {
                coinTraderCtrl.amount(newVal)
            });
            scope.$watch('walletId', function(newVal) {
              if(scope.direction === 'in')
                  coinTraderCtrl.fromWalletId(newVal);
              else if(scope.direction === 'out')
                  coinTraderCtrl.toWalletId(newVal);
            });
        },
        templateUrl: 'views/includes/shapeshift-coin-selector.html'
    }
});
