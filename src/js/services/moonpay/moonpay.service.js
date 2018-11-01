'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayService', moonPayService);
  
  function moonPayService(
    moonPayApiService,
    localStorageService,
    $log, $q
  ) {

    var customerKey = 'moonPayCustomer'
    var currentCustomer = null;
    var currentCards = null;

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      getCustomerId: getCustomerId,
      updateCustomer: updateCustomer,
      createCard: createCard,
      getCards: getCards,
      getRates: getRates
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
            currentCustomer = customer;
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
      if (currentCustomer != null) {
        deferred.resolve(currentCustomer);
      } else {
        localStorageService.get(customerKey, function (err, customer) {
          if (err) {
            $log.debug('Error getting moonpay customer in the local storage');
            deferred.reject(err);
          } else {
            currentCustomer = JSON.parse(customer);
            deferred.resolve(currentCustomer);
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
        if (customer != null && customer.id) {
          deferred.resolve(customer.id);
        }
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

    /**
     * Get cards
     */
    function getCards() {
      // Create the promise
      var deferred = $q.defer();

      if (currentCards != null) {
        deferred.resolve(currentCards);
      } else {
        moonPayApiService.getCards().then(function (cards) {
          currentCards = cards
          deferred.resolve(cards);
        }, function (err) {
          $log.debug('Error getting moonpay cards from the api');
          deferred.reject(err);
        });
      }
      
      return deferred.promise;
    }

    /**
     * Create a card
     * @param {Object} card 
     */
    function createCard(card) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createCard(card).then(function (theCard) {
        getCards().then(function (cards) {
          cards.push(theCard);
          deferred.resolve(card);
        }, function (err) {
          $log.debug('Error getting moonpay cards from the api');
          deferred.resolve(card);
        });
      }, function (err) {
        $log.debug('Error creating moonpay card from the api');
        deferred.reject(err);
      });

      return deferred.promise;
    }

    /**
     * Get rates
     * @param {String} code 
     */
    function getRates(code) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getRates(code).then(function (rates) {
        deferred.resolve(rates);
      }, function (err) {
        $log.debug('Error getting moonpay rates from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }
  }
})();