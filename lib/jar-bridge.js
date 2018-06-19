const exec = require('child_process').exec;
const os = require('os');
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
	let classPath = text.replace('.class', '').replace(/\//g, () => {
		return '.'
	});
	let index = classPath.lastIndexOf('.');
	let package = classPath.substring(0, index);
	let className = classPath.substring(index+1);
	return {
		package: package,
		className: className
	};
}

function getClassMethods(className) {
	return java.callStaticMethodSync('com.samick.jarbridge.Main', 'dumpMethods', className);
}
function parseClassMethods(className) {
	let classMethods = getClassMethods(className);
	let staticMethods = {};
	let methods = {};
	classMethods.forEach((classMethod) => {
		let arr = classMethod.split(':');
		let mName = arr[0];
		let mIsStatic = arr[1] === 'static';
		let mArgs = arr[2].split(',');
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
	let newArgs = [];
	for(let j in args) {
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
	let jarBridge = this;
	return dumpJarContent(jarBridge.jarPath)
	.then((data) => {
		jarBridge.classPaths = data
		.filter((text) => {
			return isClassPath(text);
		})
		.map((text) => {
			let normalizedClassPath = normalizeClassPath(text);
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
	let jarBridge = this;
	let map = jarBridge.staticClassNameMap;
	let packageName = reservedPackagePrefix + package;
	if(className in map) {
		map[className][packageName] = {};
	} else {
		let classMap = map[className] = {};
		classMap[packageName] = {};
	}
};
/*for static methods*/
JarBridge.prototype.addStaticMethods = function(className, package, methods) {
	let staticClassNameMap = this.staticClassNameMap;
	let classObject = staticClassNameMap[className];
	let classObjectInPackage = classObject[reservedPackagePrefix+package];
	for(let i in methods) {
		let method = methods[i];
		let methodName = method.name;
		classObjectInPackage[methodName] = function() {
			let fullClassName = package+'.'+className;
			let args = [fullClassName, methodName].concat(argumentsToArray(arguments));
			return java.callStaticMethodSync.apply(java, args);
		};
	}
};
JarBridge.prototype.newJavaInstance = function(fullClassPath, jsInstance, args) {
	let constructorArgs = [fullClassPath];
	if(Array.isArray(args)) {
		constructorArgs = constructorArgs.concat(args);
	}
	let inst = java.newInstanceSync.apply(java, constructorArgs);
	return inst;
};
/*for create instance*/
JarBridge.prototype.addClassLoader = function(className, package, methods) {
	let jarBridge = this;
	let fullClassPath = package+'.'+className;
	let classNameMap = jarBridge.classNameMap;
	let classObject = classNameMap[className] = {};
	let classPrototype = classObject[reservedPackagePrefix+package] = function() {
		let newInstArgs = [fullClassPath, this].concat(argumentsToArray(arguments));
		this._inst = jarBridge.newJavaInstance.apply(jarBridge, newInstArgs);
	};
	let classMethods = getClassMethods(fullClassPath);
	classMethods.forEach((classMethod) => {
		let arr = classMethod.split(':');
		let mName = arr[0];
		let mIsStatic = arr[1] === 'static';
		let mArgs = arr[2].split(',');
		if(!mIsStatic) {
			classPrototype.prototype[mName] = function() {
				let args = [this._inst, mName].concat(argumentsToArray(arguments));
				return java.callMethodSync.apply(java, args);
			};
		}
	});
};
JarBridge.prototype.load = function() {
	let jarBridge = this;
	return new Promise((resolve, reject) => {
		jarBridge.classPaths.forEach((classPath) => {
			jarBridge.addJavaClass(classPath.className);
			let classMethods = parseClassMethods(classPath.package + '.' + classPath.className);
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
	let exportedInstanceMap = {};
	for(let key in classNameMap) {
		let classObject = classNameMap[key];
		let classObjectKeys = Object.keys(classObject);
		if(classObjectKeys.length === 1) {
			exportedInstanceMap[key] = classObject[classObjectKeys[0]];
		} else {
			let originClassObjectsInPackage = classNameMap[key];
			let classObjectInPackage = exportedInstanceMap[key] = {};
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
