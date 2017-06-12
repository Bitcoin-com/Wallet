'use strict';

angular.module('copayApp.controllers').controller('buyandsellController', function($scope, $ionicHistory, buyAndSellService, lodash) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.services = buyAndSellService.get();

    $scope.$on("$ionicView.enter", function(event, data) {
        console.log("Enter buy page");
        var r = new XMLHttpRequest(); 
        r.open("GET", "https://www.bitcoin.com/api/rv/promoted-exchange", true);
        r.onreadystatechange = function () {
        if (r.readyState != 4 || r.status != 200) return; 
            console.log(r.responseText);
            var adResponse = JSON.parse(r.responseText)
            document.getElementById("exchange-logo").setAttribute('src', "https://www.bitcoin.com" + adResponse.image)
            document.getElementById("exchange-name").textContent = adResponse.bannerName;
            document.getElementById("exchange-text").textContent = adResponse.description;
        };
        r.send("defaultpromotion=360");
    });

    if (lodash.isEmpty($scope.services))
      $ionicHistory.goBack();
  });
});
