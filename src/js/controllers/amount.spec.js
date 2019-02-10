describe('amountController', function(){
  var configCache,
    configService,
    gettextCatalog,
    $controller,
    $ionicHistory, 
    $rootScope,
    ongoingProcess,
    platformInfo,
    popupService,
    profileService,
    rateService,
    sendFlowService,
    sideshiftService,
    txFormatService,
    $scope,
    $state,
    $stateParams;



  beforeEach(function(){
    module('ngLodash');
    module('copayApp.controllers');

    configCache = {
      wallet: {
        settings: {
          unitToSatoshi: 100000000
        }
      }
    };
     

    configService = jasmine.createSpyObj(['getDefaults','getSync']);
    configService.getDefaults.and.returnValue({
      bitcoinCashAlias: 'bch',
      bitcoinAlias: 'btc'
    });
    configService.getSync.and.returnValue(configCache);

    gettextCatalog = jasmine.createSpyObj(['getString']);
    gettextCatalog.getString.and.callFake(function(str){ return str; });
    $ionicHistory = jasmine.createSpyObj(['backView']);

    ongoingProcess = jasmine.createSpyObj(['set']);

    platformInfo = {
      isChromeApp: false,
      isAndroid: false,
      isIos: true
    };
    popupService = jasmine.createSpyObj(['showAlert']);
    profileService = jasmine.createSpyObj(['getWallet', 'getWallets']);
    
    rateService = jasmine.createSpyObj(['fromFiat', 'listAlternatives', 'updateRates', 'whenAvailable']);
    sendFlowService = jasmine.createSpyObj(['getStateClone', 'pushState']);
    sideshiftService = jasmine.createSpyObj(['getMarketData']);
    txFormatService = jasmine.createSpyObj(['formatAlternativeStr', 'formatAmountStr']);

    txFormatService.formatAlternativeStr.and.callFake(function(coin, satoshis, cb) {
      if (typeof satoshis !== "number") {
        throw "satoshis in formatAlternativeStr() is not a number."
      }
      var units = satoshis / 100000000;
      var formatted = (units * 10000).toFixed(2) + ' USD';
      cb(formatted);
    });

    txFormatService.formatAmountStr.and.callFake(function(coin, satoshis) {
      if (typeof satoshis !== "number") {
        throw "satoshis in formatAmountStr() is not a number."
      }
      return (satoshis * 100000000).toFixed(8) + ' ' + (coin || 'bch').toUpperCase();
    });

    $state = jasmine.createSpyObj(['transitionTo']);
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
      status: {
        isValid: true,
        spendableAmount: 123456
      }
    };
    profileService.getWallet.and.returnValue(wallet);
    profileService.getWallets.and.returnValue([{}]);
    rateService.fromFiat.and.returnValue(12); // satoshis or coins?

    var $scope = $rootScope.$new();


    var amountController = $controller('amountController', { 
      configService: configService,
      gettextCatalog: gettextCatalog,
      $ionicHistory: $ionicHistory,
      $ionicModal: {},
      $ionicScrollDelegate: {},
      nodeWebkitService: {},
      ongoingProcess: ongoingProcess,
      platformInfo: platformInfo,
      profileService: profileService,
      popupService: popupService,
      rateService: rateService,
      $scope: $scope,
      sendFlowService: sendFlowService,
      sideshiftService: sideshiftService,
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

  

  describe('Sideshift', function() {
    var walletFrom;
    var walletTo;

    beforeEach(function(){
      walletFrom = {};
      walletTo = {};

      profileService.getWallet.and.callFake(function(walletId){
        if (walletId === '4cd7673e-7320-4dfa-86e5-d4edb51d460a') {
          return walletFrom;
        } else if (walletId === 'bf00af8f-0788-4b57-b30a-0390747407e9') {
          return walletTo;
        } else {
          return null;
        }
      });

      rateService.listAlternatives.and.returnValue([
        {name: "Australian Dollar", isoCode: "AUD"},
        {name: "United States Dollar", isoCode: "USD"}
      ]);

    });

    it ('with available balance below limit, shows sendMax for triggering alert', function() {

      walletFrom.coin = 'btc';
      walletFrom.status = {
        isValid: true,
        spendableAmount: 789
      };
      walletTo.coin = 'bch';
      
      profileService.getWallets.and.returnValue([{}]);
      rateService.fromFiat.and.returnValue(12); 

      var $scope = $rootScope.$new();

      var amountController = $controller('amountController', { 
        configService: configService,
        gettextCatalog: gettextCatalog,
        $ionicHistory: $ionicHistory,
        $ionicModal: {},
        $ionicScrollDelegate: {},
        nodeWebkitService: {},
        ongoingProcess: ongoingProcess,
        platformInfo: platformInfo,
        profileService: profileService,
        popupService: popupService,
        rateService: rateService,
        $scope: $scope,
        sendFlowService: sendFlowService,
        sideshiftService: sideshiftService,
        $state: $state,
        $stateParams: $stateParams,
        txFormatService: txFormatService,
        walletService: {}
      });

      rateService.whenAvailable.and.callFake(function(cb){
        cb();
      });

      var sendFlowState = {
        amount: '', 
        displayAddress: null, 
        fromWalletId: '4cd7673e-7320-4dfa-86e5-d4edb51d460a', 
        sendMax: false, 
        thirdParty: {
          id: 'sideshift',
          data: {},
        },
        toAddress: '',
        toWalletId: 'bf00af8f-0788-4b57-b30a-0390747407e9'
      };

      sendFlowService.getStateClone.and.returnValue(sendFlowState);

      var reqCoinIn = '';
      var reqCoinOut = '';
      sideshiftService.getMarketData.and.callFake(function(coinIn, coinOut, cb){
        reqCoinIn = coinIn;
        reqCoinOut = coinOut;
        cb({
          maxLimit: '0.6846239',
          minimum: '0.00013692'
        });
      });

      $scope.$emit('$ionicView.beforeEnter', {});

      expect(rateService.updateRates.calls.any()).toEqual(true);

      expect(reqCoinIn).toBe('btc');
      expect(reqCoinOut).toBe('bch');

      expect(amountController.maxAmount).toBe(0.68462390);
      expect(amountController.minAmount).toBe(0.00013692);

      expect(amountController.showSendMaxButton).toEqual(true);
      expect(amountController.showSendLimitMaxButton).toEqual(false);

      expect(amountController.sendableFunds).toEqual('0.08 USD');

      // Now hit the Send Max button    
      amountController.sendMax();

      expect(popupService.showAlert.calls.argsFor(0)[0]).toEqual('Insufficient funds');
      expect(popupService.showAlert.calls.argsFor(0)[1]).toEqual('Amount below minimum allowed');
      expect(sendFlowService.pushState.calls.any()).toEqual(false);
      expect($state.transitionTo.calls.any()).toEqual(false);
    });

    it ('with available balance between limits, uses sendMax', function() {

      walletFrom.coin = 'btc';
      walletFrom.status = {
        isValid: true,
        spendableAmount: 456789
      };
      walletTo.coin = 'bch';
      
      profileService.getWallets.and.returnValue([{}]);
      rateService.fromFiat.and.returnValue(12); 

      var $scope = $rootScope.$new();

      var amountController = $controller('amountController', { 
        configService: configService,
        gettextCatalog: {},
        $ionicHistory: $ionicHistory,
        $ionicModal: {},
        $ionicScrollDelegate: {},
        nodeWebkitService: {},
        ongoingProcess: ongoingProcess,
        platformInfo: platformInfo,
        profileService: profileService,
        popupService: {},
        rateService: rateService,
        $scope: $scope,
        sendFlowService: sendFlowService,
        sideshiftService: sideshiftService,
        $state: $state,
        $stateParams: $stateParams,
        txFormatService: txFormatService,
        walletService: {}
      });

      rateService.whenAvailable.and.callFake(function(cb){
        cb();
      });

      var sendFlowState = {
        amount: '', 
        displayAddress: null, 
        fromWalletId: '4cd7673e-7320-4dfa-86e5-d4edb51d460a', 
        sendMax: false, 
        thirdParty: {
          id: 'sideshift',
          data: {},
        },
        toAddress: '',
        toWalletId: 'bf00af8f-0788-4b57-b30a-0390747407e9'
      };

      sendFlowService.getStateClone.and.returnValue(sendFlowState);

      var reqCoinIn = '';
      var reqCoinOut = '';
      sideshiftService.getMarketData.and.callFake(function(coinIn, coinOut, cb){
        reqCoinIn = coinIn;
        reqCoinOut = coinOut;
        cb({
          maxLimit: '0.6846239',
          minimum: '0.00013692'
        });
      });

      $scope.$emit('$ionicView.beforeEnter', {});

      expect(rateService.updateRates.calls.any()).toEqual(true);

      expect(reqCoinIn).toBe('btc');
      expect(reqCoinOut).toBe('bch');

      expect(amountController.maxAmount).toBe(0.68462390);
      expect(amountController.minAmount).toBe(0.00013692);

      expect(amountController.showSendMaxButton).toEqual(true);
      expect(amountController.showSendLimitMaxButton).toEqual(false);

      // Now hit the Send Max button
      var pushedState = null;
      sendFlowService.pushState.and.callFake(function (sendFlowState){
        pushedState = sendFlowState;
      });
      
      amountController.sendMax();

      expect(pushedState.amount).toBeUndefined();
      expect(pushedState.fromWalletId).toEqual('4cd7673e-7320-4dfa-86e5-d4edb51d460a');
      expect(pushedState.sendMax).toEqual(true);
      expect(pushedState.toWalletId).toEqual('bf00af8f-0788-4b57-b30a-0390747407e9');
      
      expect(pushedState.thirdParty.id).toEqual('sideshift');
      expect(pushedState.thirdParty.data.maxAmount).toEqual(0.6846239);
      expect(pushedState.thirdParty.data.minAmount).toEqual(0.00013692);

      expect($state.transitionTo.calls.count()).toEqual(1);
      expect($state.transitionTo.calls.argsFor(0)[0]).toEqual('tabs.send.review');
    });

    it ('with available balance higher than max, uses send limit max instead of sendMax', function() {

      walletFrom.coin = 'btc';
      walletFrom.status = {
        isValid: true,
        spendableAmount: 123456789
      };
      walletTo.coin = 'bch';
      
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
        ongoingProcess: ongoingProcess,
        platformInfo: platformInfo,
        profileService: profileService,
        popupService: {},
        rateService: rateService,
        $scope: $scope,
        sendFlowService: sendFlowService,
        sideshiftService: sideshiftService,
        $state: $state,
        $stateParams: $stateParams,
        txFormatService: txFormatService,
        walletService: {}
      });

      rateService.whenAvailable.and.callFake(function(cb){
        cb();
      });

      var sendFlowState = {
        amount: '', 
        displayAddress: null, 
        fromWalletId: '4cd7673e-7320-4dfa-86e5-d4edb51d460a', 
        sendMax: false, 
        thirdParty: {
          id: 'sideshift',
          data: {},
        },
        toAddress: '',
        toWalletId: 'bf00af8f-0788-4b57-b30a-0390747407e9'
      };

      sendFlowService.getStateClone.and.returnValue(sendFlowState);

      var reqCoinIn = '';
      var reqCoinOut = '';
      sideshiftService.getMarketData.and.callFake(function(coinIn, coinOut, cb){
        reqCoinIn = coinIn;
        reqCoinOut = coinOut;
        cb({
          maxLimit: '0.6846239',
          minimum: '0.00013692'
        });
      });

      $scope.$emit('$ionicView.beforeEnter', {});

      expect(rateService.updateRates.calls.any()).toEqual(true);

      expect(reqCoinIn).toBe('btc');
      expect(reqCoinOut).toBe('bch');

      expect(amountController.maxAmount).toBe(0.6846239);
      expect(amountController.minAmount).toBe(0.00013692);

      expect(amountController.showSendMaxButton).toEqual(false);
      expect(amountController.showSendLimitMaxButton).toEqual(true);

      // Now hit the Send Max button
      var pushedState = null;
      sendFlowService.pushState.and.callFake(function (sendFlowState){
        pushedState = sendFlowState;
      });
      
      amountController.sendMax();

      expect(pushedState.amount).toEqual(68462390);
      expect(pushedState.fromWalletId).toEqual('4cd7673e-7320-4dfa-86e5-d4edb51d460a');
      expect(pushedState.sendMax).toEqual(false);
      expect(pushedState.toWalletId).toEqual('bf00af8f-0788-4b57-b30a-0390747407e9');
      
      expect(pushedState.thirdParty.id).toEqual('sideshift');
      expect(pushedState.thirdParty.data.maxAmount).toEqual(0.6846239);
      expect(pushedState.thirdParty.data.minAmount).toEqual(0.00013692);

      expect($state.transitionTo.calls.count()).toEqual(1);
      expect($state.transitionTo.calls.argsFor(0)[0]).toEqual('tabs.send.review');
    });
  });


  describe('Wallet transfer', function() {
    var walletFrom;
    var walletTo;

    beforeEach(function(){
      walletFrom = {};
      walletTo = {};

      profileService.getWallet.and.callFake(function(walletId){
        if (walletId === '4cd7673e-7320-4dfa-86e5-d4edb51d460a') {
          return walletFrom;
        } else if (walletId === 'bf00af8f-0788-4b57-b30a-0390747407e9') {
          return walletTo;
        } else {
          return null;
        }
      });

      rateService.listAlternatives.and.returnValue([
        {name: "Australian Dollar", isoCode: "AUD"},
        {name: "United States Dollar", isoCode: "USD"}
      ]);

    });

    it('wallet transfer send max.', function() {
    
      walletFrom.coin = 'btc';
      walletFrom.status = {
        isValid: true,
        spendableAmount: 123456789
      };
      
      profileService.getWallets.and.returnValue([{}]);
 
      var $scope = $rootScope.$new();
   
      var amountController = $controller('amountController', { 
        configService: configService,
        gettextCatalog: gettextCatalog,
        $ionicHistory: $ionicHistory,
        $ionicModal: {},
        $ionicScrollDelegate: {},
        nodeWebkitService: {},
        ongoingProcess: ongoingProcess,
        platformInfo: platformInfo,
        profileService: profileService,
        popupService: popupService,
        rateService: rateService,
        $scope: $scope,
        sendFlowService: sendFlowService,
        sideshiftService: sideshiftService,
        $state: $state,
        $stateParams: $stateParams,
        txFormatService: txFormatService,
        walletService: {}
      });
  
      var sendFlowState = {
        fromWalletId: '4cd7673e-7320-4dfa-86e5-d4edb51d460a',
        toWalletId: 'bf00af8f-0788-4b57-b30a-0390747407e9'
      };
  
      sendFlowService.getStateClone.and.returnValue(sendFlowState);
  
      $scope.$emit('$ionicView.beforeEnter', {});

      expect(amountController.showSendMaxButton).toEqual(true);
      expect(amountController.showSendLimitMaxButton).toEqual(false);

      expect(amountController.sendableFunds).toEqual('12345.68 USD');

      // Now hit the Send Max button
      var pushedState = null;
      sendFlowService.pushState.and.callFake(function (sendFlowState){
        pushedState = sendFlowState;
      });

      amountController.sendMax();
  
      expect(pushedState.amount).toBeUndefined();
      expect(pushedState.fromWalletId).toEqual('4cd7673e-7320-4dfa-86e5-d4edb51d460a');
      expect(pushedState.sendMax).toEqual(true);
      expect(pushedState.toWalletId).toEqual('bf00af8f-0788-4b57-b30a-0390747407e9');
      
      expect($state.transitionTo.calls.count()).toEqual(1);
      expect($state.transitionTo.calls.argsFor(0)[0]).toEqual('tabs.send.review');
    });


    // This situation was seen in real life
    it('wallet transfer with valid cached status only.', function() {
    
      walletFrom.coin = 'btc';
      walletFrom.status = {
        isValid: false,
      };
      walletFrom.cachedStatus = {
        isValid: true,
        spendableAmount: 5678
      };
      
      profileService.getWallets.and.returnValue([{}]);
 
      var $scope = $rootScope.$new();
   
      var amountController = $controller('amountController', { 
        configService: configService,
        gettextCatalog: gettextCatalog,
        $ionicHistory: $ionicHistory,
        $ionicModal: {},
        $ionicScrollDelegate: {},
        nodeWebkitService: {},
        ongoingProcess: ongoingProcess,
        platformInfo: platformInfo,
        profileService: profileService,
        popupService: popupService,
        rateService: rateService,
        $scope: $scope,
        sendFlowService: sendFlowService,
        sideshiftService: sideshiftService,
        $state: $state,
        $stateParams: $stateParams,
        txFormatService: txFormatService,
        walletService: {}
      });
  
      var sendFlowState = {
        fromWalletId: '4cd7673e-7320-4dfa-86e5-d4edb51d460a',
        toWalletId: 'bf00af8f-0788-4b57-b30a-0390747407e9'
      };
  
      sendFlowService.getStateClone.and.returnValue(sendFlowState);
  
      $scope.$emit('$ionicView.beforeEnter', {});

      expect(amountController.showSendMaxButton).toEqual(true);
      expect(amountController.showSendLimitMaxButton).toEqual(false);

      expect(amountController.sendableFunds).toEqual('0.57 USD');
    });

  });

});