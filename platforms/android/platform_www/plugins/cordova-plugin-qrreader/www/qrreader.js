cordova.define("cordova-plugin-qrreader.qrreader", function(require, exports, module) {

var argscheck = require('cordova/argscheck');
var exec = require('cordova/exec');


function QRReader() {
    this.testString = 'hello1';
}

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
