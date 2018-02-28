'use strict';

angular.module('copayApp.controllers').controller('pricechartController', function($scope, $q, $http, $timeout, $ionicModal, $log, $state, $ionicHistory, lodash, pricechartService, externalLinkService, popupService, $ionicNavBarDelegate) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var bchPriceUrl = 'https://index.bitcoin.com/api/v0/cash/history?unix=1&pretty=0';
    var btcPriceUrl = 'https://index.bitcoin.com/api/v0/history?unix=1&pretty=0';

    function getChartOptions() {
      var chartContainer = document.querySelector('.chart-container');
      var chartWidth = window.getComputedStyle(chartContainer).width;

      var options = {
        width: chartWidth,
        height: 250,
        // Don't draw the line chart points
        showPoint: false,
        // Disable line smoothing
        lineSmooth: false,
        fillOpacity: 1,
        // X-Axis specific configuration
        axisX: {
          type: Chartist.FixedScaleAxis,
          divisor: 5,
          labelInterpolationFnc: function (value) {
            return moment(value).format('MMM D');
          }
        },
        // Y-Axis specific configuration
        axisY: {
          type: Chartist.FixedScaleAxis,
          divisor: 5,
          // Lets offset the chart a bit from the labels
          offset: 70,
          low: 0,
          // The label interpolation function enables you to modify the values
          // used for the labels on each axis.
          labelInterpolationFnc: function (value) {
              return '$' + (value / 100).toFixed(2);
          }
        },
        showArea: true
      };

      return options;
    }

    function getChartData(url) {
      return $q(function(resolve, reject) {
        $http.get(url).then(function(priceData) {
          var priceSeries = priceData.data;
          var priceLatest = (priceSeries[0][1] / 100).toFixed(2);

          var chartData = {
            series: [
              {
                name: 'series-1',
                data: []
              }
            ]
          };

          lodash.each(priceSeries, function(priceTimeTuple) {
            var t = priceTimeTuple[0];
            var p = priceTimeTuple[1];
            chartData.series[0].data.push({x: new Date(t*1000), y: p});
          });

          resolve({priceLatest: priceLatest, chartData: chartData});
        });
      });
    }

    $scope.$on('$ionicView.beforeEnter', function(event, data) {
      var options = getChartOptions();
      getChartData(bchPriceUrl).then(function(data) {
        $scope.bchPriceLatest = data.priceLatest;
        new Chartist.Line('#bch-chart', data.chartData, options);
      });

      getChartData(btcPriceUrl).then(function(data) {
        $scope.btcPriceLatest = data.priceLatest;
        new Chartist.Line('#btc-chart', data.chartData, options);
      });
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      $ionicNavBarDelegate.showBar(true);
    });
});
