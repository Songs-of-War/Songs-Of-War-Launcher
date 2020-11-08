const fs = require('fs')
const ConfigManager = require('./configmanager')
class LoggerUtil {

    constructor(prefix, style){
        this.prefix = prefix
        this.style = style
    }

    log(){
        console.log.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[LOG] ' + arguments[0] + '\n')
    }

    info(){
        console.info.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[INFO] ' + arguments[0] + '\n')
    }

    warn(){
        console.warn.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[WARN] ' + arguments[0] + '\n')
    }

    debug(){
        console.debug.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[DEBUG] ' + arguments[0] + '\n')
    }

    error(){
        console.error.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[ERROR] ' + arguments[0] + '\n')
    }

}

module.exports = function (prefix, style){
    return new LoggerUtil(prefix, style)
}