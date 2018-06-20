const exec = require('child_process').exec;
const os = require('os');
const path = require('path');
const java = require('java');
const reservedPackagePrefix = '!';//because ! is not valid for java method

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
	var classPath = text.replace('.class', '').replace(/\//g, () => {
		return '.'
	});
	var index = classPath.lastIndexOf('.');
	var package = classPath.substring(0, index);
	var className = classPath.substring(index+1);
	return {
		package: package,
		className: className
	};
}

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

function JarBridge(jarPath) {
	this.jarPath = jarPath;
	this.javaAPI = {};
	this.staticClassNameMap = {};
	this.classNameMap = {};
}
JarBridge.prototype.dumpClassPath = function() {
	var jarBridge = this;
	return dumpJarContent(jarBridge.jarPath)
	.then((data) => {
		jarBridge.classPaths = data
		.filter((text) => {
			return isClassPath(text);
		})
		.map((text) => {
			var normalizedClassPath = normalizeClassPath(text);
			jarBridge.addClassObject(normalizedClassPath.className, normalizedClassPath.package);
			return normalizedClassPath;
		});
		return jarBridge;
	});
};
JarBridge.prototype.addJavaClass = function(className) {
	if(!(className in this.javaAPI)) {
		this.javaAPI[className] = {};
	}
};
JarBridge.prototype.getClassObject = function(className, package) {
	return staticClassNameMap[className][reservedPackagePrefix+package];
};
JarBridge.prototype.addClassObject = function(className, package) {
	var jarBridge = this;
	var map = jarBridge.staticClassNameMap;
	var packageName = reservedPackagePrefix + package;
	if(className in map) {
		map[className][packageName] = {};
	} else {
		var classMap = map[className] = {};
		classMap[packageName] = {};
	}
};
/*for static methods*/
JarBridge.prototype.addStaticMethods = function(className, package, methods) {
	var staticClassNameMap = this.staticClassNameMap;
	var classObject = staticClassNameMap[className];
	var classObjectInPackage = classObject[reservedPackagePrefix+package];
	for(var i in methods) {
		var method = methods[i];
		var methodName = method.name;
		classObjectInPackage[methodName] = function() {
			var fullClassName = package+'.'+className;
			var args = [fullClassName, methodName].concat(argumentsToArray(arguments));
			return java.callStaticMethodSync.apply(java, args);
		};
	}
};
JarBridge.prototype.newJavaInstance = function(fullClassPath, jsInstance, args) {
	var constructorArgs = [fullClassPath];
	if(Array.isArray(args)) {
		constructorArgs = constructorArgs.concat(args);
	}
	var inst = java.newInstanceSync.apply(java, constructorArgs);
	return inst;
};
/*for create instance*/
JarBridge.prototype.addClassLoader = function(className, package, methods) {
	var jarBridge = this;
	var fullClassPath = package+'.'+className;
	var classNameMap = jarBridge.classNameMap;
	var classObject = classNameMap[className] = {};
	var classPrototype = classObject[reservedPackagePrefix+package] = function() {
		var newInstArgs = [fullClassPath, this].concat(argumentsToArray(arguments));
		this._inst = jarBridge.newJavaInstance.apply(jarBridge, newInstArgs);
	};
	var classMethods = getClassMethods(fullClassPath);
	classMethods.forEach((classMethod) => {
		var arr = classMethod.split(':');
		var mName = arr[0];
		var mIsStatic = arr[1] === 'static';
		var mArgs = arr[2].split(',');
		if(!mIsStatic) {
			classPrototype.prototype[mName] = function() {
				var args = [this._inst, mName].concat(argumentsToArray(arguments));
				return java.callMethodSync.apply(java, args);
			};
		}
	});
};
JarBridge.prototype.load = function() {
	var jarBridge = this;
	return new Promise((resolve, reject) => {
		jarBridge.classPaths.forEach((classPath) => {
			jarBridge.addJavaClass(classPath.className);
			var classMethods = parseClassMethods(classPath.package + '.' + classPath.className);
			jarBridge.addStaticMethods(classPath.className, classPath.package, classMethods.staticMethods);
			jarBridge.addClassLoader(classPath.className, classPath.package, classMethods.methods);
		});
		resolve(jarBridge);
	});
};
JarBridge.prototype.exportsStaticMethods = function() {
	return exportsMethods(this.staticClassNameMap);
};
JarBridge.prototype.exportsInstanceMethods = function() {
	return exportsMethods(this.classNameMap);
};

function exportsMethods(classNameMap) {
	var exportedInstanceMap = {};
	for(var key in classNameMap) {
		var classObject = classNameMap[key];
		var classObjectKeys = Object.keys(classObject);
		if(classObjectKeys.length === 1) {
			exportedInstanceMap[key] = classObject[classObjectKeys[0]];
		} else {
			var originClassObjectsInPackage = classNameMap[key];
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

function load(jarPath) {
	java.classpath.push(jarPath);
	java.classpath.push(path.join(__dirname, '../Main.jar'));
	return create(jarPath)
	.dumpClassPath()
	.then((jarBridge) => {
		return jarBridge.load();
	})
	.then((jarBridge) => {
		return {
			javaAPI: jarBridge.javaAPI,
			static: jarBridge.exportsStaticMethods(),
			instance: jarBridge.exportsInstanceMethods()
		};
	});
}

module.exports = {
	load: load
};
