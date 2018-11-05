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
    var currentTransactions = null;

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      getCustomerId: getCustomerId,
      updateCustomer: updateCustomer,
      createCard: createCard,
      getCards: getCards,
      createTransaction: createTransaction,
      getTransactions: getTransactions,
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

      moonPayApiService.createCustomer(email).then(function onCreateCustomerSucceeded(customer) {
        localStorageService.set(customerKey, customer, function onSaveCustomer(err) {
          if (err) {
            $log.debug('Error setting moonpay customer in the local storage');
            deferred.reject(err);
          } else {
            currentCustomer = customer;
            deferred.resolve(customer);
          }
        });

      }, function onCreateCustomeFailed(err) {
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
        localStorageService.get(customerKey, function onGetCustomerFromStorage(err, customer) {
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

      getCustomer().then(function onGetCustomer(customer) {
        if (customer != null && customer.id) {
          deferred.resolve(customer.id);
        } else {
          deferred.resolve(null);
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

      moonPayApiService.updateCustomer(customer).then(function onUpdateCustomer(customer) {
        localStorageService.set(customerKey, customer, function onSaveCustomer(err) {
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
        moonPayApiService.getCards().then(function onGetCards(cards) {
          currentCards = cards
          deferred.resolve(currentCards);
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

      moonPayApiService.createCard(card).then(function onCreateCard(newCard) {
        if (currentCards != null) {
          currentCards.push(newCard);
        }

        deferred.resolve(newCard);
      }, function (err) {
        $log.debug('Error creating moonpay card from the api');
        deferred.reject(err);
      });

      return deferred.promise;
    }

    /**
     * Get transactions
     */
    function getTransactions() {
      // Create the promise
      var deferred = $q.defer();

      if (currentTransactions != null) {
        deferred.resolve(currentTransactions);
      } else {
        moonPayApiService.getTransactions().then(function onGetTransactions(transactions) {
          currentTransactions = transactions
          deferred.resolve(currentTransactions);
        }, function (err) {
          $log.debug('Error getting moonpay transactions from the api');
          deferred.reject(err);
        });
      }
      
      return deferred.promise;
    }

    /**
     * Create a transaction
     * @param {Object} transaction 
     */
    function createTransaction(transaction) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createTransaction(transaction).then(function onCreateTransaction(newTransaction) {
        if (currentTransactions != null) {
          currentTransactions.push(newTransaction);
        }

        deferred.resolve(newTransaction);
      }, function (err) {
        $log.debug('Error creating moonpay transaction from the api');
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

      moonPayApiService.getRates(code).then(function onGetRates(rates) {
        deferred.resolve(rates);
      }, function (err) {
        $log.debug('Error getting moonpay rates from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }
  }
})();