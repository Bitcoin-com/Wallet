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
});