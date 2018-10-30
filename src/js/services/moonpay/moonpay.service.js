'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayService', moonPayService);
  
  function moonPayService(
    moonPayApiService
    , localStorageService
    , $log, $q
  ) {

    var customerKey = 'moonPayCustomer'
    var currentCustomer = null;

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      getCustomerId: getCustomerId,
      updateCustomer: updateCustomer
    };

    return service;

    /**
     * Create a customer
     * @param {String} email 
     */
    function createCustomer(email) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createCustomer(email).then(function (customer) {
        localStorageService.set(customerKey, customer, function (err) {
          if (err) {
            $log.debug('Error setting moonpay customer in the local storage');
            deferred.reject(err);
          } else {
            deferred.resolve(customer);
          }
        });

      }, function (err) {
        $log.debug('Error creating moonpay customer from the api');
        deferred.reject(err);
      });

      return deferred.promise;
    }

    /**
     * Get customer
     */
    function getCustomer() {
      // Create the promise
      var deferred = $q.defer();

      // Get the customer in the localStorageService if we didn't do it yet
      if (currentCustomer) {
        deferred.resolve(currentCustomer);
      } else {
        localStorageService.get(customerKey, customer, function (err) {
          if (err) {
            $log.debug('Error getting moonpay customer in the local storage');
            deferred.reject(err);
          } else {
            currentCustomer = customer;
            deferred.resolve(customer);
          }
        });
      }
      
      return deferred.promise;
    }

    /**
     * Get customer Id
     */
    function getCustomerId() {
      // Create the promise
      var deferred = $q.defer();

      getCustomer().then(function (customer) {
        deferred.resolve(customer.id);
      }, function (err) {
        deferred.reject(err);
      });
      
      return deferred.promise;
    }

    /**
     * Update a customer
     * @param {Object} customer 
     */
    function updateCustomer(customer) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.updateCustomer(customer).then(function (customer) {
        localStorageService.set(customerKey, customer, function (err) {
          if (err) {
            $log.debug('Error setting moonpay customer in the local storage');
            deferred.reject(err);
          } else {
            deferred.resolve(customer);
          }
        });

      }, function (err) {
        $log.debug('Error updating moonpay customer from the api');
        deferred.reject(err);
      });

      return deferred.promise;
    }
  }
})();