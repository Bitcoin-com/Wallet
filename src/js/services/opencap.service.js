'use strict';

(function() {
  angular.module('bitcoincom.services').factory('opencapService', function($q, $http) {
    function getAddress(alias) {
      let aliasData = validateAlias(alias);
      if (aliasData.username === '' || aliasData.domain === '') {
        return $q(function onQ(resolve, reject) {
          return reject('Invalid OpenCAP alias');
        });
      }

      let deferred = $q.defer();
      $http
        .get(`https://dns.google.com/resolve?name=_opencap._tcp.${aliasData.domain}&type=SRV`)
        .then(function onThen(response) {
          deferred.resolve(
            parseSRV(response.data)
              .then(function onThen(data){ 
                return getAddresses(alias, data.host, data.dnssec) 
              })
              .catch(function onCatch(error) {
                return $q(function onQ(resolve, reject) {
                  return reject(error);
                });
              })
          );
        })
        .catch(function(response) {
          deferred.reject('Couldn\'t find srv record for the provided domain');
        });
      return deferred.promise;
    }

    function parseSRV(respData) {
      return $q(function onQ(resolve, reject) {
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

    function getAddresses(alias, host, dnssec) {
      let deferred = $q.defer();
      $http
        .get(`https://${host}/v1/addresses?alias=${alias}`)
        .then(function onThen(response) {
          deferred.resolve(parseAddresses(response.data, dnssec).then());
        })
        .catch(function onCatch(response) {
          deferred.reject('Address not found for the specified alias');
        });
      return deferred.promise;
    };

    function parseAddresses(respData, dnssec) {
      let addresses = {}
      return $q(function onQ(resolve, reject) {
        for (let i = 0; i < respData.length; i++) {
          if (respData[i].address_type === 'undefined') {
            continue;
          }
          if (respData[i].address === 'undefined') {
            continue;
          }
          // Take the last BCH address we hit, shouldn't matter which one
          if (respData[i].address_type == 200 || respData[i].address_type == 201 || respData[i].address_type == 202) {
            addresses.bch = respData[i].address;
          }
          // Take the last BTC address we hit, shouldn't matter which one
          if (respData[i].address_type == 100 || respData[i].address_type == 101) {
            addresses.btc = respData[i].address;
          }
        }

        if (addresses.btc === 'undefined' && addresses.btc === 'undefined'){
          return reject('Error contacting opencap server, no response');
        }

        return resolve({addresses, dnssec});
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
