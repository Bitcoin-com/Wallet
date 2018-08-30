fdescribe('bitcoinUriService', function() {
  var bitcoinUriService;

  beforeEach(function() {
    module('bitcoinCashJsModule');
    module('bitcoincom.services');
    module('bwcModule');

    inject(function($injector){
      bitcoinUriService = $injector.get('bitcoinUriService');
    });
  });
  
  
  it('Bitcoin BIP72', function() {

    var parsed = bitcoinUriService.parse('bitcoin:?r=https://bitpay.com/i/CwzbKP3k3JNgXJBfuoerDr');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('btc');
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.publicAddress).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/CwzbKP3k3JNgXJBfuoerDr');
  });

  it('Bitcoin Cash BIP72', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:?r=https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress).toBeUndefined();
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');
  });

  it('Bitcoin Cash prefix with legacy address', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:1G9FA9fFnHfTYxvmXeAbBD9FwzPAVMbd3j');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.legacy).toBe('1G9FA9fFnHfTYxvmXeAbBD9FwzPAVMbd3j');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin Cash prefix with legacy address on testnet', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:mkDQrKfSFD441JxrD1iPBsJFExgkvrPGQn');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.legacy).toBe('mkDQrKfSFD441JxrD1iPBsJFExgkvrPGQn');
    expect(parsed.testnet).toBe(true);
  });

  it('Bitcoin Cash uri with extended params', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qr8v2vqnzntykakht43rqmxq8cdjzjp795fc3vsjgc?unknown=something&mystery=Melton%20probang&req-one=ichi&req-beta=Ni%20san');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.others.mystery).toBe('Melton probang');
    expect(parsed.others.unknown).toBe('something');
    expect(parsed.publicAddress.cashAddr).toBe('qr8v2vqnzntykakht43rqmxq8cdjzjp795fc3vsjgc');
    expect(parsed.req['req-beta']).toBe('Ni san');
    expect(parsed.req['req-one']).toBe('ichi');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin Cash uri with invalid amount', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qq0knhwj4d5zy3kdph24w6etq58vwzua6sm7lhcmuk?amount=three');

    expect(parsed.isValid).toBe(false);
  });
  

  it('Bitcoin testnet address', function() {

    var parsed = bitcoinUriService.parse('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBeUndefined();
    expect(parsed.publicAddress.legacy).toBe('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');
    expect(parsed.testnet).toBe(true);
  });

  it('Bitcoin uri', function() {

    var parsed = bitcoinUriService.parse('bitcoin:15yCdKWVKRvfXMJpPYZBqMhiGKwjKzZdLN');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('btc');
    expect(parsed.publicAddress.legacy).toBe('15yCdKWVKRvfXMJpPYZBqMhiGKwjKzZdLN');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with encoded label', function() {

    var parsed = bitcoinUriService.parse('bitcoin:1MxudKDEBWZ1yjizUSf6htacenNtb3DWbT?label=Mr.%20Smith');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('btc');
    expect(parsed.label).toBe('Mr. Smith');
    expect(parsed.publicAddress.legacy).toBe('1MxudKDEBWZ1yjizUSf6htacenNtb3DWbT');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with params', function() {

    var parsed = bitcoinUriService.parse('bitcoin:12nCRhMDfxVnuF3uYMXv2fNxBohNmacfWu?amount=20.3&label=Luke-Jr&message=Donation%20for%20project%20xyz');

    expect(parsed.isValid).toBe(true);
    expect(parsed.amount).toBe('20.3');
    expect(parsed.coin).toBe('btc');
    expect(parsed.label).toBe('Luke-Jr');
    expect(parsed.publicAddress.legacy).toBe('12nCRhMDfxVnuF3uYMXv2fNxBohNmacfWu');
    expect(parsed.message).toBe('Donation for project xyz');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with slash', function() {

    var parsed = bitcoinUriService.parse('bitcoin:/1GhpYmbRaf73AZRxDwAGr6653iZBGzdgeA');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('btc');
    expect(parsed.publicAddress.legacy).toBe('1GhpYmbRaf73AZRxDwAGr6653iZBGzdgeA');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with slashes', function() {

    var parsed = bitcoinUriService.parse('bitcoin://18PCPhgZJjLxe9g3Q1BXLpL5aVut1fW3aX');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('btc');
    expect(parsed.publicAddress.legacy).toBe('18PCPhgZJjLxe9g3Q1BXLpL5aVut1fW3aX');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitpay without prefix', function() {

    var parsed = bitcoinUriService.parse('CJoRov8TirekvajiimQpb5Hk95evA7H2Yz');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.bitpay).toBe('CJoRov8TirekvajiimQpb5Hk95evA7H2Yz');
    expect(parsed.testnet).toBe(false);
  });

  it('legacy address', function() {

    var parsed = bitcoinUriService.parse('1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBeUndefined();
    expect(parsed.publicAddress.legacy).toBe('1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr testnet with prefix', function() {

    var parsed = bitcoinUriService.parse('bchtest:qpcz6pmurq9ctg5848trzz9zmuuygj4q5qam7ph3gt');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qpcz6pmurq9ctg5848trzz9zmuuygj4q5qam7ph3gt');
    expect(parsed.testnet).toBe(true);
  });

  it('cashAddr uppercase', function() {

    var parsed = bitcoinUriService.parse('BITCOINCASH:QZZG9NMC5VX8GAP6XFATX3TWNSDN2YRMCSSULSMY44');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qzzg9nmc5vx8gap6xfatx3twnsdn2yrmcssulsmy44');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr with dash', function() {

    var parsed = bitcoinUriService.parse('bitcoin-cash:qpshfu3dk5s3e7zdcgdcun6xgxtra6uyxs7g580js0');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qpshfu3dk5s3e7zdcgdcun6xgxtra6uyxs7g580js0');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr with prefix', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr with slash', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:/qzdectfmuw0xxztfx7mh045830dqcshj85hr44l35a');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qzdectfmuw0xxztfx7mh045830dqcshj85hr44l35a');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr with slashes', function() {

    var parsed = bitcoinUriService.parse('bitcoincash://qpj966w8utue75lqqq3rlgh20zkz3rmydqpq8syv9c');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qpj966w8utue75lqqq3rlgh20zkz3rmydqpq8syv9c');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr without prefix', function() {

    var parsed = bitcoinUriService.parse('qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');

    expect(parsed.isValid).toBe(true);
    expect(parsed.coin).toBe('bch');
    expect(parsed.publicAddress.cashAddr).toBe('qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');
    expect(parsed.testnet).toBe(false);
  });

  it('copay invitation', function() {

    var parsed = bitcoinUriService.parse('PD5B7rEEj72st9d5nFszyuKxJP6FAGS7idVC2SMqiMxUcWVd8JifZDJw1UgjUctxefUFE3Sz6qLbch');

    expect(parsed.isValid).toBe(true);
    expect(parsed.copayInvitation).toBe('PD5B7rEEj72st9d5nFszyuKxJP6FAGS7idVC2SMqiMxUcWVd8JifZDJw1UgjUctxefUFE3Sz6qLbch');
  });

  // Invalid addresses from https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
  it('invalid cashAddr style 1', function() {
    var parsed = bitcoinUriService.parse('prefix:x64nx6hz');
    expect(parsed.isValid).toBe(false);
  });

  it('invalid cashAddr style 2', function() {
    var parsed = bitcoinUriService.parse('p:gpf8m4h7');
    expect(parsed.isValid).toBe(false);
  });

  it('invalid cashAddr style 3', function() {
    var parsed = bitcoinUriService.parse('bitcoincash:qpzry9x8gf2tvdw0s3jn54khce6mua7lcw20ayyn');
    expect(parsed.isValid).toBe(false);
  });

  it('invalid cashAddr style 4', function() {
    var parsed = bitcoinUriService.parse('bchtest:testnetaddress4d6njnut');
    expect(parsed.isValid).toBe(false);
  });

  it('invalid cashAddr style 5', function() {
    var parsed = bitcoinUriService.parse('bchreg:555555555555555555555555555555555555555555555udxmlmrz');
    expect(parsed.isValid).toBe(false);
  });

  it('non-string', function() {

    var parsed = bitcoinUriService.parse([1, 2, 3, 4]);

    expect(parsed.isValid).toBe(false);
  });

  it('private key encrypted with BIP38', function() {

    var parsed = bitcoinUriService.parse('6PRN5nEDmX842gsBzJryPu8Tw5kcsaQq1GPLcjVQPcEStvbFAtz11JX9pX');

    expect(parsed.isValid).toBe(true);
    expect(parsed.privateKey.encrypted).toBe('6PRN5nEDmX842gsBzJryPu8Tw5kcsaQq1GPLcjVQPcEStvbFAtz11JX9pX');
  });

  it('private key for compressed pubkey mainnet', function() {

    var parsed = bitcoinUriService.parse('5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ');

    expect(parsed.isValid).toBe(true);
    expect(parsed.privateKey.wif).toBe('5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ');
    expect(parsed.testnet).toBe(false);
  });

  it('private key for compressed pubkey mainnet with wrong checksum', function() {

    var parsed = bitcoinUriService.parse('5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTu');

    expect(parsed.isValid).toBe(false);
  });

  it('private key for compressed pubkey testnet', function() {

    var parsed = bitcoinUriService.parse('cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm');

    expect(parsed.isValid).toBe(true);
    expect(parsed.privateKey.wif).toBe('cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm');
    expect(parsed.testnet).toBe(true);
  });

  it('private key for compressed pubkey testnet with wrong checksum', function() {

    var parsed = bitcoinUriService.parse('cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMM');

    expect(parsed.isValid).toBe(false);
  });

  it('private key for uncompressed pubkey mainnet', function() {

    var parsed = bitcoinUriService.parse('L18V3rAhCKEioPnJ4BHLCCsaYa8eSNFrMjNQ2EdwgeAdmBSnTMwx');

    expect(parsed.isValid).toBe(true);
    expect(parsed.privateKey.wif).toBe('L18V3rAhCKEioPnJ4BHLCCsaYa8eSNFrMjNQ2EdwgeAdmBSnTMwx');
    expect(parsed.testnet).toBe(false);
  });

  it('private key for uncompressed pubkey mainnet with wrong checksum', function() {

    var parsed = bitcoinUriService.parse('L18V3rAhCKEioPnJ4BHLCCsaYa8eSNFrMjNQ2EdwgeAdmBSnTTwx');

    expect(parsed.isValid).toBe(false);
  });

  it('private key for uncompressed pubkey testnet', function() {

    var parsed = bitcoinUriService.parse('92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc');

    expect(parsed.isValid).toBe(true);
    expect(parsed.privateKey.wif).toBe('92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc');
    expect(parsed.testnet).toBe(true);
  });

  it('private key for uncompressed pubkey testnet with wrong checksum', function() {

    var parsed = bitcoinUriService.parse('92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcC');

    expect(parsed.isValid).toBe(false);
  });

  it('URL only', function() {

    var parsed = bitcoinUriService.parse('https://www.google.com');

    expect(parsed.isValid).toBe(false);
  });

});