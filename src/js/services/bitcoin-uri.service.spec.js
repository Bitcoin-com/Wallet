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
    expect(parsed.address).toBeUndefined();
    expect(parsed.coin).toBe('btc');
    expect(parsed.legacyAddress).toBeUndefined();
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/CwzbKP3k3JNgXJBfuoerDr');
  });

  it('Bitcoin Cash BIP72', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:?r=https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBeUndefined();
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBeUndefined();
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');
  });

  it('Bitcoin Cash prefix with legacy address', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:1G9FA9fFnHfTYxvmXeAbBD9FwzPAVMbd3j');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('1G9FA9fFnHfTYxvmXeAbBD9FwzPAVMbd3j');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('1G9FA9fFnHfTYxvmXeAbBD9FwzPAVMbd3j');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin Cash prefix with legacy address on testnet', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:mkDQrKfSFD441JxrD1iPBsJFExgkvrPGQn');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('mkDQrKfSFD441JxrD1iPBsJFExgkvrPGQn');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('mkDQrKfSFD441JxrD1iPBsJFExgkvrPGQn');
    expect(parsed.testnet).toBe(true);
  });

  it('Bitcoin Cash uri with extended params', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qr8v2vqnzntykakht43rqmxq8cdjzjp795fc3vsjgc?unknown=something&mystery=Melton%20probang&req-one=ichi&req-beta=Ni%20san');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('qr8v2vqnzntykakht43rqmxq8cdjzjp795fc3vsjgc');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('1KrJRNApaAKRvHL5kDtL69nwmAJ31apAnu');
    expect(parsed.others.mystery).toBe('Melton probang');
    expect(parsed.others.unknown).toBe('something');
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
    expect(parsed.address).toBe('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');
    expect(parsed.coin).toBeUndefined();
    expect(parsed.legacyAddress).toBe('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');
    expect(parsed.testnet).toBe(true);
  });

  it('Bitcoin testnet address', function() {

    var parsed = bitcoinUriService.parse('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');
    expect(parsed.coin).toBeUndefined();
    expect(parsed.legacyAddress).toBe('mtWcoToWhbtPoCby5fvs8xdBujT5GGenD4');
    expect(parsed.testnet).toBe(true);
  });

  it('Bitcoin uri', function() {

    var parsed = bitcoinUriService.parse('bitcoin:15yCdKWVKRvfXMJpPYZBqMhiGKwjKzZdLN');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('15yCdKWVKRvfXMJpPYZBqMhiGKwjKzZdLN');
    expect(parsed.coin).toBe('btc');
    expect(parsed.legacyAddress).toBe('15yCdKWVKRvfXMJpPYZBqMhiGKwjKzZdLN');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with encoded label', function() {

    var parsed = bitcoinUriService.parse('bitcoin:1MxudKDEBWZ1yjizUSf6htacenNtb3DWbT?label=Mr.%20Smith');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('1MxudKDEBWZ1yjizUSf6htacenNtb3DWbT');
    expect(parsed.coin).toBe('btc');
    expect(parsed.label).toBe('Mr. Smith');
    expect(parsed.legacyAddress).toBe('1MxudKDEBWZ1yjizUSf6htacenNtb3DWbT');
    expect(parsed.testnet).toBe(false);
  });

  it('Bitcoin uri with params', function() {

    var parsed = bitcoinUriService.parse('bitcoin:12nCRhMDfxVnuF3uYMXv2fNxBohNmacfWu?amount=20.3&label=Luke-Jr&message=Donation%20for%20project%20xyz');

    expect(parsed.isValid).toBe(true);
    expect(parsed.amount).toBe('20.3');
    expect(parsed.address).toBe('12nCRhMDfxVnuF3uYMXv2fNxBohNmacfWu');
    expect(parsed.coin).toBe('btc');
    expect(parsed.label).toBe('Luke-Jr');
    expect(parsed.legacyAddress).toBe('12nCRhMDfxVnuF3uYMXv2fNxBohNmacfWu');
    expect(parsed.message).toBe('Donation for project xyz');
    expect(parsed.testnet).toBe(false);
  });

  it('legacy address', function() {

    var parsed = bitcoinUriService.parse('1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW');
    expect(parsed.coin).toBeUndefined();
    expect(parsed.legacyAddress).toBe('1JXeGEu7bNEAYu6URT6dU6g1Ys6ffSAWYW');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr testnet with prefix', function() {

    var parsed = bitcoinUriService.parse('bchtest:qpcz6pmurq9ctg5848trzz9zmuuygj4q5qam7ph3gt');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('qpcz6pmurq9ctg5848trzz9zmuuygj4q5qam7ph3gt');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('mqk5vE278ytt6LUZqd97wi8c3FHsSYREX4');
    expect(parsed.testnet).toBe(true);
  });

  it('cashAddr with prefix', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');
    console.log('parsed:', JSON.stringify(parsed));

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('1JXsK3HSFqoMnwh4Mevf5bTgqPcgNWX7ic');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr without prefix', function() {

    var parsed = bitcoinUriService.parse('qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('15fm3EwqgBYcxkndALBfforueps5yWKReJ');
    expect(parsed.testnet).toBe(false);
  });


  it('Bitpay without prefix', function() {

    var parsed = bitcoinUriService.parse('CJoRov8TirekvajiimQpb5Hk95evA7H2Yz');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('CJoRov8TirekvajiimQpb5Hk95evA7H2Yz');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('13LYEsnPqogE2SqJ325u1ZfiWxSWEo6uyo');
    expect(parsed.testnet).toBe(false);
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
});