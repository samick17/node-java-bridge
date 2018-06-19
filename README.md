#Description

**bridge API for node-java repository**

This API allows you:

1. call static method easily without knowing class path

2. create java instance with "new" keyword
 

#Installation



    npm install node-java-example

    or 

    yarn add node-java-example

##Usage


    
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
    


##[References]
Github: [node-java](https://github.com/joeferner/node-java)