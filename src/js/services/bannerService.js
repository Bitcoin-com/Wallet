'use strict';
angular.module('copayApp.services').factory('bannerService', function ($http, $log) {
  var root = {};

  var marketingApiService = 'http://127.0.0.1:3232/bws/api/v1/marketing';
  var bannersFetched = false;
  var banners = [{
    id: 'default-banner',
    image: 'img/banner-store.png',
    url: 'https://store.bitcoin.com/',
    local: true
  }];

  root.fetchBannerSettings = function (cb) {
    if (bannersFetched)
      return cb(banners);

    var req = {
      method: 'GET',
      url: marketingApiService+'/settings',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    $http(req).then(function (data) {
      $log.info('Get banner settings: SUCCESS');
      banners = banners.concat(data.data);
      bannersFetched = true;
      return cb(banners);
    }, function (data) {
      $log.error('Get banner settings: ERROR ' + data.statusText);
      return cb(banners);
    });
  };

  root.getBannerImage = function (banner) {
    if (banner.local) {
      return banner.image;
    }

    var fileName = banner.image.substring(0, banner.image.lastIndexOf('.'));
    var extension = banner.image.substring(banner.image.lastIndexOf('.'));
    return marketingApiService+'/banners/'+fileName+"/"+extension;
  };

  return root;
});