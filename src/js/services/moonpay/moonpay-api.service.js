'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayApiService', moonPayApiService);
  
  function moonPayApiService(
    moonPayConfig,
    $http, $q, $log
  ) {

    var baseUrl = moonPayConfig.baseUrl
    var config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Api-Key ' + moonPayConfig.apiKey
      }
    };

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      updateCustomer: updateCustomer,
      uploadPassport: uploadPassport,
      uploadNationalIdentityCard: uploadNationalIdentityCard,
      uploadSelfie: uploadSelfie
    };

    return service;

    function createCustomer(email) {
      var deferred = $q.defer();
      $http.post(baseUrl + '/customers', {
        'email': email
      }, config).then(function (response) {
        var client = response.data;
        deferred.resolve(client);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function getCustomer(customerId) {
      var deferred = $q.defer(); 
      $http.get(baseUrl + '/customers/' + customerId, config).then(function (response) {
        var client = response.data;
        deferred.resolve(client);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function updateCustomer(customer) {
      var deferred = $q.defer();
      $http.patch(baseUrl + '/customers/' + customer.id, customer, config).then(function (response) {
        var client = response.data;
        // Store customerId = client.id
        deferred.resolve(client);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }


    function uploadPassport(customerId, file) {
      // Needs to be completed
      // Will use the uploadFile
    }

    function uploadNationalIdentityCard(customerId, files) {
      // Needs to be completed
      // Will use the uploadFile
    }

    function uploadSelfie(customerId, file) {
      // Needs to be completed
      // Will use the uploadFile
    }

    function uploadFile(customerId, file) {
      // Needs to be completed
      // Post request
    }
  }
})();