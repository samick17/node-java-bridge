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

function isClassPath(text) {
	return text.lastIndexOf('.class') + 6 === text.length;
}

function normalizeClassPath(text) {
	return text.replace('.class', '').replace(/\//g, () => {
		return '.'
	});
}
/*TODO fix dumpMethods order problem*/
function getClassMethods(className) {
	return java.callStaticMethodSync('com.samick.jarbridge.Main', 'dumpMethods', className);
}
function parseClassMethods(className) {
	var classMethods = getClassMethods(className);
	var staticMethods = {};
	var methods = {};
	classMethods.forEach((classMethod) => {
		var arr = classMethod.split(':');
		var mName = arr[0];
		var mIsStatic = arr[1] === 'static';
		var mArgs = arr[2].split(',');
		if(mIsStatic) {
			staticMethods[mName] = {
				name: mName,
				args: mArgs
			};
		} else {
			methods[mName] = {
				name: mName,
				args: mArgs
			};
		}
	});
	return {
		staticMethods: staticMethods,
		methods: methods
	};
}
function argumentsToArray(args) {
	var newArgs = [];
	for(var j in args) {
		newArgs.push(args[j]);
	}
	return newArgs;
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
			return isClassPath(text);
		})
		.map((text) => {
			return normalizeClassPath(text);
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
