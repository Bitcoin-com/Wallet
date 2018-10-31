'use strict';

(function() {
  angular.module('bitcoincom.services').factory('opencapService', function($q, $http) {
    function getAddress(alias, coin) {
      let aliasData = validateAlias(alias);
      if (aliasData.username === '' || aliasData.domain === '') {
        return $q((resolve, reject) => {
          return reject('Invalid OpenCAP alias');
        });
      }

      let deferred = $q.defer();
      $http
        .get(`https://dns.google.com/resolve?name=_opencap._tcp.${aliasData.domain}&type=SRV`)
        .then(function(response) {
          deferred.resolve(
            parseSRV(response.data)
              .then(data => getAddresses(alias, coin, data.host, data.dnssec))
              .catch(function(error) {
                return $q((resolve, reject) => {
                  reject(error);
                });
              })
          );
        })
        .catch(function(response) {
          deferred.reject('Couldn\'t find srv record for the provided domain');
        });
      return deferred.promise;
    }

    var parseSRV = function(respData) {
      return $q((resolve, reject) => {
        let dnssec = respData.AD;

        if (typeof respData.Answer === 'undefined') {
          return reject('Error contacting google dns server, no srv data');
        }
        if (respData.Answer.length < 1) {
          return reject('Error contacting google dns server, not enough srv data');
        }

        let record = respData.Answer[0].data.split(' ');
        if (record.length != 4) {
          return reject('Error contacting google dns server, improper srv data');
        }

        if (record[3].slice(-1) == '.') {
          record[3] = record[3].substring(0, record[3].length - 1);
        }

        return resolve({ host: record[3], dnssec });
      });
    };

    var getAddresses = function(alias, coin, host, dnssec) {
      let deferred = $q.defer();
      $http
        .get(`https://${host}/v1/addresses?alias=${alias}`)
        .then(function(response) {
          deferred.resolve(parseAddresses(response.data, coin, dnssec).then());
        })
        .catch(function(response) {
          deferred.reject('Address not found for the specified alias');
        });
      return deferred.promise;
    };

    var parseAddresses = function(respData, coin, dnssec) {
      return $q((resolve, reject) => {
        for (let i = 0; i < respData.length; i++) {
          if (respData[i].address_type === 'undefined') {
            continue;
          }
          if (respData[i].address === 'undefined') {
            continue;
          }
          if (coin == 'bch' && (respData[i].address_type == 200 || respData[i].address_type == 201)) {
            return resolve({ address: respData[i].address, dnssec });
          }
          if (coin == 'btc' && (respData[i].address_type == 100 || respData[i].address_type == 101)) {
            return resolve({ address: respData[i].address, dnssec });
          }
        }

        return reject('Error contacting opencap server, no response');
      });
    };

    function validateUsername(username) {
      return /^[a-z0-9._-]{1,25}$/.test(username);
    }

    function validateDomain(username) {
      return /^[a-z0-9.\-]+\.[a-z]{2,4}$/.test(username);
    }

    function validateAlias(alias) {
      let splitAlias = alias.split('$');
      if (splitAlias.length != 2) {
        return { username: '', domain: '' };
      }
      let username = splitAlias[0];
      let domain = splitAlias[1];

      if (!validateUsername(username)) {
        return { username: '', domain: '' };
      }
      if (!validateDomain(domain)) {
        return { username: '', domain: '' };
      }

      return { username, domain };
    }

    var service = {
      getAddress,
    };

    return service;
  });
})();
