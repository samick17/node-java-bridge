const path = require('path');
let jarPath = './Main.jar';
let jarBridge = require('./lib/jar-bridge');

jarBridge.load(jarPath)
.then((data) => {
	console.log('---- Instance ----');
	console.log(data.instance.Base);
	let b1 = new data.instance.Base();
	console.log(b1.call('my arg'));

	console.log('---- End of Instance ----');

	console.log('---- Static Methods ----');

	console.log(data.static.Main.dumpMethods('com.samick.jarbridge.instance.Concrete'));
	console.log('---- End of Static Methods ----');
}, (err) => {
	console.log(err);
});
