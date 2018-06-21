const pkg = process.argv[2];
const fs = require('fs');
const os = require('os');
const path = require('path');
const exec = require('child_process').exec;

const source = '1.7';
const target = '1.7';

const basePath = process.cwd();

function buildToJavaClassFile(filePaths) {
	return new Promise((resolve, reject) => {
		var filePathText = filePaths.join(' ');
		var cmd = `javac -source ${source} -target ${target} -cp . ${filePathText}`;
		exec(cmd, (err) => {
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function buildToJar(filePaths) {
	return new Promise((resolve, reject) => {
		var filePathText = filePaths.join(' ');
		var cmd = `jar -cvfm Main.jar MANIFEST ${filePathText}`;
		exec(cmd, (err) => {
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function walkDirectoryRec(index, filePathArray, onDirCallback, callback) {
	var filePath = filePathArray[index];
	if(filePath) {
		walkDirectory(filePath, onDirCallback, () => {
			walkDirectoryRec(index+1, filePathArray, onDirCallback, callback);
		});
	} else {
		callback();
	}
}

function walkDirectory(filePath, onDirCallback, callback) {

	fs.readdir(filePath, (err, curDirs) => {
		var files = [];
		var dirs = [];
		curDirs.forEach((dirPath) => {
			var fPath = path.join(filePath, dirPath);
			var stat = fs.statSync(fPath);
			if(stat.isFile()) {
				files.push(fPath);
			} else {
				dirs.push(fPath);
			}
		});
		onDirCallback(filePath);
		walkDirectoryRec(0, dirs, onDirCallback, () => {
			callback();
		});
	});
}

var pkgsToBuild = [];
walkDirectory(path.join(basePath, pkg), (dir) => {
	var pkg = dir.replace(basePath, '').substring(1).replace(/\\/g, '/');
	pkgsToBuild.push(pkg + '/*.java');
}, () => {
	buildToJavaClassFile(pkgsToBuild)
	.then(() => {
		buildToJar(pkgsToBuild);
	});
});