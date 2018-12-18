describe('walletHistoryService', function(){
  var history = [];
  var historyStringFull;
  var storageServiceMock;
  var txFormatServiceMock;
  var walletMock;
  var walletHistoryService;

  
  beforeEach(function(){
    module('ngLodash');
    module('bitcoincom.services');
    
    storageServiceMock = jasmine.createSpyObj(['getTxHistory', 'removeTxHistory', 'setTxHistory']);
    txFormatServiceMock = jasmine.createSpyObj(['processTx']);
    txFormatServiceMock.processTx.and.callFake(function(coin, tx){
      return tx;
    });
    walletMock = jasmine.createSpyObj(['getTxHistory']);
    
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

  it('getCachedHistory error from storage', function() {
    var returnedErr;
    var returnedHistory;
    var walletIdForStorageGet = '';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;

      cb(new Error('Something went wrong.'), null);
    });

    walletHistoryService.getCachedTxHistory('wallet12345', function(err, txHistory){
      returnedErr = err;
      returnedHistory = txHistory;
    });
    
    expect(walletIdForStorageGet).toBe('wallet12345');
    expect(returnedErr.message).toBe('Something went wrong.');
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

  it('updateLocalTxHistoryByPage, 2 in cache, getEarlier, keep cache, same 2 returned, so all transactions received.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedAllFetched;
    var returnedErr;
    var returnedHistory;
    var walletIdForStorageGet;
    walletMock.id = 'wallet456';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;

      cb(null, JSON.stringify(history.slice(0, 2)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(0, 2));
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, false, false, function(err, txs, allFetched){
      returnedErr = err;
      returnedHistory = txs;
      returnedAllFetched = allFetched;
    });

    expect(walletIdForStorageGet).toBe('wallet456');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(2);
    expect(returnedAllFetched).toBe(true);
    expect(storageServiceMock.setTxHistory.calls.any()).toBe(false);
  });

  it('updateLocalTxHistoryByPage, getEarlier, keep cache, sufficient overlap so saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedErr;
    var returnedHistory;
    var returnedAllFetched;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet67890';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;

      cb(null, JSON.stringify(history.slice(0, 40)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(fetchSkip, fetchSkip + fetchLimit));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, false, false, function(err, txs, allFetched){
      returnedErr = err;
      returnedHistory = txs;
      returnedAllFetched = allFetched;
    });

    expect(walletIdForStorageGet).toBe('wallet67890');
    expect(walletIdForStorageSet).toBe('wallet67890');
    expect(fetchSkip).toBe(30);
    expect(fetchLimit).toBe(50);
    expect(savedTxs.length).toBe(80);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(80);
    expect(returnedAllFetched).toBe(false);
  });

  it('updateLocalTxHistoryByPage, cache empty, getLatest, do not flush cache, one new so saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, "[]");
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(0, 1));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(savedTxs.length).toBe(1);
    expect(walletIdForStorageSet).toBe('wallet789');
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(1);
  });

  it('updateLocalTxHistoryByPage, cache empty, getLatest, do not flush cache, some new so saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, "[]");
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(0, 10));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(savedTxs.length).toBe(10);
    expect(walletIdForStorageSet).toBe('wallet789');
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(10);
  });

  it('updateLocalTxHistoryByPage, some cachedTx, getLatest, do not flush cache, nothing new so nothing added.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var walletIdForStorageGet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, JSON.stringify(history.slice(0, 40)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, []);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(40);
    expect(storageServiceMock.setTxHistory.calls.any()).toBe(false);
  });

  it('updateLocalTxHistoryByPage, some cachedTx, getLatest, do not flush cache, confirmations increased, saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, JSON.stringify(history.slice(2, 52)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      var historyWithHigherConfirmations = [];
      for (var i = 0; i < 50; i++) {
        historyWithHigherConfirmations.push({
          confirmations: i >= 6 ? history[i].confirmations : history[i].confirmations + 1,
          time: history[i].time,
          txid: history[i].txid
        });
      }

      cb(null, historyWithHigherConfirmations.slice(fetchSkip, fetchSkip + fetchLimit));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(walletIdForStorageSet).toBe('wallet789');
    expect(savedTxs.length).toBe(52);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(52);
    expect(returnedHistory[2].confirmations).toBe(3);
    
  });

  it('updateLocalTxHistoryByPage, some cachedTx, getLatest, do not flush cache, some new with insufficient overlap, so only new saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, JSON.stringify(history.slice(48, 78)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(fetchSkip, fetchSkip + fetchLimit));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(walletIdForStorageSet).toBe('wallet789');
    expect(savedTxs.length).toBe(50);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(50);
    
  });

  it('updateLocalTxHistoryByPage, some cachedTx, getLatest, do not flush cache, some new with sufficient overlap so all saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageGet;
    var walletIdForStorageSet;
    walletMock.id = 'wallet789';

    storageServiceMock.getTxHistory.and.callFake(function(walletId, cb){
      walletIdForStorageGet = walletId;
      cb(null, JSON.stringify(history.slice(42, 72)));
    });

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(fetchSkip, fetchSkip + fetchLimit));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, false, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageGet).toBe('wallet789');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(walletIdForStorageSet).toBe('wallet789');
    expect(savedTxs.length).toBe(72);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(72);
    
  });

  it('updateLocalTxHistoryByPage, getLatest, flush cache, some new so saved.', function(){
    var fetchLimit;
    var fetchSkip;
    var returnedHistory;
    var savedTxs;
    var walletIdForStorageSet;
    walletMock.id = 'wallet7890';

    walletMock.getTxHistory.and.callFake(function(opts, cb){
      fetchSkip = opts.skip;
      fetchLimit = opts.limit;

      cb(null, history.slice(0, fetchLimit));
    });

    storageServiceMock.setTxHistory.and.callFake(function(txs, walletId, cb){
      savedTxs = txs;
      walletIdForStorageSet = walletId;
      cb(null);
    });

    walletHistoryService.updateLocalTxHistoryByPage(walletMock, true, true, function(err, txs){
      returnedErr = err;
      returnedHistory = txs;
    });

    expect(walletIdForStorageSet).toBe('wallet7890');
    expect(fetchSkip).toBe(0);
    expect(fetchLimit).toBe(50);
    expect(savedTxs.length).toBe(50);
    expect(returnedErr).toBeNull();
    expect(returnedHistory.length).toBe(50);
    expect(storageServiceMock.getTxHistory.calls.any()).toBe(false);
  });

});