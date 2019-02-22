cordova.define("cordova-plugin-qrreader.qrreader", function(require, exports, module) {



var argscheck = require('cordova/argscheck');
var channel = require('cordova/channel');
var utils = require('cordova/utils');
var exec = require('cordova/exec');
var cordova = require('cordova');

function QRReader() {}


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




});
