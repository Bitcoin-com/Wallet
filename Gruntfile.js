'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      get_nwjs_for_pkg: {
        command: 'if [ ! -d ./cache/0.19.5-pkg/osx64/nwjs.app ]; then cd ./cache; curl https://dl.nwjs.io/v0.19.5-mas-beta/nwjs-mas-v0.19.5-osx-x64.zip --output nwjs.zip; unzip nwjs.zip; mkdir -p ./0.19.5-pkg/osx64; cp -R ./nwjs-mas-v0.19.5-osx-x64/nwjs.app  ./0.19.5-pkg/osx64/; fi'
      },
      create_others_dist: {
        command: 'sh webkitbuilds/create-others-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      create_dmg_dist: {
        command: 'sh webkitbuilds/create-dmg-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      create_pkg_dist: {
        command: 'sh webkitbuilds/create-pkg-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>" "<%= pkg.nameCaseNoSpace %>" "<%= pkg.title %>"'
      },
      sign_desktop_dist: {
        command: 'sh webkitbuilds/sign-desktop-dist.sh "<%= pkg.name %>" "<%= pkg.fullVersion %>"'
      },
      appConfig: {
        command: 'node ./util/buildAppConfig.js'
      },
      externalServices: {
        command: 'node ./util/buildExternalServices.js'
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
      chrome: {
        command: 'make -C chrome-app '
      },
      wpinit: {
        command: 'make -C cordova wp-init',
      },
      wpcopy: {
        command: 'make -C cordova wp-copy',
      },
      iosdebug: {
        command: 'npm run build:ios',
      },
      ios: {
        command: 'npm run build:ios-release',
      },
      xcode: {
        command: 'npm run open:ios',
      },
      androiddebug: {
        command: 'npm run build:android',
      },
      android: {
        command: 'npm run build:android-release',
      },
      androidrun: {
        command: 'npm run run:android && npm run log:android',
      },
      androidbuild: {
        command: 'cd cordova/project && cordova build android --release',
      },
      androidsign: {
        command: 'rm -f cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk; jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../bitcoin-com-release-key.jks -signedjar cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk  cordova/project/platforms/android/build/outputs/apk/android-release-unsigned.apk bitcoin-com && ../android-sdk-macosx/build-tools/27.0.1/zipalign -v 4 cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk ',
        stdin: true,
      },
      desktopsign: {
        cmd: 'gpg -u E0AE67E7 --output webkitbuilds/others/<%= pkg.title %>-linux.zip.sig --detach-sig webkitbuilds/others/<%= pkg.title %>-linux.zip ; gpg -u E0AE67E7 --output webkitbuilds/others/<%= pkg.title %>.exe.sig --detach-sig webkitbuilds/others/<%= pkg.title %>.exe'
      },
      desktopverify: {
        cmd: 'gpg --verify webkitbuilds/<%= pkg.title %>-linux.zip.sig webkitbuilds/<%= pkg.title %>-linux.zip; gpg --verify webkitbuilds/<%= pkg.title %>.exe.sig webkitbuilds/<%= pkg.title %>.exe'
      },
      osxsign: {
        cmd: 'gpg -u E0AE67E7 --output webkitbuilds/<%= pkg.title %>.dmg.sig --detach-sig webkitbuilds/<%= pkg.title %>.dmg'
      },
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
      js: {
        src: [
          'src/js/app.js',
          'src/js/routes.js',

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
          'www/lib/bitcoin-cash-js.js': ['www/lib/bitcoin-cash-js.js']
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
          appName: '<%= pkg.nameCaseNoSpace %>',
          platforms: ['osx64'],
          buildDir: './webkitbuilds/pkg',
          version: '0.19.5',
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
  grunt.registerTask('ios', ['exec:ios']);
  grunt.registerTask('ios-debug', ['exec:iosdebug']);
  grunt.registerTask('ios-run', ['exec:xcode']);
  grunt.registerTask('cordovaclean', ['exec:cordovaclean']);
  grunt.registerTask('android-debug', ['exec:androiddebug', 'exec:androidrun']);
  grunt.registerTask('android', ['exec:android']);
  grunt.registerTask('android-release', ['prod', 'exec:android', 'exec:androidsign']);
  grunt.registerTask('desktopsign', ['exec:desktopsign', 'exec:desktopverify']); 

  // Build desktop
  grunt.registerTask('desktop-build', ['desktop-others', 'desktop-osx-dmg', 'desktop-osx-pkg']);

  // Build desktop win64 & linux64
  grunt.registerTask('desktop-others', ['prod', 'nwjs:others', 'copy:linux', 'exec:create_others_dist']);

  // Build desktop osx pkg
  grunt.registerTask('desktop-osx-pkg', ['prod', 'exec:get_nwjs_for_pkg', 'nwjs:pkg', 'exec:create_pkg_dist']);

  // Build desktop osx dmg
  grunt.registerTask('desktop-osx-dmg', ['prod', 'nwjs:dmg', 'exec:create_dmg_dist']);

  // Sign desktop
  grunt.registerTask('desktop-sign', ['exec:sign_desktop_dist']);

  // Release desktop
  grunt.registerTask('desktop-release', ['desktop-build', 'desktop-sign']); 
};
