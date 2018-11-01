'use strict';

(function(){

angular
  .module('bitcoincom.services')
  .factory('moonPayApiService', moonPayApiService);
  
  function moonPayApiService(
    moonPayConfig,
    localStorageService,
    $http, $q, $log
  ) {

    var tokenKey = 'moonPayToken';
    var currentToken = null;
    var baseUrl = moonPayConfig.baseUrl

    var service = {
      // Variables

      // Functions
      createCustomer: createCustomer,
      getCustomer: getCustomer,
      updateCustomer: updateCustomer,
      uploadPassport: uploadPassport,
      uploadNationalIdentityCard: uploadNationalIdentityCard,
      uploadSelfie: uploadSelfie,
      createCard: createCard,
      getCards: getCards,
      getRates: getRates
    };

    return service;

    /**
     * Create customer
     * @param {String} email 
     */
    function createCustomer(email) {
      var deferred = $q.defer();
      getConfig(false).then(function(config) {
        $http.post(baseUrl + '/v2/customers?apiKey=' + moonPayConfig.pubKey, {
          'email': email
        }, config).then(function (response) {
          var data = response.data;
          currentToken = data.token;
          localStorageService.set(tokenKey, data.token, function (err) {
            if (err) {
              $log.debug('Error setting moonpay customer token in the local storage');
              deferred.reject(err);
            } else {
              deferred.resolve(data.customer);
            }
          });
        }, function (err) {
          deferred.reject(err);
        });
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    /**
     * Get customer
     */
    function getCustomer() {
      var deferred = $q.defer();
      getConfig(true).then(function(config) {
        $http.get(baseUrl + '/v2/customers/me', config).then(function (response) {
          var customer = response.data;
          deferred.resolve(customer);
        }, function (err) {
          deferred.reject(err);
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
      getConfig(true).then(function(config) {
        $http.patch(baseUrl + '/v2/customers/' + customer.id, customer, config).then(function (response) {
          var customer = response.data;
          deferred.resolve(customer);
        }, function (err) {
          deferred.reject(err);
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
      getConfig(true).then(function(config) {
        $http.get(baseUrl + '/v2/cards', config).then(function (response) {
          var cards = response.data;
          deferred.resolve(cards);
        }, function (err) {
          deferred.reject(err);
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
      getConfig(true).then(function(config) {
        $http.post(baseUrl + '/v2/cards', card, config).then(function (response) {
          var card = response.data;
          deferred.resolve(card);
        }, function (err) {
          deferred.reject(err);
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
        $http.get(baseUrl + '/v2/currencies/' + code + '/price', config).then(function (response) {
          var rates = response.data;
          deferred.resolve(rates);
        }, function (err) {
          deferred.reject(err);
        });
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
        } else {
          localStorageService.get(tokenKey, function (err, token) {
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