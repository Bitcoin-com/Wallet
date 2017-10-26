'use strict';

angular.module('copayApp.controllers').controller('mercadoLibreCardsController',
  function($scope, $timeout, $ionicModal, $log, $ionicScrollDelegate, lodash, mercadoLibreService, platformInfo, externalLinkService, popupService, ongoingProcess) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var updateGiftCards = function(cb) {
      mercadoLibreService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          popupService.showAlert('Could not get gift cards', err);
          if (cb) return cb();
          else return;
        }
        $scope.giftCards = gcds;
        $timeout(function() {
          $scope.$digest();
          $ionicScrollDelegate.resize();
          if (cb) return cb();
        }, 100);
      });
    };

    $scope.updatePendingGiftCards = lodash.debounce(function() {
      updateGiftCards(function() {
        var index = 0;
        var gcds = $scope.giftCards;
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING') {
            $log.debug("Creating / Updating gift card");

            mercadoLibreService.createGiftCard(dataFromStorage, function(err, giftCard) {

              if (err) {
                popupService.showAlert('Error creating gift card', err);
                return;
              }

              if (giftCard.status != 'PENDING') {
                var newData = {};

                if (!giftCard.status) dataFromStorage.status = null; // Fix error from server

                var cardStatus = giftCard.cardStatus;
                if (cardStatus && (cardStatus != 'active' && cardStatus != 'inactive' && cardStatus != 'expired'))
                  giftCard.status = 'FAILURE';

                lodash.merge(newData, dataFromStorage, giftCard);

                mercadoLibreService.savePendingGiftCard(newData, null, function(err) {
                  $log.debug("Saving new gift card");
                  updateGiftCards();
                });
              }
            });
          }
        });
      });

    }, 1000, {
      'leading': true
    });

    $scope.openCardModal = function(card) {
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/mercadolibre-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.mercadoLibreCardDetailsModal = modal;
        $scope.mercadoLibreCardDetailsModal.show();
      });

      $scope.$on('modal.hidden', function() {
        $scope.updatePendingGiftCards();
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.invoiceId = data.stateParams.invoiceId;
      updateGiftCards(function() {
        if ($scope.invoiceId) {
          var card = lodash.find($scope.giftCards, {
            invoiceId: $scope.invoiceId
          });
          if (lodash.isEmpty(card)) {
            popupService.showAlert(null, 'Card not found');
            return;
          }
          $scope.openCardModal(card);
        }
      });
    });

    $scope.$on("$ionicView.afterEnter", function(event, data) {
      $scope.updatePendingGiftCards();
    });
  });
