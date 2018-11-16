'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayService', moonPayService);
  
  function moonPayService(
    moonPayApiService
    , storageService
    , moonPayRouterService
    , $log, $q
  ) {

    var customerIdKey = 'moonPayCustomerId'
    var defaultWalletIdKey = 'moonPayDefaultWalletId'
    var defaultCardIdKey = 'moonPayDefaultCardId'
    var currentCustomer = null;
    var currentCards = null;

    var defaultWalletId = null;
    var defaultCardId = null;

    var service = {

      // Functions
      createCustomer: createCustomer
      , getCustomer: getCustomer
      , getCustomerId: getCustomerId
      , updateCustomer: updateCustomer
      , createCard: createCard
      , removeCard: removeCard
      , getCards: getCards
      , createTransaction: createTransaction
      , getTransactions: getTransactions
      , getTransaction: getTransaction
      , getRates: getRates
      , setDefaultWalletId: setDefaultWalletId
      , getDefaultWalletId: getDefaultWalletId
      , setDefaultCardId: setDefaultCardId
      , getDefaultCardId: getDefaultCardId
      , start: start
    };

    return service;

    /**
     * Start the flow moonpay
     */
    function start() {
      $log.debug('buy bitcoin start()');

      ongoingProcess.set('gettingKycCustomerId', true);
      getCustomerId(function onCustomerId(err, customerId){
        ongoingProcess.set('gettingKycCustomerId', false);

        if (err) {
          $log.error('Error getting Moonpay customer ID. ' + err);
          return;
        }

        $log.debug('Moonpay customer ID: ' + customerId);

        if (customerId != null) {
          moonPayRouterService.startFromHome();
        } else {
          moonPayRouterService.startFromWelcome();
        }

      });
    }

    /**
     * Set the default wallet id
     * @param {String} walletId 
     */
    function setDefaultWalletId(walletId) {
      // Create the promise
      var deferred = $q.defer();

      storageService.setItem(defaultWalletIdKey, walletId, function onSaveWalletId(err) {
        if (err) {
          $log.debug('Error setting moonpay selected wallet id in the local storage');
          deferred.reject(err);
        } else {
          defaultWalletId = walletId
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    /**
     * Get the default wallet id
     * @param {String} walletId 
     */
    function getDefaultWalletId() {
      // Create the promise
      var deferred = $q.defer();

      if (defaultWalletId != null) {
        deferred.resolve(defaultWalletId);
      } else {
        storageService.getItem(defaultWalletIdKey, function onGetWalletId(err, walletId) {
          if (err) {
            $log.debug('Error getting moonpay selected wallet id in the local storage');
            deferred.reject(err);
          } else {
            defaultWalletId = walletId
            deferred.resolve(defaultWalletId);
          }
        });
      }

      return deferred.promise;
    }

    /**
     * Set the default card id
     * @param {String} cardId 
     */
    function setDefaultCardId(cardId) {
      // Create the promise
      var deferred = $q.defer();

      storageService.setItem(defaultCardIdKey, cardId, function onSaveCardId(err) {
        if (err) {
          $log.debug('Error setting moonpay selected card id in the local storage');
          deferred.reject(err);
        } else {
          defaultCardId = cardId
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    /**
     * Get the default card id
     * @param {String} cardId 
     */
    function getDefaultCardId() {
      // Create the promise
      var deferred = $q.defer();

      if (defaultCardId != null) {
        deferred.resolve(defaultCardId);
      } else {
        storageService.getItem(defaultCardIdKey, function onGetCardId(err, cardId) {
          if (err) {
            $log.debug('Error getting moonpay selected card id in the local storage');
            deferred.reject(err);
          } else {
            defaultCardId = cardId
            deferred.resolve(defaultCardId);
          }
        });
      }

      return deferred.promise;
    }

    /**
     * Create a customer
     * @param {String} email 
     */
    function createCustomer(email) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createCustomer(email).then(
        function onCreateCustomerSuccess(customer) {
          storageService.setItem(customerIdKey, customer.id, function onSaveCustomer(err) {
            if (err) {
              $log.debug('Error setting moonpay customer id in the local storage');
              deferred.reject(err);
            } else {
              currentCustomer = customer;
              deferred.resolve(customer);
            }
          });
        }, function onCreateCustomerError(err) {
          $log.debug('Error creating moonpay customer from the api');
          deferred.reject(err);
        }
      );

      return deferred.promise;
    }

    /**
     * Get customer
     */
    function getCustomer() {
      // Create the promise
      var deferred = $q.defer();

      // Get the customer in the storageService if we didn't do it yet
      if (currentCustomer != null) {
        deferred.resolve(currentCustomer);
      } else {
        moonPayApiService.getCustomer().then(
          function onGetCustomerSuccess(customer) {
            currentCustomer = customer;
            deferred.resolve(currentCustomer);
          },
          function onGetCustomerError(err) {
            $log.debug('Error getting moonpay customer from the api');
            deferred.reject(err);
          }
        );
      }
      
      return deferred.promise;
    }

    /**
     * Get customer Id
     */
    function getCustomerId() {
      // Create the promise
      var deferred = $q.defer();

      storageService.getItem(customerIdKey, function onGetCustomerId(err, customerId) {
        if (err) {
          $log.debug('Error setting moonpay customer id in the local storage');
          deferred.reject(err);
        } else {
          deferred.resolve(customerId);
        }
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

      moonPayApiService.updateCustomer(customer).then(function onUpdateCustomerSuccess(customer) {
        deferred.resolve(customer);
      }, function onUpdateCustomerError(err) {
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
        moonPayApiService.getCards().then(function onGetCardsSuccess(cards) {
          currentCards = cards
          deferred.resolve(currentCards);
        }, function onGetCardsError(err) {
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

      moonPayApiService.createCard(card).then(function onCreateCardSuccess(newCard) {
        if (currentCards != null) {
          currentCards.push(newCard);
        }

        deferred.resolve(newCard);
      }, function onCreateCardError(err) {
        $log.debug('Error creating moonpay card from the api');
        deferred.reject(err);
      });

      return deferred.promise;
    }

    /**
     * Remove a card
     * @param {String} cardId 
     */
    function removeCard(cardId) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.removeCard(cardId).then(function onRemoveCardSuccess() {
        if (currentCards != null) {
          currentCards = currentCards.filter(function(card) {
            return card.id != cardId
          });
        }

        deferred.resolve(currentCards);
      }, function onRemoveCardError(err) {
        $log.debug('Error removing moonpay card from the api');
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

      moonPayApiService.getTransactions().then(function onGetTransactionsSuccess(transactions) {
        deferred.resolve(transactions);
      }, function onGetTransactionsError(err) {
        $log.debug('Error getting moonpay transactions from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }
    
    /**
     * Get a transaction
     * @param {String} transactionId 
     */
    function getTransaction(transactionId) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getTransaction(transactionId).then(function onGetTransactionSuccess(transaction) {
        deferred.resolve(transaction);
      }, function onGetTransactionsError(err) {
        $log.debug('Error getting moonpay transaction from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }

    /**
     * Create a transaction
     * @param {Object} transaction 
     */
    function createTransaction(transaction) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createTransaction(transaction).then(function onCreateTransactionSuccess(newTransaction) {
        deferred.resolve(newTransaction);
      }, function onCreateTransactionError(err) {
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

      moonPayApiService.getRates(code).then(function onGetRatesSuccess(rates) {
        deferred.resolve(rates);
      }, function onGetRatesError(err) {
        $log.debug('Error getting moonpay rates from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }
  }
})();