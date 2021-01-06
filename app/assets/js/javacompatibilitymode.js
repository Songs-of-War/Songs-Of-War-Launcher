const si = require('systeminformation')
const { remote } = require('electron')
const childprocess = require('child_process')

let compatibilityMode = false
// Default
let expectedJavaRevision = 52

let isFinished = false

let isManualMode = false

exports.isCompatibilityEnabled = function () {
    return compatibilityMode
}

exports.getExpectedJava8UpdateRevision = function () {
    return expectedJavaRevision
}

exports.isManualCompatibility = function () {
    return isManualMode
}

exports.scanComplete = function () {
    return isFinished
}

function warnUserOfCompatiblity(reason) {
    isFinished = true
    console.log('Warning user of comp mode')
    // eslint-disable-next-line no-undef
    if(!ConfigManager.getCompatibilityWarningShowed()) {
        console.log('User warned')
        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            title: 'Songs of War Launcher - Compatibility Warning',
            message: 'The compatibility mode has been automatically activated on this system. You may suffer performance issues.',
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

function setManual() {
    if(compatibilityMode) {
        return
    }

    // eslint-disable-next-line no-undef
    if (ConfigManager.getCompatibilityModeSwitch()) {
        isManualMode = true
        compatibilityMode = true
        warnUserOfCompatiblity('User enabled compatibility mode')
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
            setManual()
            isFinished = true
            break
        case 'win32': {
            // TODO: Do the windows side use: wmic path win32_VideoController get name

            let stdoutLog = []

            childprocess.exec('wmic path win32_VideoController get name', {
                encoding: 'utf-8',
            }, (error, stdout, stderr) => {
                if (error) {
                    warnUserOfCompatiblity('Internal Windows Error')
                    return
                }
                stdoutLog.push(stdout.toString().split('\n'))
                // Primary graphics device
                let graphicsDevice
                for (let i = 1; i < 10; i++) {
                    graphicsDevice = stdoutLog[0][i]
                    console.log('Found graphic devices: ' + graphicsDevice)
                }

                graphicsDevice = stdoutLog[0][1]


                if((graphicsDevice.toLowerCase().includes('intel') || graphicsDevice.toLowerCase().includes('hd graphics')) && stdoutLog[0].length < 2) {
                    compatibilityMode = true
                    warnUserOfCompatiblity('Detected Intel HD Graphics as primary graphics device')
                }
            })
            console.info('Done! Got Windows')
            setManual()
            isFinished = true
            break
        }
        case 'linux': {
            let graphics = await si.graphics()
            if (graphics.controllers[0] === undefined) {
                compatibilityMode = true
                warnUserOfCompatiblity('Unable to detect graphics device')
                console.info('Done! Got Linux')
                break
            }
            // Intel HD graphics is shit and causes so many problems it's unbelievable
            // so I'm marking it as incompatible
            let graphicss = graphics.controllers[0].model.toLowerCase()
            console.log('Linux: Got graphics! ' + graphicss)

            if ((graphicss.includes('intel') || graphicss.includes('hd graphics')) && graphics.controllers.length < 2)  {
                compatibilityMode = true
                warnUserOfCompatiblity('Detected Intel HD Graphics as primary graphics device')
            }
            console.info('Done! Got Linux')
            setManual()
            isFinished = true
            break
        }

    }
}