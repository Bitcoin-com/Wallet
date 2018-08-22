describe('rateService', function() {
  var $httpBackend, rateService, requestHandler;

  beforeEach(function() {
    module('ngLodash');
    module('copayApp.services');

    inject(function($injector){
      $httpBackend = $injector.get('$httpBackend');

      requestHandler = $httpBackend.when('GET', 'https://www.bitcoin.com/special/rates.json')
                        .respond([
                            {
                                "code": "BTC",
                                "name": "Bitcoin",
                                "rate": 1
                            },
                            {
                                "code": "BCH_BTC",
                                "name": "Bitcoin Cash",
                                "rate": 6.739397
                            },
                            {
                                "code": "USD",
                                "name": "US Dollar",
                                "rate": 7602.04
                            }
                        ]);
                
      rateService = $injector.get('rateService');
      
      $httpBackend.flush();
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('get rates', function() {

    $httpBackend.expectGET('https://www.bitcoin.com/special/rates.json');

    rateService.updateRates();

    $httpBackend.flush();

    var usdRate = rateService.getRate('USD');

    expect(usdRate).toEqual(7602.04);
  });
});