'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      appConfig: {
        command: 'node ./util/buildAppConfig.js'
      },
      android_studio: {
        command: ' open -a open -a /Applications/Android\\ Studio.app platforms/android',
      },
      build_android_debug: {
        command: 'cordova prepare android && cordova build android --debug',
      },
      build_android_release: {
        command: 'cordova prepare android && cordova build android --release',
      },
      build_ios_debug: {
        command: 'cordova prepare ios && cordova build ios --debug',
        options: {
          maxBuffer: 3200 * 1024
        }
      },
      build_ios_release: {
        command: 'cordova prepare ios && cordova build ios --release',
        options: {
          maxBuffer: 1600 * 1024
        }
      },
      chrome: {
        command: 'make -C chrome-app '
      },
      clean: {
        command: 'rm -Rf bower_components node_modules'
      },
      cordovaclean: {
        command: 'make -C cordova clean'
      },
      coveralls: {
        command: 'cat  coverage/report-lcov/lcov.info |./node_modules/coveralls/bin/coveralls.js'
      },
      create_dmg_dist: {
        command: 'sh webkitbuilds/create-dmg-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      create_others_dist: {
        command: 'sh webkitbuilds/create-others-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      create_pkg_dist: {
        command: 'sh webkitbuilds/create-pkg-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      externalServices: {
        command: 'node ./util/buildExternalServices.js'
      },
      get_nwjs_for_pkg: {
        command: 'if [ ! -d ./cache/0.19.5-pkg/osx64/nwjs.app ]; then cd ./cache; curl https://dl.nwjs.io/v0.19.5-mas-beta/nwjs-mas-v0.19.5-osx-x64.zip --output nwjs.zip; unzip nwjs.zip; mkdir -p ./0.19.5-pkg/osx64; cp -R ./nwjs-mas-v0.19.5-osx-x64/nwjs.app  ./0.19.5-pkg/osx64/; fi'
      },
      log_android: {
        command: 'adb logcat | grep chromium',
      },
      run_android: {
        command: 'cordova run android --device',
      },
      run_android_emulator: {
        command: 'cordova run android --emulator',
      },
      sign_android: {
        // When the build log outputs "Built the following apk(s):", it seems to need the filename to start with "android-release".
        // It looks like it simply lists all apk files starting with "android-release"
        command: 'rm -f platforms/android/build/outputs/apk/android-release-signed-*.apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../bitcoin-com-release-key.jks -signedjar platforms/android/build/outputs/apk/android-release-signed.apk  platforms/android/build/outputs/apk/android-release-unsigned.apk bitcoin-com && zipalign -v 4 platforms/android/build/outputs/apk/android-release-signed.apk platforms/android/build/outputs/apk/bitcoin-com-wallet-<%= pkg.fullVersion %>-android-signed-aligned.apk',
        stdin: true,
      },
      sign_desktop_dist: {
        command: 'sh webkitbuilds/sign-desktop-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>"'
      },
      wpinit: {
        command: 'make -C cordova wp-init',
      },
      wpcopy: {
        command: 'make -C cordova wp-copy',
      },
      xcode: {
        command: 'open platforms/ios/*.xcodeproj',
      } 
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      sass: {
        files: ['src/sass/**/**/*.scss'],
        tasks: ['sass']
      },
      main: {
        files: [
          'src/js/init.js',
          'src/js/app.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/routes.js',
          'src/js/services/*.js',
          'src/js/models/*.js',
          'src/js/controllers/**/*.js'
        ],
        tasks: ['concat:js']
      },
      gettext: {
        files: [
          'i18n/po/*.po',
          'i18n/po/*.pot'
        ],
        tasks: ['nggettext_compile','concat']
      },
    },
    sass: {
      dist: {
        options: {
          style: 'compact',
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['src/sass/main.scss'],
          dest: 'www/css/',
          ext: '.css'
        }]
      }
    },
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      angular: {
        src: [
          'src/shim/shim.js',
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
          'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js'
        ],
        dest: 'www/lib/angular-components.js'
      },
      bitcoinCashJs: {
        src: [
          'bitcoin-cash-js/bitcoin-cash-js.js'
        ],
        dest: 'www/lib/bitcoin-cash-js.js'
      },
      bitanalytics: {
        src: [
          'bitanalytics/bitanalytics.js'
        ],
        dest: 'www/lib/bitanalytics.js'
      },
      js: {
        src: [
          'src/js/app.js',
          'src/js/routes.js',
          'src/js/decorators/*.js',

          'src/js/directives/*.js',
          '!src/js/directives/*.spec.js',

          'src/js/filters/*.js',
          '!src/js/filters/*.spec.js',

          'src/js/models/*.js',
          '!src/js/models/*.spec.js',

          'src/js/services/*.js',
          '!src/js/services/*.spec.js',

          'src/js/controllers/**/*.js',
          '!src/js/controllers/**/*.spec.js',
          
          'src/js/translations.js',
          'src/js/appConfig.js',
          'src/js/externalServices.js',
          'src/js/init.js',
          'src/js/trezor-url.js',
          'bower_components/trezor-connect/connect.js',
          'node_modules/bezier-easing/dist/bezier-easing.min.js',
          'node_modules/cordova-plugin-qrscanner/dist/cordova-plugin-qrscanner-lib.min.js'
        ],
        dest: 'www/js/app.js'
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'www/js/app.js': ['www/js/app.js'],
          'www/lib/angular-components.js': ['www/lib/angular-components.js'],
          'www/lib/bitcoin-cash-js.js': ['www/lib/bitcoin-cash-js.js'],
          'www/lib/bitanalytics.js': ['www/lib/bitanalytics.js']
        }
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'i18n/po/template.pot': [
            'www/index.html',
            'www/views/**/*.html',
            'src/js/routes.js',
            'src/js/services/*.js',
            'src/js/controllers/**/*.js'
          ]
        }
      },
    },
    nggettext_compile: {
      all: {
        options: {
          module: 'copayApp'
        },
        files: {
          'src/js/translations.js': ['i18n/po/**/*.po']
        }
      },
    },
    copy: {
      ionic_fonts: {
        expand: true,
        flatten: true,
        src: 'bower_components/ionic/release/fonts/ionicons.*',
        dest: 'www/fonts/'
      },
      ionic_js: {
        expand: true,
        flatten: true,
        src: 'bower_components/ionic/release/js/ionic.bundle.min.js',
        dest: 'www/lib/'
      },
      linux: {
        files: [{
          expand: true,
          cwd: 'webkitbuilds/',
          src: ['.desktop', '../www/img/app/favicon.ico', '../resources/<%= pkg.name %>/linux/512x512.png'],
          dest: 'webkitbuilds/others/<%= pkg.title %>/linux64/',
          flatten: true,
          filter: 'isFile'
        }],
      }
    },
    nwjs: {
      others: {
        options: {
          appName: '<%= pkg.nameCaseNoSpace %>',
          platforms: ['win64', 'linux64'],
          buildDir: './webkitbuilds/others',
          version: '0.19.5',
          exeIco: './www/img/app/logo.ico'
        },
        src: ['./package.json', './www/**/*']
      },
      dmg: {
        options: {
          appName: '<%= pkg.nameCaseNoSpace %>',
          platforms: ['osx64'],
          buildDir: './webkitbuilds/dmg',
          version: '0.19.5',
          macIcns: './resources/<%= pkg.name %>/mac/app.icns',
          exeIco: './www/img/app/logo.ico',
          macPlist: {
            'CFBundleDisplayName': '<%= pkg.title %>',
            'CFBundleShortVersionString': '<%= pkg.version %>',
            'CFBundleVersion': '<%= pkg.androidVersion %>',
            'LSApplicationCategoryType': 'public.app-category.finance',
            'CFBundleURLTypes': [
              {
                'CFBundleURLName': 'URI Handler',
                'CFBundleURLSchemes': ['bitcoin', '<%= pkg.name %>']
              }
            ]
          }
        },
        src: ['./package.json', './www/**/*']
      },
      pkg: {
        options: {
          appName: '<%= pkg.title %>',
          platforms: ['osx64'],
          buildDir: './webkitbuilds/pkg',
          version: '0.19.4',
          macIcns: './resources/<%= pkg.name %>/mac/pkg/app.icns',
          exeIco: './www/img/app/logo.ico',
          macPlist: {
            'CFBundleIdentifier': 'com.bitcoin.mwallet.mac',
            'CFBundleDisplayName': '<%= pkg.title %>',
            'CFBundleShortVersionString': '<%= pkg.version %>',
            'CFBundleVersion': '<%= pkg.androidVersion %>',
            'LSApplicationCategoryType': 'public.app-category.finance',
            'CFBundleURLTypes': [
              {
                'CFBundleURLName': 'URI Handler',
                'CFBundleURLSchemes': ['bitcoin', '<%= pkg.name %>']
              }
            ]
          }
        },
        src: ['./package.json', './www/**/*']
      },
    },
    compress: {
      linux: {
        options: {
          archive: './webkitbuilds/others/<%= pkg.title %>-linux.zip'
        },
        expand: true,
        cwd: './webkitbuilds/others/<%= pkg.title %>/linux64/',
        src: ['**/*'],
        dest: '<%= pkg.title %>-linux/'
      }
    },
    browserify: {
      dist: {
        files: {
          'angular-bitcore-wallet-client/angular-bitcore-wallet-client.js': ['angular-bitcore-wallet-client/index.js'],
          'angular-bitauth/angular-bitauth.js': ['angular-bitauth/index.js'],
          'bitcoin-cash-js/bitcoin-cash-js.js': ['bitcoin-cash-js/index.js']
        },
      }
    }
  });

  grunt.registerTask('default', ['nggettext_compile', 'exec:appConfig', 'exec:externalServices', 'browserify', 'sass', 'concat', 'copy:ionic_fonts', 'copy:ionic_js']);
  grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('chrome', ['default','exec:chrome']);
  grunt.registerTask('wp', ['prod', 'exec:wp']);
  grunt.registerTask('wp-copy', ['default', 'exec:wpcopy']);
  grunt.registerTask('wp-init', ['default', 'exec:wpinit']);
  grunt.registerTask('cordovaclean', ['exec:cordovaclean']);

  // Build all
  grunt.registerTask('build-app-release', ['build-mobile-release', 'build-desktop-release']);

  /**
   * Mobile app
   */

  // Build mobile app
  grunt.registerTask('build-mobile-release', ['build-ios-release', 'build-android-release']);

  // Build ios
  grunt.registerTask('start-ios', ['default', 'exec:build_ios_debug', 'exec:xcode']);
  grunt.registerTask('build-ios-debug', ['default', 'exec:build_ios_debug']);
  grunt.registerTask('build-ios-release', ['prod', 'exec:build_ios_release']);

  // Build android
  grunt.registerTask('start-android', ['build-android-debug', 'exec:run_android']);
  grunt.registerTask('build-android-debug', ['default', 'exec:build_android_debug']);
  grunt.registerTask('start-android-emulator', ['build-android-debug', 'exec:run_android_emulator']);
  grunt.registerTask('build-android-release', ['prod', 'exec:build_android_release', 'sign-android']);
  grunt.registerTask('sign-android', ['exec:sign_android']);

  /**
   * Desktop app
   */

  // Build desktop
  grunt.registerTask('build-desktop', ['build-desktop-others', 'build-desktop-osx-dmg', 'build-desktop-osx-pkg']);

  // Build desktop win64 & linux64
  grunt.registerTask('build-desktop-others', ['prod', 'nwjs:others', 'copy:linux', 'exec:create_others_dist']);

  // Build desktop osx pkg
  grunt.registerTask('build-desktop-osx-pkg', ['prod', 'exec:get_nwjs_for_pkg', 'nwjs:pkg', 'exec:create_pkg_dist']);

  // Build desktop osx dmg
  grunt.registerTask('build-desktop-osx-dmg', ['prod', 'nwjs:dmg', 'exec:create_dmg_dist']);

  // Sign desktop
  grunt.registerTask('sign-desktop', ['exec:sign_desktop_dist']);

  // Release desktop
  grunt.registerTask('build-desktop-release', ['build-desktop', 'sign-desktop']); 
};
