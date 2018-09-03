describe('amountController', function(){
  var configCache,
    configService, 
    $controller,
    $ionicHistory, 
    $rootScope,
    platformInfo,
    profileService,
    rateService,
    sendFlowService,
    shapeshiftService,
    txFormatService,
    $stateParams;



  beforeEach(function(){
    module('ngLodash');
    module('copayApp.controllers');

    configCache = {
      wallet: {
        settings: {

        }
      }
    };
     

    configService = jasmine.createSpyObj(['getDefaults','getSync']);
    configService.getDefaults.and.returnValue({
      bitcoinCashAlias: 'bch',
      bitcoinAlias: 'btc'
    });
    configService.getSync.and.returnValue(configCache);

    $ionicHistory = jasmine.createSpyObj(['backView']);

    platformInfo = {
      isChromeApp: false,
      isAndroid: false,
      isIos: true
    };

    profileService = jasmine.createSpyObj(['getWallet', 'getWallets']);
    
    rateService = jasmine.createSpyObj(['fromFiat', 'whenAvailable']);
    sendFlowService = jasmine.createSpyObj(['getStateClone']);
    shapeshiftService = jasmine.createSpyObj(['shiftIt']);
    txFormatService = jasmine.createSpyObj(['formatAlternativeStr', 'formatAmountStr']);

    $stateParams = {};

    inject(function(_$controller_, _$rootScope_){
      // The injector unwraps the underscores (_) from around the parameter names when matching
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });



  });

  it('receives fromWalletId and toAddress.', function() {

    var backView = {
        stateName: 'ignoreme'
    };
    $ionicHistory.backView.and.returnValue(backView);
    
    var wallet = {

    };
    profileService.getWallet.and.returnValue(wallet);
    profileService.getWallets.and.returnValue([{}]);
    rateService.fromFiat.and.returnValue(12); // satoshis or coins?

    var $scope = $rootScope.$new();


    var amountController = $controller('amountController', { 
      configService: configService,
      gettextCatalog: {},
      $ionicHistory: $ionicHistory,
      $ionicModal: {},
      $ionicScrollDelegate: {},
      nodeWebkitService: {},
      ongoingProcess: {},
      platformInfo: platformInfo,
      profileService: profileService,
      popupService: {},
      rateService: rateService,
      $scope: $scope,
      sendFlowService: sendFlowService,
      shapeshiftService: shapeshiftService,
      $state: {},
      $stateParams: $stateParams,
      txFormatService: txFormatService,
      walletService: {}
    });

    var sendFlowState = {
      fromWalletId: 'fd56c1e7-e3ac-4fd9-8afc-27b9c1b3718b',
      toAddress: 'qrup46avn8t466xxwlzs4qelht7cnwvesv2e29wf7s'
    };

    sendFlowService.getStateClone.and.returnValue(sendFlowState);

    $scope.$emit('$ionicView.beforeEnter', {});

    //expect($scope.fromWalletId).toBe('fd56c1e7-e3ac-4fd9-8afc-27b9c1b3718b');
    //expect($scope.toAddress).toBe('qrup46avn8t466xxwlzs4qelht7cnwvesv2e29wf7s');
  });

});