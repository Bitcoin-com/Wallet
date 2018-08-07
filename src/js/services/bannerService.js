'use strict';
angular.module('copayApp.services').factory('bannerService', function ($http, $log) {
  // Export
  var root = {};

  // Constant
  var API_URL = 'https://bwscash.bitcoin.com/bws/api/v1/marketing';

  // Variable
  var hasFetched = false;
  var banners = [];
  var defaultBanner = {
    id: 'default-banner',
    imageURL: 'img/banner-store.png',
    url: 'https://store.bitcoin.com/',
    isLocal: true
  };

  // Private methods
  var fetchSettings = function (cb) {
    var req = {
      method: 'GET',
      url: API_URL+'/settings',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    $http(req).then(function (response) {
      $log.info('Get banner settings: SUCCESS');
      banners = response.data;
      return cb(true);
    }, function (error) {
      $log.error('Get banner settings: ERROR ' + error.statusText);
      return cb(false);
    });
  };

  root.getBanner = function (cb) {
    
    // If not fetch get the banner
    if (!hasFetched) {
      hasFetched = true;

      // If never fetch, lets fetch
      fetchSettings(function (isSuccess) {
        root.getBanner(cb);
      });

    // If fetch, and got banners, lets have a look
    } else if (banners.length > 0) {
      var selectedBanners = [];
      for(var i in banners) {
        var banner = banners[i]; 

        // Generate the URL for the banner
        var fileName = banner.image.substring(0, banner.image.lastIndexOf('.'));
        var extension = banner.image.substring(banner.image.lastIndexOf('.')+1);
        banner.imageURL = API_URL +'/banners/'+fileName+"/"+extension;

        // Add the banner
        selectedBanners.push(banners[i]);
      }

      // If no banner activated, return the default one
      if (selectedBanners.length == 0) {
        return cb(defaultBanner);
      } else {
        return cb(selectedBanners[Math.floor(Math.random()*banners.length)]);
      }

    } else {
      return cb(defaultBanner);
    }
  };

  return root;
});