'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;
  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  var ongoingProcess = {};

  var processNames = {
    'broadcastingTx': gettext('Broadcasting transaction'),
    'buyingBch': gettext('Buying Bitcoin Cash...'),
    'buyingBitcoin': gettext('Buying Bitcoin...'),
    'addingCreditCard': gettext('Contacting the card issuer...'),
    'buyingGiftCard': gettext('Buying Gift Card...'),
    'calculatingFee': gettext('Calculating fee'),
    'cancelingGiftCard': 'Canceling Gift Card...',
    'connectingCoinbase': gettext('Connecting to Coinbase...'),
    'connectingGlidera': gettext('Connecting to Glidera...'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingSideshift': gettext('Connecting to SideShift AI...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'creatingCustomerId': gettext('Creating customer ID...'),
    'creatingGiftCard': 'Creating Gift Card...',
    'creatingTx': gettext('Creating transaction'),
    'creatingWallet': gettext('Creating Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'duplicatingWallet': gettext('Duplicating wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet information...'),
    'fetchingBitPayAccount': gettext('Fetching BitPay Account...'),    
    'fetchingPayPro': gettext('Fetching payment information'),
    'generatingCSV': gettext('Generating .csv file...'),
    'gettingFeeLevels': gettext('Getting fee levels...'),
    'gettingKycIdentity': gettext('Getting Verification Status...'),
    'importingWallet': gettext('Importing Wallet...'),
    'joiningWallet': gettext('Joining Wallet...'),
    'loadingProfile': gettext('Loading Profile...'),
    'loadingTxInfo': gettext('Loading transaction info...'),
    'recreating': gettext('Recreating Wallet...'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'retrievingInputs': gettext('Retrieving inputs information'),
    'scanning': gettext('Scanning Wallet funds...'),
    'sellingBitcoin': gettext('Selling Bitcoin...'),
    'sending2faCode': gettext('Sending 2FA code...'),
    'sendingByEmail': gettext('Preparing addresses...'),
    'sendingFeedback': gettext('Sending feedback...'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'submitingKycInfo': gettext('Sending Info...'),
    'fetchingKycStatus': gettext('Checking Status...'),
    'topup': gettext('Top up in progress...'),
    'updatingGiftCard': 'Updating Gift Card...',
    'updatingGiftCards': 'Updating Gift Cards...',
    'validatingWords': gettext('Validating recovery phrase...'),
    'verifyingEmail': gettext('Verifying your email...'),
    'generatingNewAddress': gettext('Generating new address...')
  };

  root.clear = function() {
    ongoingProcess = {};
    $ionicLoading.hide();
  };

  root.get = function(processName) {
    return ongoingProcess[processName];
  };

  root.set = function(processName, isOn, customHandler) {
    $log.debug('ongoingProcess', processName, isOn);
    root[processName] = isOn;
    ongoingProcess[processName] = isOn;

    var name;
    root.any = lodash.any(ongoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    root.onGoingProcessName = name;

    var showName = $filter('translate')(processNames[name] || name);
    
    if (root.onGoingProcessName) {
      var tmpl;
      if (isWindowsPhoneApp) tmpl = '<div>' + showName + '</div>';
      else tmpl = '<div class="item-icon-left">' + showName + '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner></div>';
      $ionicLoading.show({
        template: tmpl,
      }).finally(function () {
        _executeHandler();
      });
    } else {
      $ionicLoading.hide().finally(function () {
        _executeHandler();
      });
    }

    function _executeHandler() {
      if (typeof customHandler === 'function') {
        customHandler(processName, showName, isOn);
      } 
    }

  };

  return root;
});
