'use strict';

angular.module('copayApp.services').service('opencapService', function () {

    function getAddressCall(host, alias, dnssec) {
        var callback = function () {
            return fetch(
                `https://${host}/v1/addresses?alias=${alias}`,
                {
                    method: "GET"
                },
                "application/json"
            );
        };

        return new Promise((resolve, reject) => {
            callback()
                .then(parseJSON)
                .then(response => {
                    if (response.ok) {
                        if (typeof response.body === "undefined") {
                            return reject('Error contacting opencap server, no data')
                        }

                        for (var i = 0; i < response.body.length; i++) {
                            if (response.body[i].address_type === "undefined") {
                                continue
                            }
                            if (response.body[i].address_type !== 200 && response.body[i].address_type !== 201) {
                                continue
                            }
                            if (response.body[i].address !== "undefined") {
                                return resolve({ address: response.body[i].address, dnssec })
                            }
                        }

                        return reject('Error contacting opencap server, no response');
                    }

                    return reject('Error contacting opencap server, bad response');
                })
                .catch(error =>
                    reject(error.message)
                );
        });
    }

    function getAliasData(domain, alias) {
        var callback = function () {
            return fetch(
                `https://dns.google.com/resolve?name=_opencap._tcp.${domain}&type=SRV`,
                {
                    method: "GET"
                },
                "application/json"
            );
        };

        return callback()
            .then(parseJSON)
            .then(response => {
                return new Promise((resolve, reject) => {
                    if (response.ok) {
                        if (typeof response.body.AD === "undefined") {
                            return reject('Error contacting google dns server, no dnnssec data')
                        }
                        let dnssec = response.body.AD;

                        if (typeof response.body.Answer === "undefined") {
                            return reject('Error contacting google dns server, no srv data')
                        }
                        if (response.body.Answer.length < 1) {
                            return reject('Error contacting google dns server, not enough srv data')
                        }

                        let record = response.body.Answer[0].data.split(' ')
                        if (record.length != 4) {
                            return reject('Error contacting google dns server, improper srv data')
                        }

                        if (record[3].slice(-1) == '.') {
                            record[3] = record[3].substring(0, record[3].length - 1);
                        }

                        return resolve({ target: record[3], alias, dnssec })
                    }

                    return reject('Error contacting google dns server, bad response');
                });
            })
            .then(args =>
                getAddressCall(args.target, args.alias, args.dnssec)
            )
            .catch(function (error) {
                return new Promise((resolve, reject) => {
                    reject(error)
                })
            })
    }

    function parseJSON(response) {
        return new Promise(resolve =>
            response.json().then(json =>
                resolve({
                    status: response.status,
                    ok: response.ok,
                    body: json,
                })
            )
        );
    }

    function validateUsername(username) {
        return /^[a-z0-9._-]{1,25}$/.test(username);
    }

    function validateDomain(username) {
        return /^[a-z0-9.\-]+\.[a-z]{2,4}$/.test(username);
    }

    function validateAlias(alias) {
        let splitAlias = alias.split('$');
        if (splitAlias.length != 2) {
            return { username: '', domain: '' }
        }
        let username = splitAlias[0];
        let domain = splitAlias[1];

        if (!validateUsername(username)) {
            return { username: '', domain: '' }
        }
        if (!validateDomain(domain)) {
            return { username: '', domain: '' }
        }

        return { username, domain }
    }

    function get(alias) {
        let aliasData = validateAlias(alias)
        if (aliasData.username === '' || aliasData.domain === '') {
            return new Promise((resolve, reject) => {
                return reject('Invalid OpenCAP alias')
            })
        }

        return getAliasData(aliasData.domain, alias)
    }

    return {
        get,
    };
});