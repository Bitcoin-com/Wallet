describe('txFormatService', function(){
  var configServiceMock,
    rateServiceMock,
    txFormatService;

  beforeEach(function(){
    module('ngLodash');
    module('bwcModule');
    module('copayApp.filters');
    module('copayApp.services');

    configServiceMock = {
      getSync: jasmine.createSpy()
    };

    rateServiceMock = {
      isAvailable: jasmine.createSpy(),
      toFiat: jasmine.createSpy()
    };

    module(function($provide) {
      $provide.value('configService', configServiceMock);
      $provide.value('rateService', rateServiceMock);
    });

    inject(function($injector){
      txFormatService = $injector.get('txFormatService');
    });

  });

  it('formatAlternativeStr 0.49 cents.', function() {
    
    configServiceMock.getSync.and.returnValue({
      wallet: {
        settings: {
          alternativeIsoCode: 'USD'
        }
      }
    });

    rateServiceMock.isAvailable.and.returnValue(true);
    rateServiceMock.toFiat.and.returnValue(0.00499);
    
    var formatted = txFormatService.formatAlternativeStr('bch', 123);

    expect(formatted).toBe('< 0.01 USD');
  });

  it('formatAlternativeStr 0.5 cents.', function() {

    configServiceMock.getSync.and.returnValue({
      wallet: {
        settings: {
          alternativeIsoCode: 'USD'
        }
      }
    });

    rateServiceMock.isAvailable.and.returnValue(true);
    rateServiceMock.toFiat.and.returnValue(0.005);
    
    var formatted = txFormatService.formatAlternativeStr('bch', 123);

    expect(formatted).toBe('0.01 USD');
  });

});