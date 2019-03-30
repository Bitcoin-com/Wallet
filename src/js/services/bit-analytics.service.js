'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitAnalyticsService', bitAnalyticsService);
    
  function bitAnalyticsService(platformInfo) {
    var service = {
      init: init
      , postEvent: postEvent
      , setUserAttributes: setUserAttributes
      , getVariablesFromChannel: getVariablesFromChannel
    };

    var defaultChannels = ['ga'];
    if (platformInfo.isCordova) {
      defaultChannels = ['firebase'];
    }

    return service;

    function init() {
      // Shop screen
      var shopScreenTapOnFeaturedBusiness = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'shop_screen_tap_on_featured_business', 
        class: 'track_shop_screen_tap_on_featured_business',
        params: ['id'], 
        channels: defaultChannels.concat(['leanplum'])
      });
      window.BitAnalytics.ActionHandlers.trackAction(shopScreenTapOnFeaturedBusiness);
      console.log('bitAnalyticsService set up.');

      var shopScreenTapOnLearnMore = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'shop_screen_tap_on_learn_more',
        class: 'track_shop_screen_tap_on_learn_more',
        channels: defaultChannels.concat(['leanplum'])
      });
      window.BitAnalytics.ActionHandlers.trackAction(shopScreenTapOnLearnMore);

      var shopScreenTapOnStandardBusiness = new window.BitAnalytics.ActionFactory.createAction('click', {
        name: 'shop_screen_tap_on_standard_business', 
        class: 'track_shop_screen_tap_on_standard_business',
        params: ['id'], 
        channels: defaultChannels.concat(['leanplum'])
      });
      window.BitAnalytics.ActionHandlers.trackAction(shopScreenTapOnStandardBusiness);
    }


    /**
     * Sends an event to analytics channels.
     * @param {string} name - The name of the event. 
     * @param {Object[]} params - Parameters to send with the event.
     *   [0] - shared parameters for all channels.
     *   [1] - parameters for the default channel.
     *   Subsequent objects are sent with the other channels, in the corresponding order.
     * @param {string[]} additionalChannels - Names of more channels to send the event to. 
     */
    function postEvent(name, params, additionalChannels) {
      var allChannels = defaultChannels.concat(additionalChannels);

      var log = new window.BitAnalytics.LogEvent(name, params, allChannels);
      window.BitAnalytics.LogEventHandlers.postEvent(log);
    }

    function setUserAttributes(attributes) {
      window.BitAnalytics.LogEventHandlers.setUserAttributes(attributes);
    }

    function getVariablesFromChannel(channelName) {
      return window.BitAnalytics.LogEventHandlers.getVariablesFromChannel(channelName);
    }

  }

})();