const java = require('java');
const path = require('path');

function isClassPath(text) {
	return text.lastIndexOf('.class') + 6 === text.length;
}
function getClassMethods(className) {
	return java.callStaticMethodSync('com.samick.jarbridge.JarBridge', 'dumpMethods', className);
}
function normalizeClassPath(fullClassPath) {
	return fullClassPath.replace('.class', '').replace(/\//g, () => {
		return '.'
	});
}
function argumentsToArray(args) {
	var newArgs = [];
	for(var j in args) {
		newArgs.push(args[j]);
	}
	return newArgs;
}
function loadJarModule(fullClassPath, createStaticMethodFn, createMethodFn) {
	var objectPrototype = function() {
		var constructorArgs = [fullClassPath];
		var args = argumentsToArray(arguments);
		if(Array.isArray(args)) {
			constructorArgs = constructorArgs.concat(args);
		}
		this.jinstance = java.newInstanceSync.apply(java, constructorArgs);
	};
	var className = fullClassPath.substring(fullClassPath.lastIndexOf('.')+1);
	Object.defineProperty(objectPrototype, 'name', {
		value: className,
		writable: false
	});
	getClassMethods(fullClassPath).forEach((methodDef) => {
		var mArray = methodDef.split(':');
		var methodName = mArray[0];
		var isStaticMethod = mArray[1] === 'static';
		var methodArgs = mArray[2].substring(1, mArray[2].length-1).split(',');
		if(isStaticMethod) {
			objectPrototype[methodName] = createStaticMethodFn(methodName);
		} else {
			objectPrototype.prototype[methodName] = createMethodFn(methodName);
		}
	});
	return objectPrototype;
}
function loadJarModuleSync(fullClassPath) {
	return loadJarModule(normalizeClassPath(fullClassPath), (methodName) => {
		return function() {
			var args = [fullClassPath, methodName].concat(argumentsToArray(arguments));
			return java.callStaticMethodSync.apply(java, args);
		};
	}, (methodName) => {
		return function() {
			var args = [this.jinstance, methodName].concat(argumentsToArray(arguments));
			return java.callMethodSync.apply(java, args);
		};
	});
}
function loadJarModuleAsync(fullClassPath) {
	return loadJarModule(normalizeClassPath(fullClassPath), (methodName) => {
		return function() {
			var fnArgs = argumentsToArray(arguments);
			var args = [fullClassPath, methodName].concat(fnArgs);
			var lastArg = fnArgs[fnArgs.length - 1];
			if(lastArg instanceof Function) {
				return java.callStaticMethod.apply(java, args);
			} else {
				return new Promise((resolve, reject) => {
					args.push((err, data) => {
						if(err) reject(err);
						else resolve(data);
					});
					java.callStaticMethod.apply(java, args);
				});
			}
			
		};
	}, (methodName) => {
		return function() {
			var fnArgs = argumentsToArray(arguments);
			var args = [this.jinstance, methodName].concat(fnArgs);
			var lastArg = fnArgs[fnArgs.length - 1];
			if(lastArg instanceof Function) {
				return java.callMethod.apply(java, args);
			} else {
				return new Promise((resolve, reject) => {
					args.push((err, data) => {
						if(err) reject(err);
						else resolve(data);
					});
					java.callMethod.apply(java, args);
				});
			}
		};
	});
}

function addClassPath(classPath) {
	if(path.isAbsolute(classPath)) {
		java.classpath.push(classPath);
		console.log(`add classpath ${classPath}`);
	} else {
		throw new Error('Invalid classPath')
	}
}

addClassPath(path.join(process.cwd(), 'lib', 'JarBridge.jar'));

module.exports = {
	isClassPath: isClassPath,
	getClassMethods: getClassMethods,
	normalizeClassPath: normalizeClassPath,
	loadJarModuleAsync: loadJarModuleAsync,
	loadJarModuleSync: loadJarModuleSync,
	addClassPath: addClassPath
};
