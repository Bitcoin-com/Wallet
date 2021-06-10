'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayService', moonPayService);
  
  function moonPayService(
    moonPayApiService
    , storageService
    , moonPayRouterService
    , moonPayConfig
    , $log
    , $q
    , ongoingProcess
  ) {

    var customerIdKey = 'moonPayCustomerId_' + moonPayConfig.env
    var defaultWalletIdKey = 'moonPayDefaultWalletId_' + moonPayConfig.env
    var defaultCardIdKey = 'moonPayDefaultCardId_' + moonPayConfig.env
    var currentCards = null;

    var defaultWalletIdByCoin = [];
    var defaultCardId = null;

    var service = {

      // Functions
      preAuthenticateCustomer: preAuthenticateCustomer
      , authenticateCustomer: authenticateCustomer
      , getCustomer: getCustomer
      , getCustomerId: getCustomerId
      , updateCustomer: updateCustomer
      , addCard: addCard
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
      , getAllCountries: getAllCountries
      , getIdentityCheck: getIdentityCheck
      , createIdentityCheck: createIdentityCheck
      , getFiles: getFiles
      , uploadFile: uploadFile
      , setTransactionWalletId: setTransactionWalletId
      , getConfigWithToken: getConfigWithToken
      , getCountryByIpAddress: getCountryByIpAddress
    };

    return service;

    /**
     * Start the flow moonpay
     */
    function start() {
      $log.debug('buy bitcoin start()');
      ongoingProcess.set('fetchingKycStatus', true);
      getCustomerId().then(function onCustomerIdSuccess(customerId) {
        $log.debug('Moonpay customer ID: ' + customerId);

        ongoingProcess.set('fetchingKycStatus', false, function onSet() {
          if (customerId != null) {
            moonPayRouterService.startFromHome();
          } else {
            moonPayRouterService.startFromWelcome();
          }
        });

      }, function onCustomerIdError(err) {
        ongoingProcess.set('fetchingKycStatus', false);
        $log.error('Error getting Moonpay customer ID. ' + err);
      });
    }

    /**
     * Set the default wallet id
     * @param {String} walletId 
     * @param {String} coin 
     */
    function setDefaultWalletId(walletId, coin) {
      // Create the promise
      var deferred = $q.defer();

      storageService.setItem(defaultWalletIdKey + '_' + coin, walletId, function onSaveWalletId(err) {
        if (err) {
          $log.debug('Error setting moonpay selected wallet id in the local storage');
          deferred.reject(err);
        } else {
          defaultWalletIdByCoin[coin] = walletId
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    /**
     * Get the default wallet id
     * @param {String} walletId 
     */
    function getDefaultWalletId(coin) {
      // Create the promise
      var deferred = $q.defer();

      var defaultWalletId = defaultWalletIdByCoin[coin]

      if (defaultWalletId != null) {
        deferred.resolve(defaultWalletId);
      } else {
        storageService.getItem(defaultWalletIdKey + '_' + coin, function onGetWalletId(err, walletId) {
          if (err) {
            $log.debug('Error getting moonpay selected wallet id in the local storage');
            deferred.reject(err);
          } else {
            defaultWalletIdByCoin[coin] = walletId
            deferred.resolve(walletId);
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
     * Pre-authenticate a customer with an email address
     * @param {String} email
     */
    function preAuthenticateCustomer(email) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.preAuthenticateCustomer(email).then(
        function onPreAuthenticateCustomerSuccess(customer) {
          deferred.resolve(customer);
        }, function onPreAuthenticateCustomerError(err) {
          $log.debug('Error pre-authenticating moonpay customer from the api');
          deferred.reject(err);
        }
      );

      return deferred.promise;
    }

    /**
     * Authenticate a customer with an email address and a security code
     * @param {String} email
     * @param {String} securityCode
     */
    function authenticateCustomer(email, securityCode) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.authenticateCustomer(email, securityCode).then(
        function onAuthenticateCustomerSuccess(customer) {
          storageService.setItem(customerIdKey, customer.id, function onSaveCustomer(err) {
            if (err) {
              $log.debug('Error setting moonpay customer id in the local storage');
              deferred.reject(err);
            } else {
              deferred.resolve(customer);
            }
          });
        }, function onAuthenticateCustomerError(err) {
          $log.debug('Error authenticating moonpay customer from the api');
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
      moonPayApiService.getCustomer().then(
        function onGetCustomerSuccess(customer) {
          deferred.resolve(customer);
        },
        function onGetCustomerError(err) {
          $log.debug('Error getting moonpay customer from the api');
          deferred.reject(err);
        }
      );
      
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
     * Add a defined card
     * @param {Object} newCard 
     */
    function addCard(newCard) {
      if (currentCards != null) {
        currentCards.push(newCard);
      } else {
        currentCards = [newCard];
      }
      return currentCards;
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

    function getTransactionWalletIds () {
      // Create the promise
      var deferred = $q.defer();

      storageService.getItem('moonPayTransactionWalletIds', function onGetTransactionWalletId(err, walletIds) {
        if (err) {
          $log.debug('Error setting moonpay transaction wallet id in the local storage');
          deferred.reject(err);
        } else {
          // Needed before the try because if walletIds is null, it parses OK,
          // no exception is generated to catch.
          walletIds = walletIds || {};
          try {
            walletIds = JSON.parse(walletIds);
          } catch (err) {
            walletIds = {};
          }
          deferred.resolve(walletIds);
        }
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

        // Get in cache the mapping with the walletId
        getTransactionWalletIds().then(function onGetTransactionWalletIdSuccess(walletIds) {
          transactions.forEach(function (transaction) {
            transaction.walletId = walletIds[transaction.id];
          });
          deferred.resolve(transactions);
        }, function onGetTransactionWalletIdError(err) {
          $log.debug('Error setting moonpay transactions wallet id in the local storage');
          deferred.reject(err);
        });
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

        // Get in cache the mapping with the walletId
        getTransactionWalletIds().then(function onGetTransactionWalletIdSuccess(walletIds) {
          transaction.walletId = walletIds[transaction.id];
          deferred.resolve(transaction);
        }, function onGetTransactionWalletIdError(err) {
          $log.debug('Error setting moonpay transactions wallet id in the local storage');
          deferred.reject(err);
        });

      }, function onGetTransactionError(err) {
        $log.debug('Error getting moonpay transaction from the api');
        deferred.reject(err);
      });
      
      return deferred.promise;
    }

    function setTransactionWalletId(transaction) {
      // Create the promise
      var deferred = $q.defer();

      // Save in cache the mapping with the walletId
      getTransactionWalletIds().then(function onGetTransactionWalletIdSuccess(walletIds) {
        walletIds[transaction.id] = transaction.walletId;
        storageService.setItem("moonPayTransactionWalletIds", JSON.stringify(walletIds), function onSetTransactionWalletId(err) {
          if (err) {
            $log.debug('Error setting moonpay transaction wallet id in the local storage');
            deferred.reject();
          } else {
            deferred.resolve();
          }
        });
      }, function onGetTransactionWalletIdError(err) {
        $log.debug('Error setting moonpay selected wallet id in the local storage');
        deferred.reject(err);
      });
    }

    /**
     * Create a transaction
     * @param {Object} transaction 
     */
    function createTransaction(transaction, walletId) {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createTransaction(transaction).then(function onCreateTransactionSuccess(newTransaction) {
        // Save in cache the mapping with the walletId
        getTransactionWalletIds().then(function onGetTransactionWalletIdSuccess(walletIds) {
          walletIds[newTransaction.id] = walletId;

          // Save in cache the mapping with the walletId
          storageService.setItem("moonPayTransactionWalletIds", JSON.stringify(walletIds), function onSetTransactionWalletId(err) {
            if (err) {
              $log.debug('Error setting moonpay selected wallet id in the local storage');
              deferred.reject(err);
            } else {
              newTransaction.walletId = walletId;
              deferred.resolve(newTransaction);
            }
          });
        }, function onGetTransactionWalletIdError(err) {
          $log.debug('Error getting moonpay transaction wallet id in the local storage');
          deferred.reject(err);
        });
      }, function onCreateTransactionError(err) {
        $log.debug('Error getting moonpay transaction wallet id from the api');
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

    /**
     * Get all countries
     */
    function getAllCountries(onlySendAllowedCountries) {
      onlySendAllowedCountries = onlySendAllowedCountries || false;
      
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getAllCountries().then(
        function onGetAllCountries(countries) {
          var filteredCountries = countries;
          if (onlySendAllowedCountries) {
            filteredCountries = filteredCountries.filter(function(country) {
              return country.isAllowed;
            });
          }
          deferred.resolve(filteredCountries);
        }, function onGetAllCountriesError(err) {
          $log.debug('Error getting moonpay countries list from the api');
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    /**
     * Get identity check
     */
    function getIdentityCheck() {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getIdentityCheck().then(
        function onGetIdentityCheck(identity) {
          deferred.resolve(identity);
        }, function onGetIdentityCheckError(err) {
          $log.debug('Error getting moonpay identity check from the api', err);
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    /**
     * Get identity check
     */
    function createIdentityCheck() {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.createIdentityCheck().then(
        function onCreateIdentityCheck(identity) {
          deferred.resolve(identity);
        }, function onCreateIdentityCheckError(err) {
          $log.debug('Error creating moonpay identity check from the api', err);
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    /**
     * Get User by IP address
     */
    
    function getCountryByIpAddress() {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getCountryByIpAddress().then(
        function onGetCountryByIpAddressSuccess(user) {
          deferred.resolve(user);
        }, function onGetCountryByIpAddressError(err) {
          $log.debug('Error get moonpay user by ip address from the api', err);
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    /**
     * Get Files
     */
    function getFiles() {
      // Create the promise
      var deferred = $q.defer();

      moonPayApiService.getFiles().then(
        function onGetFilesSuccess(files) {
          deferred.resolve(files);
        }, function onGetFilesError(err) {
          $log.debug('Error getting moonpay files list from the api', err);
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }

    /**
     * Upload Document
     * @param {data} file
     * @param {String} type
     * @param {String} country
     * @param {String} side - Optional  
     */
    function uploadFile(fileBase64, type, country, side) {
      // Create the promise
      var deferred = $q.defer();


      function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
      
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
      
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          var slice = byteCharacters.slice(offset, offset + sliceSize);
      
          var byteNumbers = new Array(slice.length);
          for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
      
          var byteArray = new Uint8Array(byteNumbers);
      
          byteArrays.push(byteArray);
        }
          
        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
      }
      
      
      var contentType = 'image/jpeg';
      var b64Data = fileBase64.slice(23); // Remove the header data:...
      var blob = b64toBlob(b64Data, contentType);

      var formData = new FormData();
      formData.append('file', blob);
      formData.append('type', type);
      formData.append('country', country);
      
      if (side) {
        formData.append('side', side);
      }

      moonPayApiService.uploadFile(formData).then(
        function onUploadFileSuccess(file) {
          deferred.resolve(file);
        }, function onUploadFileError(err) {
          $log.debug('Error uploading file to moonpay api', err);
          deferred.reject(err);
        }
      );
      return deferred.promise;
    }
    
    function getConfigWithToken() {
      return moonPayApiService.getConfig(true);
    }
  }
})();
