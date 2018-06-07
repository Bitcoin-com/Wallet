describe('storageService on mobile', function(){
  var fileStorageServiceMock,
    log, 
    platformInfoStub, 
    savedSecureProfile,
    secureStorageService,
    secureStorageServiceMock,
    storageService;

  secureProfile = '{"version":"1.0.0","appVersion":"4.11.0","createdOn":1528157581638,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K3NQsKcimdhieY7LeoSkS2W1mfaH6LcTujt8S8EWjcVttzvft9LUkdLd35CRBBLQmZwm3HXACsYZfcGh3T3z2TQLiSX8gJxn","xPubKey":"xpub6CJNjqNcCCV9f77rhB9k1CSa2kQiuEPRdyB9L8YfcLJuUjKszP3TKK65X34bpURnPYeXsrbHBL6e9NHSrUZocP4dK7u691745FMwKj4pSGg","requestPrivKey":"ce3279e705e2bce3f2809245dadb7ee50886c1be81a67a63d02ccc565a9dc1a9","requestPubKey":"035826166a59e896083dbcabb10b46d78b33bd842d2284fa8b9ff6ff1c59d8091c","copayerId":"ee7b433f9368afcf5eb1e93123ad3d1dc34ba75e1162376b2a44d0a790ff9620","publicKeyRing":[{"xPubKey":"xpub6CJNjqNcCCV9f77rhB9k1CSa2kQiuEPRdyB9L8YfcLJuUjKszP3TKK65X34bpURnPYeXsrbHBL6e9NHSrUZocP4dK7u691745FMwKj4pSGg","requestPubKey":"035826166a59e896083dbcabb10b46d78b33bd842d2284fa8b9ff6ff1c59d8091c"}],"walletId":"23c6433d-f981-41fa-94c6-8096afc4d397","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"bfdb31f5737b83790be533bd66bfffbbbd65eaa8d49a99f547683768756bec22","personalEncryptingKey":"M1aiow3pBWeSYMih3E/Acw==","sharedEncryptingKey":"6+P8AuOTZMFNgT+o3hD+BQ==","copayerName":"me","mnemonic":"echo caught churn turkey twin silent visit jewel warm hover bone kitchen","entropySource":"e1e07a2218c32122a3a3d03d578d2dfc465112d1a826830ebc88405bf4a3a606","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K3NQsKcimdhieY7LeoSkS2W1mfaH6LcTujt8S8EWjcVttzvft9LUkdLd35CRBBLQmZwm3HXACsYZfcGh3T3z2TQLiSX8gJxn","xPubKey":"xpub6CJNjqNcCCV9f77rhB9k1CSa2kQiuEPRdyB9L8YfcLJuUjKszP3TKK65X34bpURnPYeXsrbHBL6e9NHSrUZocP4dK7u691745FMwKj4pSGg","requestPrivKey":"ce3279e705e2bce3f2809245dadb7ee50886c1be81a67a63d02ccc565a9dc1a9","requestPubKey":"035826166a59e896083dbcabb10b46d78b33bd842d2284fa8b9ff6ff1c59d8091c","copayerId":"eb655f1ac4567e5a4a85ae007783ded41a51225bfb046377ce04fbafc8558a05","publicKeyRing":[{"xPubKey":"xpub6CJNjqNcCCV9f77rhB9k1CSa2kQiuEPRdyB9L8YfcLJuUjKszP3TKK65X34bpURnPYeXsrbHBL6e9NHSrUZocP4dK7u691745FMwKj4pSGg","requestPubKey":"035826166a59e896083dbcabb10b46d78b33bd842d2284fa8b9ff6ff1c59d8091c"}],"walletId":"c19b75e6-e0f4-4360-a0b5-87607559ee3c","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"c27b0d17bc62085ad6b08a8a4c967e65def306c642107ca3840380339d81eee9","personalEncryptingKey":"M1aiow3pBWeSYMih3E/Acw==","sharedEncryptingKey":"w5eq2OTn7v0fjnATHISeZg==","copayerName":"me","mnemonic":"echo caught churn turkey twin silent visit jewel warm hover bone kitchen","entropySource":"e1e07a2218c32122a3a3d03d578d2dfc465112d1a826830ebc88405bf4a3a606","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K3Wb3YBRHofV2poT3NCRL9yxhm9nYWEPJoTx4DrvfAsCtGSBFfiDXD4GvxuLosghdReCr65SzyHhYFwTLis3hMT8XkWjxT3v","xPubKey":"xpub6DWndawujFrKaQ1B5mFVeD51SuPPQkS4igUYRyoPHN7RnmJRZZwhRjeDYMhqZFLQQNu1sxsbMXXFB4b7kGYtUgFRMLRcBFF9jPbcgJ72iku","requestPrivKey":"ef9beed77a18fc2d56ddcede46aa306dd8277a196bbab971e99aac8eeb69a723","requestPubKey":"02781170de79d7bd3ea7cf8f293c7379575a0c340bbf9d81e88ec8b07a18c77394","copayerId":"d3e7adc7a6816b1eaebb7a8fae6683a9b5c249c6a6c9d0c0d6ea2e163a2ae0f6","publicKeyRing":[{"xPubKey":"xpub6DWndawujFrKaQ1B5mFVeD51SuPPQkS4igUYRyoPHN7RnmJRZZwhRjeDYMhqZFLQQNu1sxsbMXXFB4b7kGYtUgFRMLRcBFF9jPbcgJ72iku","requestPubKey":"02781170de79d7bd3ea7cf8f293c7379575a0c340bbf9d81e88ec8b07a18c77394"}],"walletId":"b97197ec-59a3-4aab-a716-2eb008899fd8","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"abbb8b79be569b2027b55bd1ed7d3c581314d432c2cc7933ff4c43311818955f","personalEncryptingKey":"+Arh5OgC4fS4SXVwnilPxA==","sharedEncryptingKey":"zRfn81E5mQlTWnekbRJ2GQ==","copayerName":"me","mnemonic":"twenty six jump dragon abuse dose pig muscle awful inject diagram alpha","entropySource":"026700d62c252a483a0434ffb9c2cf0ff333f77721affc97acb3c117056707cb","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K3Wb3YBRHofV2poT3NCRL9yxhm9nYWEPJoTx4DrvfAsCtGSBFfiDXD4GvxuLosghdReCr65SzyHhYFwTLis3hMT8XkWjxT3v","xPubKey":"xpub6DWndawujFrKaQ1B5mFVeD51SuPPQkS4igUYRyoPHN7RnmJRZZwhRjeDYMhqZFLQQNu1sxsbMXXFB4b7kGYtUgFRMLRcBFF9jPbcgJ72iku","requestPrivKey":"ef9beed77a18fc2d56ddcede46aa306dd8277a196bbab971e99aac8eeb69a723","requestPubKey":"02781170de79d7bd3ea7cf8f293c7379575a0c340bbf9d81e88ec8b07a18c77394","copayerId":"a77ccab4dd3251e005e9de214a9a29b7907dd79ab38e9046000223feb8d0578b","publicKeyRing":[{"xPubKey":"xpub6DWndawujFrKaQ1B5mFVeD51SuPPQkS4igUYRyoPHN7RnmJRZZwhRjeDYMhqZFLQQNu1sxsbMXXFB4b7kGYtUgFRMLRcBFF9jPbcgJ72iku","requestPubKey":"02781170de79d7bd3ea7cf8f293c7379575a0c340bbf9d81e88ec8b07a18c77394"}],"walletId":"7c0fd6ec-caa8-46d0-8664-8eb94d5234ef","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"779d0e969697bed9cee86719433afed30bb0f41a9a6acb93b380915c68013357","personalEncryptingKey":"+Arh5OgC4fS4SXVwnilPxA==","sharedEncryptingKey":"GHNFlK2m/uobw+94Gm1Etg==","copayerName":"me","mnemonic":"twenty six jump dragon abuse dose pig muscle awful inject diagram alpha","entropySource":"026700d62c252a483a0434ffb9c2cf0ff333f77721affc97acb3c117056707cb","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"23c6433d-f981-41fa-94c6-8096afc4d397":true,"c19b75e6-e0f4-4360-a0b5-87607559ee3c":true,"b97197ec-59a3-4aab-a716-2eb008899fd8":true,"7c0fd6ec-caa8-46d0-8664-8eb94d5234ef":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';

  beforeEach(function(){
    module('ngLodash');
    module('bwcModule');
    module('copayApp.services');

    fileStorageServiceMock = {
      get: function(){}
    };

    log = {
      debug: function(s){ console.log(s); },
      error: function(s){ console.log(s); },
      info: function(s){ console.log(s); }
    };

    platformInfoStub = {
      isCordova: true,
      isWP: false
    };
    
    secureStorageServiceMock = {
      get: function(){}
    };
    
    
    module(function($provide) {
      $provide.value('fileStorageService', fileStorageServiceMock);
      $provide.value('platformInfo', platformInfoStub);
      $provide.value('secureStorageService', secureStorageServiceMock);
    });

    inject(function($injector){
      storageService = $injector.get('storageService');
    });

  });

  it('getProfile() from secure storage.', function() {
    var error, profile;

    
    spyOn(secureStorageServiceMock, 'get').and.callFake(function(k, cb){
      cb(null, secureProfile);
    });
    
    spyOn(fileStorageServiceMock, 'get').and.callFake(function(k, cb){
      cb(null, null);
    });
    
    /*
    secureStorageServiceMock.spyOn('get').and.callFake(function(cb){
      cb(null, 'the profile')
    });
    */
    

    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(profile).toBeTruthy();
    expect(error).toBeFalsy();

  });

});