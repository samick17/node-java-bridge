## Description

**bridge API for node-java repository**

This API allows you:

1. call static method easily without knowing class path

2. create java instance with "new" keyword
 
## ChangeLogs

  1. 2018/06/22: (1.0.21) Update ReadMe-Usage, refactor jar-bridge.js & jar-class-loader.js, rename Main.jar to JarBridge.jar, remove unused class of JarBridge.java
  2. 2018/06/21: (1.0.6) UpdateReadMe
  3. 2018/06/21: (1.0.5) Integrate instance method & static methods, refactor jar-bridge.js
  4. 2018/06/20: (1.0.4) Remove unused object javaAPI
  5. 2018/06/20: (1.0.3) Replace all "let" with "var" for nodeJS compatibility
  6. 2018/06/20: (1.0.2) Update jar file for JavaSE-1.7 compatibility

## Compatibility

  1. Java 1.7 or higher

## Installation



    npm install node-java-example

    or 

    yarn add node-java-example

    1. Configure java path(for jar command).
       if there is no jdk installation, you can also put jar file into your project,
       and add following scripts:
       process.env.Path += ';<your_jar_path>';

## Usage

 * Load All Jar Classes

	* Limitation: if jar is too large, it will throw array size exceed error.


	
    		const jarPath = ['../my-java-project/Main.jar'];
    		const jarBridge = require('./lib/jar-bridge');
    		jarBridge.load(jarPath, {sync: true})
    		.then((api) => {
    			console.log('---- Instance ----');
	    		console.log(api.Base);
    			var b1 = new api.Base();
    			console.log(b1.call('my arg'));
    
    			console.log('---- End of Instance ----');
    
    			console.log('---- Static Methods ----');
    			console.log(api.Main.dumpMethods('com.example.api.instance.Concrete'));
    			console.log('---- End of Static Methods ----');
    		}, (err) => {
    			console.log('Error');
	    		console.log(err);
    		})
    		.catch((err) => {
    			console.log('---- Catch ----');
    			console.log(err);
    		});
	

 * Load part of jar
    

    	const jarClassLoader = require('./lib/jar-class-loader');
    	jarClassLoader.addClassPath('../my-java-project/Main.jar');

    	var Main = jarClassLoader.loadJarModuleAsync('com/example/api/Main');

    	console.log(Main);

    


## [References]
Github: [node-java](https://github.com/joeferner/node-java)
