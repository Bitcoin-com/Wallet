'use strict';

const assert = require('assert');
const fs = require('fs');

console.log('******');

fs.readFile(__dirname + '/../platforms/ios/Bitcoin.com\ Wallet.xcodeproj/project.pbxproj', function onReadFile(err, data) {
  if (err) {
    throw err; 
  }
  //console.log(data.toString());
  var contents = data.toString();
  //console.log('File was read.');
  getDebugConfigurations(contents);
});


function addConfiguration(contents) {

}

function getBuildConfig(contents, idAndName) {
  const idIndex = contents.indexOf(idAndName);
  assert(idIndex);

  const buildConfigOpeningBracketIndex = contents.indexOf('{', idIndex);
  const buildSettingsClosingBracketIndex = contents.indexOf('}', buildConfigOpeningBracketIndex + 1);
  const buildConfigClosingBracketIndex = contents.indexOf('}', buildSettingsClosingBracketIndex + 1);

  const buildConfig = contents.substring(
    buildConfigOpeningBracketIndex,
    buildConfigClosingBracketIndex + 1
  );

  return buildConfig;
}

function insertBuildConfiguration(contents, buildConfiguration, idAndName) {
  const buildConfigsEndDelimiter = '/* End XCBuildConfiguration section */';
  const buildConfigEndIndex = contents.indexOf(buildConfigsEndDelimiter);
  assert(buildConfigEndIndex >= 0);

  const newConfig = '    ' + idAndName + ' = ' + buildConfiguration + '\n' + buildConfigsEndDelimiter;
  const newContents = contents.replace(buildConfigsEndDelimiter, newConfig);

  fs.writeFile(__dirname + '/../platforms/ios/Bitcoin.com\ Wallet.xcodeproj/project2.pbxproj', newContents, function onWriteFile(err) {
    if(err) {
        return console.log(err);
    }

    console.log('project2.pbxproj was written');
  });
}

function renamedBuildConfig(buildConfig, newName) {
  return buildConfig.replace('name = Debug', 'name = ' + newName);
}

function getDebugConfiguration(contents, configContents, start, newName, newId) {

  const buildConfigId = getDebugConfigurationId(contents, configContents, start);
  assert(buildConfigId);
  const buildConfig = getBuildConfig(contents, buildConfigId);
  assert(buildConfig)

  const renamed = renamedBuildConfig(buildConfig, newName);
  assert(renamed);

  insertBuildConfiguration(contents, renamed, 'AAAAAAAAAAAAAAAAAAAAAAA1 /* ' + newName + ' */')
  
  return renamed;
}

function getDebugConfigurationId(contents, configContents, start) {
  //console.log('getDebugConfiguration() starting at: ' + start);
  const subContents = configContents.substring(start);
  //console.log('subContents: "' + subContents.substring(0, 200) + '"');

  //const buildConfigsRegex = /[\s\S]+buildConfigurations = \(\s*([^\)]+)/;
  const buildConfigsRegex = /.+buildConfigurations = \(\s*([^\)]+)/;
  const buildConfigsExec = buildConfigsRegex.exec(subContents);
  assert(buildConfigsExec.length === 2);

  const buildConfigsText = buildConfigsExec[1];
  //console.log('buildConfigsText: "' + buildConfigsText + '"');

  const buildConfigLines = buildConfigsText.split(',');
  let debugIdAndName = '';
  buildConfigLines.forEach(function onLine(line) {
    if (line.indexOf(' Debug ') >= 0) {
      debugIdAndName = line.trim();
    }
  });

  assert(debugIdAndName);
  console.log('Debug build config ID:', debugIdAndName);

  //const PBXNativeTargetExistingBuildConfig = getBuildConfig(contents, PBXNativeTargetDebugIdAndName);
  //console.log('PBXNativeTargetExistingBuildConfig:', PBXNativeTargetExistingBuildConfig);
  return debugIdAndName;
}


function getDebugConfigurations(contents) {

  
  //buildConfigurations = (
  //  1D6058940D05DD3E006BFB54 /* Debug */,
  //  DAD7F4DA21EEE6DC00135531 /* Task */,
  //  1D6058950D05DD3E006BFB54 /* Release */,
  //);
  const newName = 'Dev';
  const PBXNativeTargetId = 'AAAAAAAAAAAAAAAAAAAAAAA1';
  const PBXProjectId = 'AAAAAAAAAAAAAAAAAAAAAAA2';

  const configListIndex = contents.indexOf('/* Begin XCConfigurationList section */');
  const configContents = contents.substring(configListIndex);

  const PBXNativeTargetBuildConfigsIndex = configContents.indexOf('/* Build configuration list for PBXNativeTarget');
  const PBXProjectBuildConfigsIndex = configContents.indexOf('/* Build configuration list for PBXProject');

  const PBXNativeTargetBuildConfig = getDebugConfiguration(contents, configContents, PBXNativeTargetBuildConfigsIndex, newName, PBXNativeTargetId);
  //const PBXProjectBuildConfig      = getDebugConfiguration(contents, configContents, PBXProjectBuildConfigsIndex, newName, PBXProjectId);
  

}