

describe('storageService on mobile', function(){
  var appConfig,
    expectedOldProfileSavedToSecure,
    expectedOldProfileMergedWithSecure,
    fileStorageServiceMock,
    log, 
    oldProfile,
    platformInfoStub, 
    savedSecureProfile,
    secureStorageService,
    secureStorageServiceMock,
    storageService;

  expectedOldProfileMergedWithSecure = '{"version":"1.0.0","appVersion":"4.11.0","createdOn":1528363260283,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K4Mge6QumKYh1aSYLB26z6QhkDz8tJLuXdumCJy9PYBrHMrTW3boiaodkVNTciR7PcPAcLXZeUWSehMJc3GXJp1uR68x3Nh5","xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPrivKey":"8fde6c8da5cf59cc0b19e87ea102aef2799047b9062f3e08668a92ef4582e040","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2","copayerId":"81f52508c14d50cdde2ad527920f209cbf51162b0dbaa7ceac298ed6d34d1ff8","publicKeyRing":[{"xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2"}],"walletId":"9580929b-417d-4fce-bcbf-de8e16a51c25","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"54dd6773fec23b07eff5cda33fd0ad2591de31db356c67cd3e5dc67211d7c8ac","personalEncryptingKey":"r5Tpd+/YD6uGXKZeeqZBPg==","sharedEncryptingKey":"PptIrH74qd63DPMC1LQ/dQ==","copayerName":"me","mnemonic":"forget camera antique cement army ahead quantum leisure claim behind climb eight","entropySource":"fc2357f9d0176aa3a571bdfdea9e12cd16c27019e87b80ab0f08ddf15101d532","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K4Mge6QumKYh1aSYLB26z6QhkDz8tJLuXdumCJy9PYBrHMrTW3boiaodkVNTciR7PcPAcLXZeUWSehMJc3GXJp1uR68x3Nh5","xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPrivKey":"8fde6c8da5cf59cc0b19e87ea102aef2799047b9062f3e08668a92ef4582e040","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2","copayerId":"6f3c19e90d6eb9096a57199d53494fd6d62852ffaaa62fb5a5baef9f65753ce1","publicKeyRing":[{"xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2"}],"walletId":"ef78459e-52b1-418a-b89d-4df2ef1d27ea","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"2ac4835b2c883e095f4b187d712e53701781cb0d24e8813e736fd2d8a3219fec","personalEncryptingKey":"r5Tpd+/YD6uGXKZeeqZBPg==","sharedEncryptingKey":"WMcSMqfwZ+qfhP58S9l6OA==","copayerName":"me","mnemonic":"forget camera antique cement army ahead quantum leisure claim behind climb eight","entropySource":"fc2357f9d0176aa3a571bdfdea9e12cd16c27019e87b80ab0f08ddf15101d532","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"cc5667792d8378ad61dc30a65bafea3d03d9179c5615d9f183738b002d978659","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"a8ea9291-1369-4862-90a1-d80a5d4bcc20","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"8437d2824b17f31d548fc2855577e9092ac5a7f9c985e5329acab34a8e786fb8","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"ZhMBX+t9/0n2kCasR5KH0w==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"8430d4ca7a324ce0176e782c2d48f333666bd8f9b66fdd432a7f1ad1c80341ec","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"30df9228ff38258afe363a29cb02bff6d76f9f66ed36250de493717f4c941cc1","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"2wQyQJGV3vyRPE/uil9ZRA==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"9580929b-417d-4fce-bcbf-de8e16a51c25":true,"ef78459e-52b1-418a-b89d-4df2ef1d27ea":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';
  expectedOldProfileSavedToSecure = '{"version":"1.0.0","appVersion":"${appVersion}","createdOn":1528363022385,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"cc5667792d8378ad61dc30a65bafea3d03d9179c5615d9f183738b002d978659","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"a8ea9291-1369-4862-90a1-d80a5d4bcc20","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"8437d2824b17f31d548fc2855577e9092ac5a7f9c985e5329acab34a8e786fb8","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"ZhMBX+t9/0n2kCasR5KH0w==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"8430d4ca7a324ce0176e782c2d48f333666bd8f9b66fdd432a7f1ad1c80341ec","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"30df9228ff38258afe363a29cb02bff6d76f9f66ed36250de493717f4c941cc1","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"2wQyQJGV3vyRPE/uil9ZRA==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"a8ea9291-1369-4862-90a1-d80a5d4bcc20":true,"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';    
  oldProfile = '{"version":"1.0.0","createdOn":1528363022385,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"cc5667792d8378ad61dc30a65bafea3d03d9179c5615d9f183738b002d978659","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"a8ea9291-1369-4862-90a1-d80a5d4bcc20","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"8437d2824b17f31d548fc2855577e9092ac5a7f9c985e5329acab34a8e786fb8","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"ZhMBX+t9/0n2kCasR5KH0w==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"8430d4ca7a324ce0176e782c2d48f333666bd8f9b66fdd432a7f1ad1c80341ec","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"30df9228ff38258afe363a29cb02bff6d76f9f66ed36250de493717f4c941cc1","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"2wQyQJGV3vyRPE/uil9ZRA==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"a8ea9291-1369-4862-90a1-d80a5d4bcc20":true,"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';  
  secureProfile = '{"version":"1.0.0","appVersion":"4.11.0","createdOn":1528363260283,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K4Mge6QumKYh1aSYLB26z6QhkDz8tJLuXdumCJy9PYBrHMrTW3boiaodkVNTciR7PcPAcLXZeUWSehMJc3GXJp1uR68x3Nh5","xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPrivKey":"8fde6c8da5cf59cc0b19e87ea102aef2799047b9062f3e08668a92ef4582e040","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2","copayerId":"81f52508c14d50cdde2ad527920f209cbf51162b0dbaa7ceac298ed6d34d1ff8","publicKeyRing":[{"xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2"}],"walletId":"9580929b-417d-4fce-bcbf-de8e16a51c25","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"54dd6773fec23b07eff5cda33fd0ad2591de31db356c67cd3e5dc67211d7c8ac","personalEncryptingKey":"r5Tpd+/YD6uGXKZeeqZBPg==","sharedEncryptingKey":"PptIrH74qd63DPMC1LQ/dQ==","copayerName":"me","mnemonic":"forget camera antique cement army ahead quantum leisure claim behind climb eight","entropySource":"fc2357f9d0176aa3a571bdfdea9e12cd16c27019e87b80ab0f08ddf15101d532","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K4Mge6QumKYh1aSYLB26z6QhkDz8tJLuXdumCJy9PYBrHMrTW3boiaodkVNTciR7PcPAcLXZeUWSehMJc3GXJp1uR68x3Nh5","xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPrivKey":"8fde6c8da5cf59cc0b19e87ea102aef2799047b9062f3e08668a92ef4582e040","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2","copayerId":"6f3c19e90d6eb9096a57199d53494fd6d62852ffaaa62fb5a5baef9f65753ce1","publicKeyRing":[{"xPubKey":"xpub6CGZNmTZ9KmHyxgbqZhfcJKwhrgN5EfHh2P7YppRXPGvUg6QkAuErmaQQa3cjyS9NMuFnvxm1eNUcbUEuiVikzUmZmVrtVcU7uvjWUNrRTG","requestPubKey":"0366db5dd83550ebefa8946d770e68ea8bb0e197076713bb681fb80d6fbc4278b2"}],"walletId":"ef78459e-52b1-418a-b89d-4df2ef1d27ea","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"2ac4835b2c883e095f4b187d712e53701781cb0d24e8813e736fd2d8a3219fec","personalEncryptingKey":"r5Tpd+/YD6uGXKZeeqZBPg==","sharedEncryptingKey":"WMcSMqfwZ+qfhP58S9l6OA==","copayerName":"me","mnemonic":"forget camera antique cement army ahead quantum leisure claim behind climb eight","entropySource":"fc2357f9d0176aa3a571bdfdea9e12cd16c27019e87b80ab0f08ddf15101d532","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"9580929b-417d-4fce-bcbf-de8e16a51c25":true,"ef78459e-52b1-418a-b89d-4df2ef1d27ea":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';
  secureProfileFromOldOnly = '{"version":"1.0.0","appVersion":"${appVersion}","createdOn":1528363022385,"credentials":[{"coin":"bch","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"cc5667792d8378ad61dc30a65bafea3d03d9179c5615d9f183738b002d978659","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"a8ea9291-1369-4862-90a1-d80a5d4bcc20","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"8437d2824b17f31d548fc2855577e9092ac5a7f9c985e5329acab34a8e786fb8","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"ZhMBX+t9/0n2kCasR5KH0w==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"},{"coin":"btc","network":"livenet","xPrivKey":"xprv9s21ZrQH143K2vd69iX1D5R2Acdjx6hzsSncBqnTri7UUad3SxSxFGukcjCUBKfWtZx3KGVjSd94ypEz4gB5RzATenxCEVPPZsgVJpoXkRq","xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPrivKey":"c1cac5328bf71c0f73f64ef868ddea66356ba797f87af4939390d58a7ff1aeda","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d","copayerId":"8430d4ca7a324ce0176e782c2d48f333666bd8f9b66fdd432a7f1ad1c80341ec","publicKeyRing":[{"xPubKey":"xpub6CZLbRhS7jEN2UT3ZhGeia6jPxr4guckZDa7ogncrrES2GyMj7Pq5U4oYLV2FhAMuuYA8qzxWV3TDXXDSkGTaqHstjRANCgCjrMDA1r7AN8","requestPubKey":"02b41c465aaf8f41192f2444a07c6e64d6147a080c5b82a6e73b3b232f11e1575d"}],"walletId":"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b","walletName":"Personal Wallet","m":1,"n":1,"walletPrivKey":"30df9228ff38258afe363a29cb02bff6d76f9f66ed36250de493717f4c941cc1","personalEncryptingKey":"qZmFZypS3TufwM5+WzvNJw==","sharedEncryptingKey":"2wQyQJGV3vyRPE/uil9ZRA==","copayerName":"me","mnemonic":"morning conduct milk catch victory smoke ship little dutch original legal gadget","entropySource":"3f88849ae9522574a2aaab870594b25a4e90b9dc632724ef3675fc3c49aa93b9","mnemonicHasPassphrase":false,"derivationStrategy":"BIP44","account":0,"compliantDerivation":true,"addressType":"P2PKH"}],"disclaimerAccepted":true,"checked":{"a8ea9291-1369-4862-90a1-d80a5d4bcc20":true,"f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b":true},"checkedUA":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}';
  
  log = {
    debug: function(s){ console.log(s); },
    error: function(s){ console.log(s); },
    info: function(s){ console.log(s); }
  };

  beforeEach(function(){
    module('ngLodash');
    module('bwcModule');
    module('copayApp.services');

    fileStorageServiceMock = {
      get: jasmine.createSpy(),
      remove: jasmine.createSpy()
    };

    platformInfoStub = {
      isCordova: true,
      isWP: false
    };
    
    secureStorageServiceMock = {
      get: jasmine.createSpy(),
      set: jasmine.createSpy()
    };
    
    module(function($provide) {
      $provide.value('fileStorageService', fileStorageServiceMock);
      $provide.value('platformInfo', platformInfoStub);
      $provide.value('secureStorageService', secureStorageServiceMock);
    });

    inject(function($injector){
      appConfig = $injector.get('appConfigService');
      storageService = $injector.get('storageService');
    });

    secureProfileFromOldOnly = secureProfileFromOldOnly.replace('${appVersion}', appConfig.version);
    expectedOldProfileSavedToSecure = expectedOldProfileSavedToSecure.replace('${appVersion}', appConfig.version);

  });

  it('getProfile() from file storage.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, keyFileRemove, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, null);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });
  
    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k;
      savedProfile = v;
      cb(null);
    });

    fileStorageServiceMock.remove.and.callFake(function(k, cb){
      keyFileRemove = k;
      cb(null);
    });

    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error).toBeFalsy();
    expect(profile).toBeTruthy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');
    expect(keyFileRemove).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileSavedToSecure);
    expect(fileStorageServiceMock.remove.calls.any()).toBe(true);

    expect(profile.appVersion).toBe(appConfig.version);
    expect(profile.createdOn).toBe(1528363022385);
    
    expect(profile.credentials[0].coin).toBe('bch');
    expect(profile.credentials[0].mnemonic).toBe('morning conduct milk catch victory smoke ship little dutch original legal gadget');
    expect(profile.credentials[0].walletId).toBe('a8ea9291-1369-4862-90a1-d80a5d4bcc20');
    
    expect(profile.credentials[1].coin).toBe('btc');
    expect(profile.credentials[1].mnemonic).toBe('morning conduct milk catch victory smoke ship little dutch original legal gadget');
    expect(profile.credentials[1].walletId).toBe('f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b');
  });

  it('getProfile() from file storage, remove fails.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, keyFileRemove, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, null);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });
  
    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k;
      savedProfile = v;
      cb(null);
    });

    fileStorageServiceMock.remove.and.callFake(function(k, cb){
      keyFileRemove = k;
      cb(new Error('Remove error.'));
    });

    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('Remove error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');
    expect(keyFileRemove).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileSavedToSecure);
  });

  it('getProfile() from file storage, secure set fails, not removed.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, null);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });
  
    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k;
      savedProfile = v;
      cb(new Error('Set error.'));
    });

    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('Set error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileSavedToSecure);

    expect(fileStorageServiceMock.remove.calls.any()).toBe(false);
  });

  it('getProfile(), secure get fails.', function() {
    var error, keySecureGet, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(new Error('Secure get error.'), null);
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('Secure get error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');

    expect(fileStorageServiceMock.remove.calls.any()).toBe(false);
  });

  it('getProfile(), secure get succeeds, file storage get fails.', function() {
    var error, keySecureGet, keyFileGet, profile, profile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, secureProfile);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(new Error('File storage get error.'), null);
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('File storage get error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');

    expect(fileStorageServiceMock.remove.calls.any()).toBe(false);
  });

  it('getProfile() from secure storage.', function() {
    var error, keySecureGet, keyFileGet, profile, profile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, secureProfile);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, null);
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error).toBeFalsy();
    expect(profile).toBeTruthy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');

    expect(profile.appVersion).toBe('4.11.0');
    expect(profile.createdOn).toBe(1528363260283);

    expect(profile.credentials[0].coin).toBe('bch');
    expect(profile.credentials[0].mnemonic).toBe('forget camera antique cement army ahead quantum leisure claim behind climb eight');
    expect(profile.credentials[0].walletId).toBe('9580929b-417d-4fce-bcbf-de8e16a51c25');
    
    expect(profile.credentials[1].coin).toBe('btc');
    expect(profile.credentials[1].mnemonic).toBe('forget camera antique cement army ahead quantum leisure claim behind climb eight');
    expect(profile.credentials[1].walletId).toBe('ef78459e-52b1-418a-b89d-4df2ef1d27ea');
  });

  it('getProfile() merge from local and secure storage.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, keyFileRemove, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, secureProfile);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });

    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k;
      savedProfile = v;
      cb(null);
    });

    fileStorageServiceMock.remove.and.callFake(function(k, cb){
      keyFileRemove = k;
      cb(null);
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error).toBeFalsy();
    expect(profile).toBeTruthy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');
    expect(keyFileRemove).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileMergedWithSecure);

    expect(profile.appVersion).toBe('4.11.0');
    expect(profile.createdOn).toBe(1528363260283);

    // Existing secure
    expect(profile.credentials[0].coin).toBe('bch');
    expect(profile.credentials[0].mnemonic).toBe('forget camera antique cement army ahead quantum leisure claim behind climb eight');
    expect(profile.credentials[0].walletId).toBe('9580929b-417d-4fce-bcbf-de8e16a51c25');
    
    expect(profile.credentials[1].coin).toBe('btc');
    expect(profile.credentials[1].mnemonic).toBe('forget camera antique cement army ahead quantum leisure claim behind climb eight');
    expect(profile.credentials[1].walletId).toBe('ef78459e-52b1-418a-b89d-4df2ef1d27ea');

    // Old
    expect(profile.credentials[2].coin).toBe('bch');
    expect(profile.credentials[2].mnemonic).toBe('morning conduct milk catch victory smoke ship little dutch original legal gadget');
    expect(profile.credentials[2].walletId).toBe('a8ea9291-1369-4862-90a1-d80a5d4bcc20');
    
    expect(profile.credentials[3].coin).toBe('btc');
    expect(profile.credentials[3].mnemonic).toBe('morning conduct milk catch victory smoke ship little dutch original legal gadget');
    expect(profile.credentials[3].walletId).toBe('f4ff4629-ff53-4bc7-8c98-e7c8e0149d3b');
 
  });

  it('getProfile() merge from local and secure storage, secure set fails, not removed from local.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, secureProfile);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });

    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k;
      savedProfile = v;
      cb(new Error('Secure set error.'));
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('Secure set error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileMergedWithSecure);

    expect(fileStorageServiceMock.remove.calls.any()).toBe(false);
  });

  it('getProfile() merge from local and secure storage, remove from local fails.', function() {
    var error, keySecureGet, keyFileGet, keySecureSet, keyFileRemove, profile, profile, savedProfile;

    secureStorageServiceMock.get.and.callFake(function(k, cb){
      keySecureGet = k;
      cb(null, secureProfile);
    });
    
    fileStorageServiceMock.get.and.callFake(function(k, cb){
      keyFileGet = k;
      cb(null, oldProfile);
    });

    secureStorageServiceMock.set.and.callFake(function(k, v, cb){
      keySecureSet = k
      savedProfile = v;
      cb(null);
    });

    fileStorageServiceMock.remove.and.callFake(function(k, cb){
      keyFileRemove = k;
      cb(new Error('Remove error.'));
    });
  
    storageService.getProfile(function(err, p){
      error = err;
      profile = p;
    });

    expect(error.message).toBe('Remove error.');
    expect(profile).toBeFalsy();

    expect(keySecureGet).toBe('profile');
    expect(keyFileGet).toBe('profile');
    expect(keySecureSet).toBe('profile');
    expect(keyFileRemove).toBe('profile');

    expect(savedProfile).toBe(expectedOldProfileMergedWithSecure);
  });

});