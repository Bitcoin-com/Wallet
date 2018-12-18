// Karma configuration
// Generated on Tue Jun 05 2018 16:39:51 GMT+1200 (NZST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular/angular.js',

      'bitanalytics/bitanalytics.js',

      // From Gruntfile.js
      'bower_components/qrcode-generator/js/qrcode.js',
      'bower_components/qrcode-generator/js/qrcode_UTF8.js',
      'bower_components/moment/min/moment-with-locales.js',
      'bower_components/angular-moment/angular-moment.js',
      'bower_components/ng-lodash/build/ng-lodash.js',
      'bower_components/angular-qrcode/angular-qrcode.js',
      'bower_components/angular-gettext/dist/angular-gettext.js',
      'bower_components/ng-csv/build/ng-csv.js',
      'bower_components/ionic-toast/dist/ionic-toast.bundle.min.js',
      'bower_components/angular-clipboard/angular-clipboard.js',
      'bower_components/angular-md5/angular-md5.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/ngtouch/src/ngTouch.js',
      'angular-bitauth/angular-bitauth.js',
      'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js',  
          
      'bower_components/ionic/release/js/ionic.bundle.min.js',
      'bitcoin-cash-js/bitcoin-cash-js.js', 

      'src/js/**/*.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
