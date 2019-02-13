'use strict';

(function () {

angular
  .module('bitcoincom.controllers')
  .controller('buyBitcoinAddCardFormController', addCardFormController);

  function addCardFormController(
    gettextCatalog
    , $log
    , moonPayConfig
    , moonPayService
    , popupService
    , ongoingProcess
    ,$scope
  ) {
    var vm = this;
    var form = null;

    // Functions
    vm.didPushBack = didPushBack;
    vm.didPushAdd = didPushAdd;

    vm.handleSecurityChange = handleSecurityChange;

    var addCardInfoText = gettextCatalog.getString("Type all your card details below.");
    var contactingText = gettextCatalog.getString("Contacting the card issuer.");

    function didPushAdd() {
      // Check if the card is valid
      if (!isValidForm()) {
        var title = gettextCatalog.getString("Unable to Add Card");
        var message = getFormErrors();
        popupService.showAlert(title, message);
        return;
      }

      vm.subtext = contactingText;
      ongoingProcess.set('addingCreditCard', true);
      moonPayService.getConfigWithToken().then(function onConfig(config) {
        form.submit('/v2/cards',
        config,
        function onFormSubmitSuccess(status, response) {
          ongoingProcess.set('addingCreditCard', false);
          console.log('status:', status);
          if (status === 200 || status === 201) {
            moonPayService.addCard(response);
            $scope.$ionicGoBack();
          } else {
            var responseMessage = response.message ? response.message : '';
            $log.error('Status when submitting credit card form: ' + status + ". " + responseMessage);
            var title = gettextCatalog.getString("Unable to Add Card");
            var message = gettextCatalog.getString("Error. Status code: {{status}}", { status: status.toString()});
            if (responseMessage) {
              message += '. ' + responseMessage;
            }
            popupService.showAlert(title, message);
          }
        },
        function onFormSubmitFail(errors) {
          ongoingProcess.set('addingCreditCard', false);
          var title = gettextCatalog.getString("Unable to Add Card");
          var message = gettextCatalog.getString("Network error");
          popupService.showAlert(title, message);
        });
      });
    }

    function didPushBack() {
      $scope.$ionicGoBack();
    }

    function handleSecurityChange() {
      if(!vm.card.cvc) {
        return;
      }
      // Clean up string
      vm.card.cvc = vm.card.cvc.replace(/\D/g,'');
    }

    function isValidCardNumber() {
      return form.state.number.isValid;
    }

    function isValidSecurityCode() {
      return form.state.cvc.isValid;
    }

    function isValidExpiration() {
      return form.state.expiryDate.isValid;
    }

    function isValidForm() {
      return isValidCardNumber() &&
        isValidSecurityCode() &&
        isValidExpiration();
    }

    function getFormErrors() {
      if(!isValidCardNumber()) {
        return gettextCatalog.getString("Card number is invalid. Check your card and try again.");
      }
      if(!isValidExpiration()) {
        return gettextCatalog.getString("Expiration date is invalid. Check your card and try again.");
      }
      if(!isValidSecurityCode()) {
        return gettextCatalog.getString("CVC number is invalid. The 3 digits in the back part of your card. 4 digits if you are using AMEX.");
      }
      return false;
    }

    function _initVariables() {
      vm.subtext = addCardInfoText;
      _initForm();
    }

    function _initForm() {
      if(form){
        return;
      }

      form = VGSCollect.create(
        moonPayConfig.vgsIdentifier,
        function(state) {
        }
      );

      form.field('#cc-number', {
        type: 'card-number',
        name: 'number',
        successColor: '#000000',
        errorColor: '#FF0000',
        fontFamily: 'system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        fontSize: '16px',
        lineHeight: '16px',
        placeholder: '4111 1111 1111 1111',
        validations: ['required', 'validCardNumber'],
      });

      form.field('#cc-expiration', {
        type: 'card-expiration-date',
        name: 'expiryDate',
        successColor: '#000000',
        errorColor: '#FF0000',
        fontFamily: 'system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        fontSize: '16px',
        lineHeight: '16px',
        placeholder: '01 / 2022',
        validations: ['required', 'validCardExpirationDate'],
      });
      
      form.field('#cc-cvc', {
        type: 'card-security-code',
        name: 'cvc',
        successColor: '#000000',
        errorColor: '#FF0000',
        fontFamily: 'system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        fontSize: '16px',
        lineHeight: '16px',
        placeholder: '344',
        validations: ['required', 'validCardSecurityCode'],
      });
    }

    $scope.$on('$ionicView.beforeEnter', _onBeforeEnter);

    function _onBeforeEnter(event, data) {
      _initVariables();
    }
  }
})();
