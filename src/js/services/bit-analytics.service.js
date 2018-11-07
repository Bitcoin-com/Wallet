'use strict';

(function(){

  angular
    .module('bitcoincom.services')
    .factory('bitAnalyticsService', bitAnalyticsService);
    
  function bitAnalyticsService(platformInfo) {
    var service = {
      postEvent: postEvent
    };

    var defaultChannels = ['ga'];
    if (platformInfo.isCordova) {
      defaultChannels = ['firebase'];
    }

    return service;

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

  }

})();