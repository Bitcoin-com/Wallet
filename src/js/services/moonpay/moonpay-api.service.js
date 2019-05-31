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
    var currentUser = null;
    var baseUrl = moonPayConfig.baseUrl

    var service = {
      // Variables

      // Functions
      preAuthenticateCustomer: preAuthenticateCustomer
      , authenticateCustomer: authenticateCustomer
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
      , getCountryByIpAddress: getCountryByIpAddress
      , getConfig: getConfig
    };

    return service;

    /**
     * Pre-authenticate a customer with an email address
     * @param {String} email
     */
    function preAuthenticateCustomer(email) {
      var deferred = $q.defer();
      getConfig(false).then(function onGetConfig(config) {
        $http.post(baseUrl + '/v2/customers/email_login?apiKey=' + moonPayConfig.pubKey, {
          'email': email
        }, config).then(function onPreAuthenticateCustomerSuccess(response) {
          deferred.resolve(response.data);
        }, function onPreAuthenticateCustomerError(err) {
          var httpErr = _errorFromResponse(err);
          deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Authenticate a customer with an email address and a security code
     * @param {String} email
     * @param {String} securityCode
     */
    function authenticateCustomer(email, securityCode) {
      var deferred = $q.defer();
      getConfig(false).then(function onGetConfig(config) {
        $http.post(baseUrl + '/v2/customers/email_login?apiKey=' + moonPayConfig.pubKey, {
          'email': email,
          'securityCode': securityCode
        }, config).then(function onAuthenticateCustomerSuccess(response) {
          if (response.status === 200 || response.status === 201) {
            var data = response.data;
            currentToken = data.token;
            deferred.resolve(data.customer);
            localStorageService.set(tokenKey, data.token, function onTokenSaved(err) {
              if (err) {
                $log.debug('Error setting moonpay customer token in the local storage');
                deferred.reject(err);
              } else {
                deferred.resolve(data.customer);
              }
            });
          } else {
            deferred.reject(response.statusText);
          }
        }, function onAuthenticateCustomerError(err) {
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
          if (response.status === 200 || response.status === 201) {
            currentUser = response.data;
            deferred.resolve(currentUser);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var customer = response.data;
            deferred.resolve(customer);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var cards = response.data;
            deferred.resolve(cards);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {  
            var card = response.data;
            deferred.resolve(card);
          } else {
            deferred.reject(response.statusText);
          }
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
        $http.delete(baseUrl + '/v2/cards/' + cardId, config).then(function onDeleteCardSuccess(response) {
          if (response.status === 200 || response.status === 201) {
            deferred.resolve();
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var transactions = response.data;
            deferred.resolve(transactions);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var transaction = response.data;
            deferred.resolve(transaction);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status) {  
            var transaction = response.data;
            deferred.resolve(transaction);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var rates = response.data;
            deferred.resolve(rates);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var countries = response.data;
            deferred.resolve(countries);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var identity = response.data;
            deferred.resolve(identity);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var identity = response.data;
            deferred.resolve(identity);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var file = response.data;
            deferred.resolve(file);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var files = response.data;
            deferred.resolve(files);
          } else {
            deferred.reject(response.statusText);
          }
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
          if (response.status === 200 || response.status === 201) {
            var file = response.data;
            deferred.resolve(file);
          } else {
            deferred.reject(response.statusText);
          }
        }, function onDeleteFileError(err) {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get User Ip Address
     */
    function getCountryByIpAddress() {
      var deferred = $q.defer();

      if (currentUser != null) {
        deferred.resolve(currentUser);
      } else {
        $http.get(baseUrl + '/v2/ip_address').then(function onGetCountryByIpAddressSuccess(response) {
          if (response.status === 200 || response.status === 201) {
            currentUser = response.data;
            deferred.resolve(currentUser);
          } else {
            deferred.reject(response.statusText);
          }
        }, function onGetCountryByIpAddressError(err) {
          // If identity check if not yet created, expect 404
          if (err.status === 404) {
            deferred.resolve();
          } else {
            var httpErr = _errorFromResponse(err);
            deferred.reject(httpErr);
          }
        });
      }
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
