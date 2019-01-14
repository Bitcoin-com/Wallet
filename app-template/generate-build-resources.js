#!/usr/bin/env node

var shell = require('shelljs');

console.log('Annotating icon...');
var branchExec = shell.exec('git rev-parse --abbrev-ref HEAD');

if (branchExec.code !== 0) {
  console.error('Failed to get branch name, exit code: ' + branchExec.code);
  return;
}
var branch = branchExec.output.trim()
console.log('Branch: "' + branch + '"');
var branchParts = branch.split('/');

var branchType = 'unknown';
var branchNumber = '';

switch (branchParts.length) {
  case 2:
    if (branchParts[1] === 'dev') {
      branchType = 'dev'
    }
  break;
  case 3: 
    switch (branchParts[1]) {
      case 'hotfix':
        branchType = 'hotfix';
        branchNumber = branchParts[2];
      break;
      case 'sprint':
        branchType = 'sprint';
        branchNumber = branchParts[2];
      break;
      case 'task':
        branchType = 'task';
        branchNumber = branchParts[2];
      break;
      default:
        // nop
    }
  break;
  default:
    // nop
}

var buildVariant = '';
var color = '';
var iconText = '';


// Normal flow of colour
// Red  -> Orange -> Green as build gets more solid
// task -> sprint -> dev
// Out of band fixes (hotfixes) are an out of band colour: blue

// Treat unidentified branches as release.
switch (branchType) {
  case 'dev':
    buildVariant = 'dev';
    color = '004c03';
    iconText = 'DEV';
  break;
  case 'hotfix':
    buildVariant = 'hotfix';
    color = '003eaa';
    iconText = 'H' + branchNumber;
  break;
  case 'sprint':
    buildVariant = 'sprint' + branchNumber;
    color = 'c94900'
    iconText = 'S' + branchNumber;
  break;
  case 'task':
    buildVariant = 'task' + branchNumber;
    color = 'a0001f'
    iconText = branchNumber;
  break;
  default:
  // Treat as release
}

var annotateCommandLine = './annotate_icon.sh ' + buildVariant + ' ' + iconText + ' ' + color;
console.log('Annotate command line: "' + annotateCommandLine + '"');
var annotateExec = shell.exec(annotateCommandLine);

if (annotateExec.code !== 0) {
  console.log('Failed to annotate the icon, exit code: ' + annotateExec.code);
  return;
}

console.log('Annotating icon complete.');