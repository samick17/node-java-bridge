const path = require('path');

function loadSample() {
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

}
function loadModuleSample() {
	const jarClassLoader = require('./lib/jar-class-loader');
	jarClassLoader.addClassPath('../my-java-project/Main.jar');
	var Main = jarClassLoader.loadJarModuleAsync('com/example/api/Main');
	console.log(Main);
}

//loadSample();
//loadModuleSample();