module.exports = function(context) {
	var fs = require('fs');
	var path = require('path');

	var rootdir = context.opts.projectRoot;

	var platformDir = 'platforms/android';
        //change the path to your external gradle file
	var srcFile = path.join(rootdir, 'src/android/build-extras.gradle');
	var destFile = path.join(rootdir, platformDir, 'build-extras.gradle');

	console.log("copying "+srcFile+" to "+destFile);
	fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
}