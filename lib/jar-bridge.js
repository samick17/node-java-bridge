const exec = require('child_process').exec;
const os = require('os');
const path = require('path');
const java = require('java');
const jarClassLoader = require('./jar-class-loader');

function dumpJarContent(jarPath) {
	return new Promise((resolve, reject) => {
		exec(`jar tf ${jarPath}`, (err, data) => {
			if(err) {
				reject(err);
			} else {
				resolve(data.split(os.EOL));
			}
		});	
	});
}

function getClassName(classPath) {
	return classPath.substring(classPath.lastIndexOf('.')+1);
}

function JarBridge(jarPath) {
	this.jarPath = jarPath;
	this.api = {};
	this.classPaths = [];
}
JarBridge.prototype.dumpClassPath = function() {
	var jarBridge = this;
	var promise;
	if(Array.isArray(jarBridge.jarPath)) {
		promise = Promise.all(jarBridge.jarPath.map((jarPath) => {
			return jarBridge.doDumpClassPath(jarPath);
		}));
	} else {
		promise = jarBridge.doDumpClassPath(jarBridge.jarPath);
	}
	return promise
	.then(() => {
		var filteredClassPaths = jarBridge.classPaths
		.filter((text) => {
			return jarClassLoader.isClassPath(text);
		})
		.map((text) => {
			return jarClassLoader.normalizeClassPath(text);
		});
		jarBridge.classPaths.splice.apply(jarBridge.classPaths, [0, jarBridge.classPaths.length].concat(filteredClassPaths));
		return jarBridge;
	});
};
JarBridge.prototype.doDumpClassPath = function(jarPath) {
	var jarBridge = this;
	return dumpJarContent(jarPath)
	.then((data) => {
		jarBridge.classPaths.splice.apply(jarBridge.classPaths, [0, jarBridge.classPaths.length].concat(data));
	});
};
JarBridge.prototype.addPrototype = function(classPath, objectPrototype) {
	var className = getClassName(classPath);
	var classObject = this.api[className] = {};
	classObject[classPath] = objectPrototype;
};
JarBridge.prototype.load = function(options) {
	var jarBridge = this;
	options = options || {};
	var postfix = options.sync ? 'Sync' : 'Async';
	function loadJarModuleRec(index, callback) {
		var classPath = jarBridge.classPaths[index];
		if(classPath) {

			var objectPrototype = jarClassLoader['loadJarModule'+postfix](classPath);
			jarBridge.addPrototype(classPath, objectPrototype);
			loadJarModuleRec(index+1, callback);
		} else {
			callback();
		}
	}
	return new Promise((resolve, reject) => {
		loadJarModuleRec(0, () => {
			resolve(jarBridge);
		});
	});
};

JarBridge.prototype.exportsInstanceMethods = function() {
	return exportsMethods(this.api);
};

function exportsMethods(api) {
	var exportedInstanceMap = {};
	for(var key in api) {
		var classObject = api[key];
		var classObjectKeys = Object.keys(classObject);
		if(classObjectKeys.length === 1) {
			exportedInstanceMap[key] = classObject[classObjectKeys[0]];
		} else {
			var originClassObjectsInPackage = api[key];
			var classObjectInPackage = exportedInstanceMap[key] = {};
			for(var reservedPackageName in originClassObjectsInPackage) {
				classObjectInPackage[reservedPackageName.substring(1)] = originClassObjectsInPackage[reservedPackageName];
			}
		}
	}
	return exportedInstanceMap;
};

function create(jarPath) {
	return new JarBridge(jarPath);
}
function load(jarPath, options) {
	if(Array.isArray(jarPath)) {
		jarPath.forEach((jpath) => {
			java.classpath.push(jpath);
		});
	} else {
		java.classpath.push(jarPath);
	}
	return create(jarPath)
	.dumpClassPath()
	.then((jarBridge) => {
		return jarBridge.load(options);
	})
	.then((jarBridge) => {
		return jarBridge.exportsInstanceMethods();
	});
}

module.exports = {
	load: load
};
