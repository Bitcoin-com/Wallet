#!/usr/bin/env node

'use strict';

const blankOrEmptyTranslationRegex = /^\s*"\s*"$/

if (process.argv[2]) {
  var no_build = (process.argv[2].toLowerCase() == '--nobuild')
  if (no_build == false) {
    console.log('Incorrect arg. Please use --nobuild if you would like to download without api key.');
    process.exit(1);
  };
} else {
  var no_build = false;
  console.log('\n' +
              'Please note: If you do not have the crowdin API key and would like to download the ' +
              'translations without building anyways, please make sure your English files are the same ' +
              'version as crowdin, and then run this script with --nobuild\n\n' +
              'eg. "node crowdin_download.js --nobuild"\n\n');
};

var fs = require('fs');
var path = require('path');
var https = require('https');
var AdmZip = require('adm-zip');

var crowdin_identifier = 'bitcoincom-wallet'

try {
  // obtain the crowdin api key
  var crowdin_api_key = fs.readFileSync(path.join(__dirname, 'crowdin_api_key.txt'), 'utf8')
} catch (e) {
  console.log('### ERROR ### You do not have the crowdin api key in ./crowdin_api_key.txt');
  process.exit(1);
};

if (no_build == false) { // Reminder: Any changes to the script below must also be made to the else clause and vice versa. 

  // This call will tell the server to generate a new zip file for you based on most recent translations.
  https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/export?key=' + crowdin_api_key, function(res) {
    
    console.log('Export Got response: ' + res.statusCode);
    
    res.on('data', function(chunk) {
      var resxml = chunk.toString('utf8');
      console.log(resxml);
      
      if (resxml.indexOf('status="skipped"') >= 0) {
        console.log('Translation build was skipped due to either:\n' +
                    '1. No changes since last translation build, or\n' +
                    '2. API limit of once per 30 minutes has not been waited.\n\n' +
                    'Since we can not guarantee that translations have been built properly, this script will end here.\n' +
                    'Log in to Bitcoin.com Wallet\'s Crowdin Settings and click the "Build Project" button to assure it is built recently, and then run this ' +
                    'script again with the --nobuild arg to download translations without checking if built.');
        process.exit(1);
      };
      
      downloadAllTranslationsAfterLastBuild();
    });
  }).on('error', function(e) {
    console.log('Export Got error: ' + e.message);
  });

} else { // Reminder: Any changes to the script below must also be made to the above and vice versa.
  downloadAllTranslationsAfterLastBuild();
};

function downloadAllTranslationsAfterLastBuild () {
  // Download most recent translations for all languages.
  https.get('https://api.crowdin.com/api/project/' + crowdin_identifier + '/download/all.zip?key=' + crowdin_api_key, function(res) {
    var data = [], dataLen = 0; 
    
    res.on('data', function(chunk) {
        data.push(chunk);
        dataLen += chunk.length;
      }).on('end', function() {
        var buf = new Buffer(dataLen);
        for (var i=0, len = data.length, pos = 0; i < len; i++) {
          data[i].copy(buf, pos);
          pos += data[i].length;
        };

        updateLocalFilesFromDownloadedZipBuffer(buf);
      });
  });
}

function updateLocalFilesFromDownloadedZipBuffer(buf) {
  
  var zip = new AdmZip(buf);
  const extractionPath = path.join(__dirname, 'po')
  zip.extractAllTo(extractionPath, true);
  console.log('Done extracting ZIP file.');
  
  let untranslatedPoFileDeletedCount = 0;
  var files = fs.readdirSync(extractionPath);
        
  for (var i in files) {
    const name = files[i];
    if (name == 'template.pot') {
      continue;
    }

    const fullPath = path.join(extractionPath, name);
    const status = fs.statSync(fullPath);
    if (!status.isDirectory()) {
      console.log(`Not a directory. Don't know what to do with "%{name}", skipping.`);
      continue;
    }

    const filePath = path.join(fullPath, `template-${name}.po`);

    if (name === "zh-HK") {
      console.log("Deleting zh-HK, because we also have zh-CN and the app uses 2-character locales. Also zh-HK was untranslated at time of writing.");
      fs.unlinkSync(filePath);
      continue
    }

    var po_file = fs.readFileSync(filePath, 'utf8');
    var po_array = po_file.split('\n');
    const linesCount = po_array.length;
    for (let j = 0; j < linesCount; j++) {
      if (po_array[j].slice(0,5) === 'msgid') {
        var source_text = po_array[j].slice(5);
      } else if (po_array[j].slice(0,6) === 'msgstr') {
        var translate_text = po_array[j].slice(6);
        // If a line is not == English, it means there is at least one translation. Keep this entire file.
        if ((!blankOrEmptyTranslationRegex.test(translate_text)) &&
            source_text !== translate_text) {
          console.log(`Keeping ${name}`);
          // erase email addresses of last translator for privacy
          po_file = po_file.replace(/ <.+@.+\..+>/, '')
          fs.writeFileSync(filePath, po_file);
          
          // split the file into 3 parts, before locale, locale, and after locale.
          var lang_pos = po_file.search('"Language: ') + 11;
          var po_start = po_file.slice(0,lang_pos);
          var po_locale = po_file.slice(lang_pos,lang_pos + 5);
          var po_end = po_file.slice(lang_pos + 5);
          
          // check for underscore, if it's there, only take the first 2 letters and reconstruct the po file.
          // TODO: Fix how this is done, because it won't work properly for
          // Chinese, Traditional and Chinese, Simplified, they will clash.
          if (po_locale.search('_') > 0) {
            fs.writeFileSync(filePath, po_start + po_locale.slice(0,2) + po_end);
            po_start = '';
            po_locale = '';
            po_end = '';
          };
          break;
        };
      };
      if (j === (linesCount - 1)) { // All strings are exactly identical to English. Delete po file.
        fs.unlinkSync(filePath);
        console.log(`Deleted ${name}`)
        untranslatedPoFileDeletedCount++;
      };
      
    };
  };
  
  console.log(`Completely untranslated po files cleaned out: ${untranslatedPoFileDeletedCount} (Not including zh-HK)`);
}