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
      //$provide.value('$log', log); // Handy for debugging test failures
      $provide.value('platformInfo', platformInfoStub);
    });

    inject(function($injector){
      sss = $injector.get('secureStorageService');
    });

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

});
  