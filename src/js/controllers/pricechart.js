'use strict';

angular.module('copayApp.controllers').controller('pricechartController',
  function($scope, $timeout, $ionicModal, $log, $state, $ionicHistory, lodash, pricechartService, externalLinkService, popupService) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var pricechart = function() {
        var rawData = [];

	var request = new XMLHttpRequest();
	request.open('GET', 'https://index.bitcoin.com/api/v0/history?unix=1&pretty=0', true);

	var priceHigh = 0;
	var priceLow = 100000000;
	var priceLatest = 0;

	request.onload = function () {
	    if (request.status >= 200 && request.status < 400) {
		// Success!

		var data = {
		    series: [
		        {
		            name: 'series-1',
		            data: []
		        }
		    ]
		};
		rawData = JSON.parse("" + request.responseText + "");
		for (var i = rawData.length - 1; i > 0; i--) {
		    var tuple = rawData[i];
		    data.series[0].data.push({x: new Date(tuple[0]*1000), y: tuple[1]});

		    if (priceHigh < tuple[1])
		    {
		        priceHigh = tuple[1];
		    }
		    if (priceLow > tuple[1])
		    {
		        priceLow = tuple[1]
		    }
		    priceLatest = tuple[1];
		}

		document.getElementById("latest-price").innerHTML = (priceLatest / 100).toFixed(2);
		document.getElementById("low-price").innerHTML = (priceLow / 100).toFixed(2);
		document.getElementById("high-price").innerHTML = (priceHigh / 100).toFixed(2);

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
		        low: 50000,
		        // The label interpolation function enables you to modify the values
		        // used for the labels on each axis.
		        labelInterpolationFnc: function (value) {
		            return '$' + (value / 100).toFixed(2);
		        }
		    },
		    showArea: true
		};


	// Create a new line chart object where as first parameter we pass in a selector
	// that is resolving to our chart container element. The Second parameter
	// is the actual data object.
		new Chartist.Line('.ct-chart', data, options);
	    }
	    else
	    {
		// We reached our target server, but it returned an error
	    }
	};

	request.onerror = function () {
	    // There was a connection error of some sort
	};

	request.send();
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      pricechart();
    });
  });
