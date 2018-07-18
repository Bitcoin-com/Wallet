fdescribe('amountController', function(){
  var $controller, 
    $rootScope,
    platformInfo,
    $stateParams;



  beforeEach(function(){
    module('ngLodash');
    module('copayApp.controllers');

    platformInfo = {
      isChromeApp: false,
      isAndroid: false,
      isIos: true
    };

    $stateParams = {};

    inject(function(_$controller_, _$rootScope_){
      // The injector unwraps the underscores (_) from around the parameter names when matching
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });



  });

  it('something', function() {
    var $scope = $rootScope.$new();
    var amountController = $controller('amountController', { 
      configService: {},
      gettextCatalog: {},
      $ionicHistory: {},
      $ionicModal: {},
      $ionicScrollDelegate: {},
      nodeWebkitService: {},
      ongoingProcess: {},
      platformInfo: platformInfo,
      profileService: {},
      popupService: {},
      rateService: {},
      $scope: $scope,
      $state: {},
      $stateParams: $stateParams,
      txFormatService: {},
      walletService: {}
    });

    expect(true).toBe(true);
  });

});