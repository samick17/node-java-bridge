const path = require('path');
let jarPath = './Main.jar';
let jarBridge = require('./lib/jar-bridge');

jarBridge.load(jarPath)
.then((api) => {
	console.log(api);
	console.log('---- Instance ----');
	console.log(api.Base);
	let b1 = new api.Base();
	console.log(b1.call('my arg'));

	console.log('---- End of Instance ----');

	console.log('---- Static Methods ----');

	console.log(api.Main.dumpMethods('com.samick.jarbridge.instance.Concrete'));
	console.log('---- End of Static Methods ----');
}, (err) => {
	console.log(err);
});
