


var argscheck = require('cordova/argscheck');
var channel = require('cordova/channel');
var utils = require('cordova/utils');
var exec = require('cordova/exec');
var cordova = require('cordova');
/*
channel.createSticky('onCordovaInfoReady');
// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');
*/

function QRReader() {
    this.testString = 'hello1';
    /*
    this.available = false;
    this.platform = null;
    this.version = null;
    this.uuid = null;
    this.cordova = null;
    this.model = null;
    this.manufacturer = null;
    this.isVirtual = null;
    this.serial = null;

    var me = this;

    channel.onCordovaReady.subscribe(function () {
        me.getInfo(function (info) {
            // ignoring info.cordova returning from native, we should use value from cordova.version defined in cordova.js
            // TODO: CB-5105 native implementations should not return info.cordova
            var buildLabel = cordova.version;
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.uuid = info.uuid;
            me.cordova = buildLabel;
            me.model = info.model;
            me.isVirtual = info.isVirtual;
            me.manufacturer = info.manufacturer || 'unknown';
            me.serial = info.serial || 'unknown';
            channel.onCordovaInfoReady.fire();
        }, function (e) {
            me.available = false;
            utils.alert('[ERROR] Error initializing Cordova: ' + e);
        });
    });
    */
}


/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */

QRReader.prototype.openSettings = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'QRReader.openSettings', arguments);
    exec(successCallback, errorCallback, 'QRReader', 'openSettings', []);
};

QRReader.prototype.checkPermission = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'QRReader.checkPermission', arguments);
    exec(successCallback, errorCallback, 'QRReader', 'checkPermission', []);
};

QRReader.prototype.startReading = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'QRReader.startReading', arguments);
    exec(successCallback, errorCallback, 'QRReader', 'startReading', []);
};

QRReader.prototype.stopReading = function (successCallback, errorCallback) {
    argscheck.checkArgs('fF', 'QRReader.stopReading', arguments);
    exec(successCallback, errorCallback, 'QRReader', 'stopReading', []);
};

module.exports = new QRReader();



