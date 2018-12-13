fdescribe('moonPayApiService', function() {
  var moonPayApiService;

  beforeEach(function() {
    module('bitcoincom.services');

    inject(function($injector){
      moonPayApiService = $injector.get('moonPayApiService');
    });
  });
  
  
  it('Create a customer successfully', function(done) {
    moonPayApiService.createCustomer('test@bitcoin.com').then(function(customer) {
      console.log(customer);
      expect(customer).toBeDefined();
      done();
    }, function (err) {
      console.log(err);
      done();
    });
  });
  
  it('Get a customer successfully', function(done) {
    moonPayApiService.getCustomer('6413de94-14ea-4926-b892-a8e2361a282d').then(function(customer) {
      console.log(customer);
      expect(customer).toBeDefined();
      done();
    }, function (err) {
      console.log(err);
      done();
    });
  });

});