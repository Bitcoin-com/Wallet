'use strict';

(function() {

  angular
      .module('bitcoincom.services')
      .factory('latestReleaseService', latestReleaseService);

  function latestReleaseService($log, $http, $ionicPopup, configService, externalLinkService, gettextCatalog, platformInfo) {

    var service = {
      // Functions
      checkLatestRelease: checkLatestRelease,
      requestLatestRelease: requestLatestRelease,
      showUpdatePopup: showUpdatePopup
    };

    return service;

    function checkLatestRelease(cb) {
      var releaseURL = configService.getDefaults().release.url;

      requestLatestRelease(releaseURL, function (err, releaseData) {
        if (err) return cb(err);
        var currentVersion = window.version;
        var latestVersion = releaseData.tag_name;

        if (!verifyTagFormat(currentVersion))
          return cb('Cannot verify the format of version tag: ' + currentVersion);
        if (!verifyTagFormat(latestVersion))
          return cb('Cannot verify the format of latest release tag: ' + latestVersion);

        var current = formatTagNumber(currentVersion);
        var latest = formatTagNumber(latestVersion);

        if (latest.major < current.major || (latest.major === current.major && latest.minor <= current.minor)) {
          return cb(null, false);
        }

        var releaseSearchTerm = "";
        if (platformInfo.isNW) { // XX SP: DESKTOP: Check if the latest release is already available for current OS
          var platform = process.platform;
          if (platform === "darwin") {
            releaseSearchTerm = "osx";
          } else if (platform === "win32") {
            releaseSearchTerm = "win";
          } else if (platform === "linux") {
            releaseSearchTerm = "linux";
          }
          var foundNewVersion = false;
          for (var i in releaseData.assets) {
            if (releaseData.assets[i].name.indexOf(releaseSearchTerm) !== -1) {
              foundNewVersion = true;
              break;
            }
          }
        }

        $log.debug('A new version is available: ' + latestVersion);

        var releaseNotes = false;
        if (releaseData.body) {
          var releaseLines = releaseData.body.split('\n');
          for (var lineNum in releaseLines) {
            if (releaseLines[lineNum].substring(0, 2) === "# ") {
              releaseLines[lineNum] = "<strong>" + releaseLines[lineNum].substring(2) + "</strong>";
            } else if (releaseLines[lineNum].substring(0, 2) === "- ") {
              releaseLines[lineNum] = "&bull; " + releaseLines[lineNum].substring(2);
            }
          }
          releaseNotes = releaseLines.join('\n');
        }

        return cb(null, {latestVersion: latestVersion, releaseNotes: releaseNotes});
      });

      function verifyTagFormat(tag) {
        var regex = /^v?\d+\.\d+(\.\d+)?(-([a-z]+))?(\d+)?$/i;
        return regex.exec(tag);
      }

      function formatTagNumber(tag) {
        var label = false;
        if (tag.split("-")[1]) { // Move postfixes like "-rc2" to a variable
          label = tag.split("-")[1];
          tag = tag.split("-")[0];
        }

        var formattedNumber = tag.replace(/^v/i, '').split('.');
        return {
          major: +(formattedNumber[0] ? +formattedNumber[0] : 0),
          minor: +(formattedNumber[1] ? +formattedNumber[1] : 0),
          patch: +(formattedNumber[2] ? +formattedNumber[2] : 0),
          label: label /* XX SP: Maybe we can use this in a later stage (with for example 1.0.0-rc2 the value will be "rc2" and false if there is no label) */
        };
      }
    }

    function requestLatestRelease(releaseURL, cb) {
      $log.debug('Retrieving latest release information...');

      var request = {
        url: releaseURL,
        method: 'GET',
        json: true
      };

      $http(request).then(function (release) {
        $log.debug('Latest release: ' + release.data.name);
        return cb(null, release.data);
      }, function (err) {
        return cb('Cannot get the release information: ' + err);
      });
    }

    function showUpdatePopup() {
      var buttons = [];

      if (!platformInfo.isIOS) { // There is no GitHub-release for iPhone
        buttons.push({
          text: "GitHub",
          type: 'button-positive',
          onTap: function () {
            var url = 'https://github.com/Bitcoin-com/Wallet/releases/latest';
            externalLinkService.open(url, false);
          }
        });
      }
      if (platformInfo.isAndroid) {
        buttons.unshift({
          text: "Google Play Store",
          type: 'button-positive',
          onTap: function () {
            var url = 'https://play.google.com/store/apps/details?id=com.bitcoin.mwallet';
            externalLinkService.open(url, false);
          }
        });
      }
      if (platformInfo.isIOS) {
        buttons.unshift({
          text: "App Store",
          type: 'button-positive',
          onTap: function () {
            var url = 'https://itunes.apple.com/app/id1252903728';
            externalLinkService.open(url, false);
          }
        });
      } else if (platformInfo.isNW) {
        if (process.platform === 'darwin') {
          buttons.unshift({
            text: "Mac App Store",
            type: 'button-positive',
            onTap: function () {
              var url = 'https://itunes.apple.com/app/bitcoin-com-wallet/id1383072453';
              externalLinkService.open(url, false);
            }
          });
        }
      }

      if (buttons.length === 1) { // There is only one source to download (probably on desktop, so open GitHub release page..)
        buttons[0].onTap();
      } else {
        buttons.push({
          text: gettextCatalog.getString('Go Back'),
          type: 'button-positive',
          onTap: function () {
            return true;
          }
        });
        $ionicPopup.show({
          title: gettextCatalog.getString('Update Available'),
          subTitle: gettextCatalog.getString('An update to this app is available. For your security, please update to the latest version.'),
          cssClass: 'popup-update',
          buttons: buttons
        });
      }
    }
  }
})();