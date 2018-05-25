'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $state, $timeout, $ionicHistory, bitcore, bitcoreCash, $rootScope, payproService, scannerService, appConfigService, popupService, gettextCatalog, bitcoinCashJsService) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data, shapeshiftData) {
    var originalAddress = null;
    var noPrefixInAddress = 0;
    
    if (data.toLowerCase().indexOf('bitcoin') < 0) {
      noPrefixInAddress = 1;
    }

    if (typeof(data) == 'string' && !(/^bitcoin(cash)?:\?r=[\w+]/).exec(data) && (data.toLowerCase().indexOf('bitcoincash:') >= 0 || data[0] == 'q' || data[0] == 'p' || data[0] == 'C' || data[0] == 'H')) {
      try {
        noPrefixInAddress = 0;

        if (data[0] == 'p' || data[0] == 'q') {
          data = 'bitcoincash:' + data;
        }
        var paramString = '';
        if (data.indexOf('?') >= 0) {
          paramString = data.substring(data.indexOf('?'));
          data = data.substring(0, data.indexOf('?'));
        }

        if (data.indexOf('BITCOINCASH:') >= 0) {
          data = data.toLowerCase();
        }
        originalAddress = data.replace('bitcoincash:', '');
        var legacyAddress = bitcoinCashJsService.readAddress(data).legacy;
        data = 'bitcoincash:' + legacyAddress + paramString;
      } catch (ex) {}
    }

    $log.debug('Processing incoming data: ' + data);

    function sanitizeUri(data) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(data);
      if (!match || match.length === 0) {
        return data;
      }
      var value = match[0].replace(',', '.');
      var newUri = data.replace(regex, value);

      // mobile devices, uris like copay://glidera
      newUri.replace('://', ':');

      return newUri;
    }

    function getParameterByName(name, url) {
      if (!url) return;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function checkPrivateKey(privateKey) {
      try {
        new bitcore.PrivateKey(privateKey, 'livenet');
      } catch (err) {
        return false;
      }
      return true;
    }

    function goSend(addr, amount, message, coin, shapeshiftData) {
      $state.go('tabs.send', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.send' ? false : true
      });
      // Timeout is required to enable the "Back" button
      $timeout(function() {
        if (amount) {
          $state.transitionTo('tabs.send.confirm', {
            toAmount: amount,
            toAddress: addr,
            displayAddress: originalAddress ? originalAddress : addr,
            description: message,
            coin: coin
          });
        } else {
          var params = {
            toAddress: addr,
            coin: coin,
            displayAddress: originalAddress ? originalAddress : addr,
            noPrefix: noPrefixInAddress
          };
          if (shapeshiftData) {
            params['fromWalletId'] = shapeshiftData.fromWalletId;
            params['minShapeshiftAmount'] = shapeshiftData.minAmount;
            params['maxShapeshiftAmount'] = shapeshiftData.maxAmount;
            params['shapeshiftOrderId'] = shapeshiftData.orderId;
          }
          $state.transitionTo('tabs.send.amount', params);
        }
      }, 100);
    }
    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin(cash)?:\?r=[\w+]/).exec(data)) {
      var coin = data.indexOf('bitcoincash') >= 0 ? 'bch' : 'btc';
      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));
      if (coin == 'bch') {
        payproService.getPayProDetailsViaHttp(data, function(err, details) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err)
          } else {
            handlePayPro(createBchPayProObject(details), coin);
          }
        });
      } else {
        payproService.getPayProDetails(data, coin, function(err, details) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else {
            handlePayPro(details, coin);
          }
        });
      }
      return true;
    }

    data = sanitizeUri(data);

    // Bitcoin  URL
    if (bitcore.URI.isValid(data)) {
        var coin = 'btc';
        var parsed = new bitcore.URI(data);

        var addr = parsed.address ? parsed.address.toString() : '';
        var message = parsed.message;

        var amount = parsed.amount ? parsed.amount : '';

        if (parsed.r) {
          payproService.getPayProDetails(parsed.r, coin, function(err, details) {
            if (err) {
              if (addr && amount) goSend(addr, amount, message, coin, shapeshiftData);
              else popupService.showAlert(gettextCatalog.getString('Error'), err);
            } else handlePayPro(details, coin);
          });
        } else {
          goSend(addr, amount, message, coin, shapeshiftData);
        }
        return true;
    // Cash URI
    } else if (bitcoreCash.URI.isValid(data)) {
        var coin = 'bch';
        var parsed = new bitcoreCash.URI(data);

        var addr = parsed.address ? parsed.address.toString() : '';
        var message = parsed.message;

        var amount = parsed.amount ? parsed.amount : '';

        // paypro not yet supported on cash
        if (parsed.r) {
          payproService.getPayProDetails(parsed.r, coin, function(err, details) {
            if (err) {
              if (addr && amount)
                goSend(addr, amount, message, coin, shapeshiftData);
              else
                popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
            handlePayPro(details, coin);
          });
        } else {
          goSend(addr, amount, message, coin, shapeshiftData);
        }
        return true;

    // Cash URI with bitcoin (btc) address version number?
    } else if (bitcore.URI.isValid(data.replace(/^bitcoincash:/,'bitcoin:'))) {
        $log.debug('Handling bitcoincash URI with legacy address');
        var coin = 'bch';
        var parsed = new bitcore.URI(data.replace(/^bitcoincash:/,'bitcoin:'));

        var oldAddr = parsed.address ? parsed.address.toString() : '';
        if (!oldAddr) return false;

        var addr = '';

        var a = bitcore.Address(oldAddr).toObject();
        addr = bitcoreCash.Address.fromObject(a).toString();

        // Translate address
        $log.debug('address transalated to:' + addr);
        popupService.showConfirm(
          gettextCatalog.getString('Bitcoin cash Payment'),
          gettextCatalog.getString('Payment address was translated to new Bitcoin Cash address format: ' + addr),
          gettextCatalog.getString('OK'),
          gettextCatalog.getString('Cancel'),
          function(ret) {
            if (!ret) return false;

            var message = parsed.message;
            var amount = parsed.amount ? parsed.amount : '';

            // paypro not yet supported on cash
            if (parsed.r) {
              payproService.getPayProDetails(parsed.r, coin, function(err, details) {
                if (err) {
                  if (addr && amount)
                    goSend(addr, amount, message, coin, shapeshiftData);
                  else
                    popupService.showAlert(gettextCatalog.getString('Error'), err);
                }
                handlePayPro(details, coin);
              });
            } else {
              goSend(addr, amount, message, coin, shapeshiftData);
            }
          }
        );
      return true;
      // Plain URL
    } else if (/^https?:\/\//.test(data)) {
      payproService.getPayProDetails(data, coin, function(err, details) {
        if (err) {
          root.showMenu({
            data: data,
            type: 'url'
          });
          return;
        }
        handlePayPro(details);
        return true;
      });
      // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet') || bitcore.Address.isValid(data, 'testnet')) {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'bitcoinAddress'
        });
      } else {
        goToAmountPage(data);
      }
    } else if (bitcoreCash.Address.isValid(data, 'livenet')) {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'bitcoinAddress',
          coin: 'bch',
        });
      } else {
        goToAmountPage(data, 'bch');
      }
    } else if (data && data.indexOf(appConfigService.name + '://glidera') === 0) {
      var code = getParameterByName('code', data);
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $state.transitionTo('tabs.buyandsell.glidera', {
          code: code
        });
      });
      return true;

    } else if (data && data.indexOf(appConfigService.name + '://coinbase') === 0) {
      var code = getParameterByName('code', data);
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $state.transitionTo('tabs.buyandsell.coinbase', {
          code: code
        });
      });
      return true;

      // BitPayCard Authentication
    } else if (data && data.indexOf(appConfigService.name + '://') === 0) {

      // Disable BitPay Card
      if (!appConfigService._enabledExtensions.debitcard) return false;

      var secret = getParameterByName('secret', data);
      var email = getParameterByName('email', data);
      var otp = getParameterByName('otp', data);
      var reason = getParameterByName('r', data);

      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        switch (reason) {
          default:
            case '0':
            /* For BitPay card binding */
            $state.transitionTo('tabs.bitpayCardIntro', {
              secret: secret,
              email: email,
              otp: otp
            });
          break;
        }
      });
      return true;

      // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;

      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;
    } else if (data && (data.substring(0, 2) == '6P' || checkPrivateKey(data))) {
      root.showMenu({
        data: data,
        type: 'privateKey'
      });
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.import', {
          code: data
        });
      });
      return true;

    } else {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'text'
        });
      }
    }
    return false;
  };

  function goToAmountPage(toAddress, coin) {
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    });
    $timeout(function() {
      $state.transitionTo('tabs.send.amount', {
        toAddress: toAddress,
        coin: coin,
        noPrefix: 1
      });
    }, 100);
  }

  function createBchPayProObject(payProData) {
    var displayAddr = payProData.outputs[0].address;
    var toAddr = bitcoinCashJsService.readAddress('bitcoincash:' + displayAddr).legacy;
    return {
      amount: payProData.outputs[0].amount,
      caTrusted: true,
      domain: 'bitpay.com',
      expires: Math.floor(new Date(payProData.expires).getTime() / 1000),
      memo: payProData.memo,
      network: 'livenet',
      requiredFeeRate: payProData.requiredFeeRate,
      selfSigned: 0,
      time: Math.ceil(new Date(payProData.time).getTime() / 1000),
      displayAddress: displayAddr,
      toAddress: toAddr,
      url: payProData.paymentUrl,
      verified: true
    };
  }

  function handlePayPro(payProDetails, coin) {
    var stateParams = {
      toAmount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      paypro: payProDetails,
      coin: coin,
    };

    // fee
    if (payProDetails.requiredFeeRate) {
      stateParams.requiredFeeRate = payProDetails.requiredFeeRate * 1024;
    }

    scannerService.pausePreview();
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    }).then(function() {
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', stateParams);
      });
    });
  }

  return root;
});
