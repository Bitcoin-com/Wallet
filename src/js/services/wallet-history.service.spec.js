fdescribe('walletHistoryService', function(){
  var history = [];
  var historyStringFull;
  var storageServiceMock;
  var txFormatServiceMock;
  var walletHistoryService;

  
  beforeEach(function(){
    module('ngLodash');
    module('bitcoincom.services');
    
    storageServiceMock = jasmine.createSpyObj(['getTxHistory', 'removeTxHistory', 'setTxHistory']);
    txFormatServiceMock = jasmine.createSpyObj(['processTx']);
    txFormatServiceMock.processTx.and.callFake(function(coin, tx){
      return tx;
    })
    
    module(function($provide) {
      $provide.value('storageService', storageServiceMock);
      $provide.value('txFormatService', txFormatServiceMock);
    });
    
    inject(function($injector){
      walletHistoryService = $injector.get('walletHistoryService');
    });

    for(var i = 0; i < 100; i++) {
      history.push({
        confirmations: i,
        time: (Date.now() / 1000) - i,
        txid: 'id' + i.toString()
      });
    }
    historyStringFull = JSON.stringify(history);    
  });
  
  it('getCachedHistory empty', function() {
    var returnedErr;
    var returnedHistory;
    var walletIdForStorageGet = '';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;

      cb(null, "[]");
    });

    walletHistoryService.getCachedTxHistory('wallet1234', function(err, txHistory){
      returnedErr = err;
      returnedHistory = txHistory;
    });
    
    expect(walletIdForStorageGet).toBe('wallet1234');
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(0);
  });

  it('getCachedHistory page full', function() {
    var returnedErr;
    var returnedHistory;
    var walletIdForStorageGet = '';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;

      cb(null, JSON.stringify(history.slice(0, 50)));
    });

    walletHistoryService.getCachedTxHistory('wallet1234', function(err, txHistory){
      returnedErr = err;
      returnedHistory = txHistory;
    });
    
    expect(walletIdForStorageGet).toBe('wallet1234');
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(50);
  });


});