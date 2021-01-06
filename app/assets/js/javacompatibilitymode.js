const si = require('systeminformation')
const { remote } = require('electron')

let compatibilityMode = false

function isCompatiblityModeEnabled() {
    return compatibilityMode
}

function warnUserOfCompatiblity(reason) {
    console.warn('Warning user of comp mode')
    // eslint-disable-next-line no-undef
    if(!ConfigManager.getCompatibilityWarningShowed()) {
        console.warn('User wanred')
        remote.dialog.showMessageBox({
            title: 'Compatibility Mode',
            message: 'The compatibility mode has been automatically activated on this system due to potential outdated hardware in your system, you may suffer performance issues during your play sessions.',
            detail: 'Reason for activation: ' + reason,
            type: 'warning',
            checkboxChecked: false,
            checkboxLabel: 'Don\'t warn me about this again'
        }).then((value) => {
            if(value.checkboxChecked) {
                // eslint-disable-next-line no-undef
                ConfigManager.setCompatibilityWarningShowed(true)
            }
        })
    }
}

exports.initCompatibilityMode = async function() {
    console.log('Compatibility mode check initiated')
    switch (process.platform) {
        case 'darwin':
            // We're always gonna run on compatibility mode on MacOS because FUCK. IT.
            // For those that don't know mac adds some special errors that don't happen on
            // any other OS, it's fucking stupid
            compatibilityMode = true
            warnUserOfCompatiblity('MacOS detected')
            console.info('Done! Got MacOS')
            break
        case 'win32':
            // TODO: Do the windows side use: wmic path win32_VideoController get name
            console.info('Done! Got Windows')
            break
        case 'linux':
            let graphics = await si.graphics()
            if(graphics.controllers[0] === undefined) {
                compatibilityMode = true
                warnUserOfCompatiblity('Unable to detect graphics device')
                console.info('Done! Got Linux')
                break
            }
            // Intel HD graphics is shit and causes so many problems it's unbelievable
            // so I'm marking it as incompatible
            let graphicss = graphics.controllers[0].model.toLowerCase()
            console.log('Linux: Got graphics! ' + graphicss)

            if(graphicss.includes('intel') || graphicss.includes('hd graphics')) {
                compatibilityMode = true
                warnUserOfCompatiblity('Detected Intel HD Graphics as primary graphics device')
            }
            console.info('Done! Got Linux')
            break
    }
}