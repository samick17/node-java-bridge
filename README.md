## Description

**bridge API for node-java repository**

This API allows you:

1. call static method easily without knowing class path

2. create java instance with "new" keyword
 
## ChangeLogs

  1. 2018/06/21: (1.0.6) UpdateReadMe
  2. 2018/06/21: (1.0.5) Integrate instance method & static methods, refactor jar-bridge.js
  3. 2018/06/20: (1.0.4) Remove unused object javaAPI
  4. 2018/06/20: (1.0.3) Replace all "let" with "var" for nodeJS compatibility
  5. 2018/06/20: (1.0.2) Update jar file for JavaSE-1.7 compatibility

## Compatibility

  1. Java1.7

## Installation



    npm install node-java-example

    or 

    yarn add node-java-example

    1. Configure java path(for jar command).
       if there is no jdk installation, you can also put jar file into your project,
       and add following scripts:
       process.env.Path += ';<your_jar_path>';

## Usage

    
    const path = require('path');
    var jarPath = ['../my-java-project/Main.jar', './Main.jar'];
    var jarBridge = require('./lib/jar-bridge');

    jarBridge.load(jarPath, {sync: true})
    .then((api) => {
      console.log('---- Instance ----');
      console.log(api.Base);
      var b1 = new api.Base();
      console.log(b1.call('my arg'));

      console.log('---- End of Instance ----');

      console.log('---- Static Methods ----');
      console.log(api.Main.dumpMethods('com.samick.jarbridge.instance.Concrete'));
      console.log('---- End of Static Methods ----');
    }, (err) => {
      console.log('Error');
      console.log(err);
    })
    .catch((err) => {
      console.log('---- Catch ----');
      console.log(err);
    });

    


## [References]
Github: [node-java](https://github.com/joeferner/node-java)
