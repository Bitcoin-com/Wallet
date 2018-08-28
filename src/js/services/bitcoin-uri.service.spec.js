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
  
  

  it('Bitcoin Cash BIP72', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:?r=https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBeUndefined()
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBeUndefined();
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/SmHdie5dvBnG5kouZzEPzu');
  });

  it('Bitcoin BIP72', function() {

    var parsed = bitcoinUriService.parse('bitcoin:?r=https://bitpay.com/i/CwzbKP3k3JNgXJBfuoerDr');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBeUndefined()
    expect(parsed.coin).toBe('btc');
    expect(parsed.legacyAddress).toBeUndefined();
    expect(parsed.testnet).toBeUndefined();
    expect(parsed.url).toBe('https://bitpay.com/i/CwzbKP3k3JNgXJBfuoerDr');
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
    expect(parsed.address).toBe('bchtest:qpcz6pmurq9ctg5848trzz9zmuuygj4q5qam7ph3gt');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('mqk5vE278ytt6LUZqd97wi8c3FHsSYREX4');
    expect(parsed.testnet).toBe(true);
  });

  it('cashAddr with prefix', function() {

    var parsed = bitcoinUriService.parse('bitcoincash:qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('bitcoincash:qrq9p82a247lecv08ldk5p5h6ahtnjzpqcnh8yhq92');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('1JXsK3HSFqoMnwh4Mevf5bTgqPcgNWX7ic');
    expect(parsed.testnet).toBe(false);
  });

  it('cashAddr without prefix', function() {

    var parsed = bitcoinUriService.parse('qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');

    expect(parsed.isValid).toBe(true);
    expect(parsed.address).toBe('bitcoincash:qqen2y3l28dpk0dzsag8w027ds96u7z4pc0uxtl0nq');
    expect(parsed.coin).toBe('bch');
    expect(parsed.legacyAddress).toBe('15fm3EwqgBYcxkndALBfforueps5yWKReJ');
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