const fs = require('fs')
const ConfigManager = require('./configmanager')
class LoggerUtil {

    constructor(prefix, style){
        this.prefix = prefix
        this.style = style
    }

    log(){
        console.log.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[LOG]' + this.prefix + JSON.stringify(arguments) + '\n')
    }

    info(){
        console.info.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[INFO]' + this.prefix + JSON.stringify(arguments) + '\n')
    }

    warn(){
        console.warn.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[WARN]' + this.prefix + JSON.stringify(arguments) + '\n')
    }

    debug(){
        console.debug.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[DEBUG]' + this.prefix + JSON.stringify(arguments) + '\n')
    }

    error(){
        console.error.apply(null, [this.prefix, this.style, ...arguments])
        fs.appendFileSync(ConfigManager.getLauncherDirectory() + '/latest.log', '[ERROR]' + this.prefix + JSON.stringify(arguments) + '\n')
    }

}

module.exports = function (prefix, style){
    return new LoggerUtil(prefix, style)
}