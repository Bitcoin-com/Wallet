describe('secureStorageService on desktop', function(){
  var desktopSss,
    sss;

  beforeEach(function(){
    module('ngLodash');
    module('copayApp.services');

    desktopSss = {
      get: jasmine.createSpy(),
      set: jasmine.createSpy()
    };

    platformInfoStub = {
      isNW: true
    };
        
    module(function($provide) {
      $provide.value('desktopSecureStorageService', desktopSss);
      $provide.value('platformInfo', platformInfoStub);
    });

    inject(function($injector){
      sss = $injector.get('secureStorageService');
    });

  });

  it('get fails', function() {
    var error, key, result;

    desktopSss.get.and.callFake(function(k, cb){
      key = k;
      cb(new Error('Get error.'), null);
    });

    sss.get('a1234', function(e, res) {
      error = e;
      result = res;
    });

    expect(error.message).toBe('Get error.');
    expect(result).toBeFalsy();
    expect(key).toBe('a1234');
  });

  it('get succeeds', function() {
    var error, key, result;

    desktopSss.get.and.callFake(function(k, cb){
      key = k;
      cb(null, 'The result 1.');
    });

    sss.get('a123', function(e, res) {
      error = e;
      result = res;
    });

    expect(error).toBeFalsy();
    expect(result).toBe('The result 1.');
    expect(key).toBe('a123');
  });

  it('set fails', function() {
    var error, key, value;

    desktopSss.set.and.callFake(function(k, v, cb){
      key = k;
      value = v;
      cb(new Error('Set error.'));
    });

    sss.set('a12345', 'The value 1.', function(e) {
      error = e;
    });

    expect(error.message).toBe('Set error.');
    expect(key).toBe('a12345');
    expect(value).toBe('The value 1.');
  });

  it('set succeeds', function() {
    var error, key, value;

    desktopSss.set.and.callFake(function(k, v, cb){
      key = k;
      value = v;
      cb(null);
    });

    sss.set('ab123', 'The value 2.', function(e) {
      error = e;
    });

    expect(error).toBeFalsy();
    expect(key).toBe('ab123');
    expect(value).toBe('The value 2.')
  });

});
  