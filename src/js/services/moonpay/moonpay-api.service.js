'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayApiService', moonPayApiService);
  
  function moonPayApiService(
    moonPayConfig
    , localStorageService
    , $http
    , $q
    , $log
    , $sce
  ) {

    var tokenKey = 'moonPayToken_' + moonPayConfig.env;
    var currentToken = null;
    var baseUrl = moonPayConfig.baseUrl

    var service = {
      // Variables

      // Functions
      /* TODO: Reinstate when Moonpay is working properly
      createCustomer: createCustomer
      , getCustomer: getCustomer
      , updateCustomer: updateCustomer
      , createCard: createCard
      , removeCard: removeCard
      , getCards: getCards
      , createTransaction: createTransaction
      , getTransactions: getTransactions
      , getTransaction: getTransaction
      , getRates: getRates
      , getAllCountries: getAllCountries
      , getIdentityCheck: getIdentityCheck
      , createIdentityCheck: createIdentityCheck
      , uploadFile: uploadFile
      , getFiles: getFiles
      , deleteFile: deleteFile
      */
    };

    return service;

    /**
     * Create customer
     * @param {String} email 
     */
    function createCustomer(email) {
      var deferred = $q.defer();
      getConfig(false).then(function onGetConfig(config) {
        $http.post(baseUrl + '/v2/customers?apiKey=' + moonPayConfig.pubKey, {
          'email': email
        }, config).then(function onPostEmailSuccess(response) {
          var data = response.data;
          currentToken = data.token;
          localStorageService.set(tokenKey, data.token, function onTokenSaved(err) {
            if (err) {
              $log.debug('Error setting moonpay customer token in the local storage');
              deferred.reject(err);
            } else {
              deferred.resolve(data.customer);
            }
          });
        }, function onPostEmailError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Creates an Error object from an HTTP response.
     * @param {Object} response
     * @returns {Error}
     */
    function _errorFromResponse(response) {
      
      var message = '';
      try {
        message = Object.values(response.data.errors[0].constraints)[0];
      } catch(e) {
        if (response.data && response.data.message) {
          message = response.data.message;
        } else if (Math.floor(response.status / 100) !== 2) { // 2xx HTTP Status code, considered success.
          message = response.statusText;
        }
      }

      if (message) {
        return new Error(message);
      } else {
        return null;
      }
    }

    /**
     * Get customer
     */
    function getCustomer() {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.get(baseUrl + '/v2/customers/me', config).then(function onGetMeSuccess(response) {
          var customer = response.data;
          deferred.resolve(customer);
        }, function onGetMeError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
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
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.patch(baseUrl + '/v2/customers/me', customer, config).then(function onPatchCustomerSuccess(response) {
          var customer = response.data;
          deferred.resolve(customer);
        }, function onPatchCustomerError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get cards
     */
    function getCards() {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.get(baseUrl + '/v2/cards', config).then(function onGetCardsSuccess(response) {
          var cards = response.data;
          deferred.resolve(cards);
        }, function onGetCardsError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Create a card
     * @param {Object} card 
     */
    function createCard(card) {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.post(baseUrl + '/v2/cards', card, config).then(function onPostCardSuccess(response) {
          var card = response.data;
          deferred.resolve(card);
        }, function onPostCardError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Remove a card
     * @param {String} cardId 
     */
    function removeCard(cardId) {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.delete(baseUrl + '/v2/cards/' + cardId, config).then(function onDeleteCardSuccess() {
          deferred.resolve();
        }, function onDeleteCardError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get transactions
     */
    function getTransactions() {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.get(baseUrl + '/v2/transactions', config).then(function onGetTransactionsSuccess(response) {
          var transactions = response.data;
          deferred.resolve(transactions);
        }, function onGetTransactionsError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get transaction
     * @param {String} transactionId 
     */
    function getTransaction(transactionId) {
      var deferred = $q.defer();
      getConfig(true).then(function onGetConfig(config) {
        $http.get(baseUrl + '/v2/transactions/' + transactionId, config).then(function onGetTransactionSuccess(response) {
          var transaction = response.data;
          deferred.resolve(transaction);
        }, function onGetTransactionError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Create a transaction
     * @param {Object} transaction 
     */
    function createTransaction(transaction) {
      var deferred = $q.defer();
      getConfig(true).then(function getConfig(config) {
        $http.post(baseUrl + '/v2/transactions', transaction, config).then(function onPostTransactionSuccess(response) {
          var transaction = response.data;
          deferred.resolve(transaction);
        }, function onPostTransactionError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get rates
     * @param {String} code 
     */
    function getRates(code) {
      var deferred = $q.defer();
      getConfig(false).then(function(config) {
        $http.get(baseUrl + '/v2/currencies/' + code + '/price', config).then(function onGetRatesSuccess(response) {
          var rates = response.data;
          deferred.resolve(rates);
        }, function onGetRatesError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get all countries
     */
    function getAllCountries() {
      var deferred = $q.defer();
      getConfig(false).then(function(config) {
        $http.get(baseUrl + '/v2/countries', config).then(function onGetAllCountries(response) {
          var countries = response.data;
          deferred.resolve(countries);
        }, function onGetAllCountriesError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get identity check
     */
    function getIdentityCheck() {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        $http.get(baseUrl + '/v2/identity_check', config).then(function onGetIdentityCheckSuccess(response) {
          var identity = response.data;
          deferred.resolve(identity);
        }, function onGetIdentityCheckError(err) {
          // If identity check if not yet created, expect 404
          if (err.status === 404) {
            deferred.resolve();
          } else {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
          }
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Create an identity check
     */
    function createIdentityCheck() {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        $http.post(baseUrl + '/v2/identity_check', {}, config).then(function onPostIdentityCheckSuccess(response) {
          var identity = response.data;
          deferred.resolve(identity);
        }, function onPostIdentityCheckError(err) {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Upload File
     */
    function uploadFile(data) {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        var customConfig = Object.assign({}, config);

        customConfig.headers['Content-Type'] = undefined;
        customConfig.transformRequest = angular.identity;

        console.log(customConfig);

        $sce.trustAs($sce.RESOURCE_URL, baseUrl + '/v2/files');

        $http.post(baseUrl + '/v2/files', data, customConfig).then(function onUploadFileSuccess(response) {
          var file = response.data;
          deferred.resolve(file);
        }, function onUploadFileError(err) {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get Files
     */
    function getFiles() {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        $http.get(baseUrl + '/v2/files', config).then(function onGetFilesSuccess(response) {
          var files = response.data;
          deferred.resolve(files);
        }, function onGetFilesError(err) {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Delete File
     */
    function deleteFile(fileId) {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        $http.delete(baseUrl + '/v2/files' + fileId, config).then(function onDeleteFileSuccess(response) {
          var file = response.data;
          deferred.resolve(file);
        }, function onDeleteFileError(err) {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    //
    // Private methods
    //

    /**
     * Get config for the http request
     * @param {Boolean} tokenIsNeeded 
     */
    function getConfig(tokenIsNeeded) {
      var deferred = $q.defer();
      var config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (!tokenIsNeeded) {
        deferred.resolve(config);
      } else {
        if (currentToken != null) {
          config.headers['Authorization'] = 'Bearer ' + currentToken;
          deferred.resolve(config);
        } else {
          localStorageService.get(tokenKey, function onGetToken(err, token) {
            if (err) {
              $log.debug('Error getting moonpay customer token in the local storage');
              deferred.reject(err);
            } else {
              currentToken = token
              config.headers['Authorization'] = 'Bearer ' + currentToken;
              deferred.resolve(config);
            }
          });
        }
      }
      return deferred.promise;
    }
  }
})();