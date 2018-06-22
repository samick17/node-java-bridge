const jarBridge = require('./jar-bridge');
const jarClassLoader = require('./jar-class-loader');
var modules = module.exports = {};
function exportModule(moduleData) {
    for(var key in moduleData) {
        modules[key] = moduleData[key];
    }
}

exportModule(jarBridge);
exportModule(jarClassLoader);
