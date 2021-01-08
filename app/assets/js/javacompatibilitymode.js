const si = require('systeminformation')
const { remote } = require('electron')

let expectedJavaRevision = 52
let compatibilityMode = false

let manifestData = ''

let isFinished = false

let isManualMode = false

let standardOSManifestURL = ''

exports.getManifestDataForCurrentOS = function () {
    return manifestData
}

exports.getStandardOSManifestLink = function () {
    return standardOSManifestURL
}

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

    if (ConfigManager.getCompatibilityModeSwitch()) {
        isManualMode = true
        compatibilityMode = true
        warnUserOfCompatiblity('User enabled compatibility mode')
    }
}

function closeDueToCriticalError(data = '') {
    remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        title: 'Songs of War Launcher',
        detail: 'A critical error has occurred, check your network connection (COMPATIBILITY_MODE_JAVA_DISTRIBUTION_GETTER_FAILURE)\n\n' + data,
        type: 'error',
    }).then((value) => {
        remote.app.exit()

    })
}

exports.initCompatibilityMode = async function() {
    console.log('Compatibility mode check initiated')


    if(!ConfigManager.getCompabilityCheckDisabled()) {

        try {
        // TODO: Add linux manifest
        if(process.platform !== 'linux') {
            let downloadUrl
            if (process.platform === 'darwin') {
                downloadUrl = 'https://launchermeta.mojang.com/v1/products/launcher/022631aeac4a9addbce8e0503dce662152dc198d/mac-os.json'
            } else {
                downloadUrl = 'https://launchermeta.mojang.com/v1/products/launcher/d03cf0cf95cce259fa9ea3ab54b65bd28bb0ae82/windows-x86.json'
            }


            let download = await got(downloadUrl)
            standardOSManifestURL = JSON.parse(download.body)['jre-x64'][0]['manifest']['url']
            let expectedVersion = /(?<=1\.8\.0_)\d+(?=\d*)/gm.exec(JSON.parse(download.body)['jre-x64'][0]['version']['name'])
            if (expectedVersion === undefined) {
                closeDueToCriticalError()
                return
            }
            expectedJavaRevision = expectedVersion
        }
        } catch (e) {
            closeDueToCriticalError(e)
            return
        }

    }

        switch (process.platform) {
            case 'darwin':
                // We're always gonna run on compatibility mode on MacOS because FUCK. IT.
                // For those that don't know mac adds some special errors that don't happen on
                // any other OS, it's fucking stupid
                compatibilityMode = true
                warnUserOfCompatiblity('MacOS detected')
                console.info('Done! Got MacOS')
                break
            case 'win32': {
                const wsi = require('wmic-sys-info')
                let wmicRequest = await wsi.getVideoController()

                // Primary graphics device
                let graphicsDevice
                for (let i = 0; i < 10; i++) {
                    graphicsDevice = wmicRequest[i]
                    if (graphicsDevice === undefined) {
                        break
                    }
                    console.log('Found graphic device: ' + graphicsDevice.VideoProcessor)
                }

                graphicsDevice = wmicRequest[0].VideoProcessor


                if ((graphicsDevice.toLowerCase().includes('intel') || graphicsDevice.toLowerCase().includes('hd graphics')) && wmicRequest.length < 2) {
                    compatibilityMode = true
                    warnUserOfCompatiblity('Detected Intel HD Graphics as primary graphics device')
                }
                console.info('Done! Got Windows')
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

                if ((graphicss.includes('intel') || graphicss.includes('hd graphics')) && graphics.controllers.length < 2) {
                    compatibilityMode = true
                    warnUserOfCompatiblity('Detected Intel HD Graphics as primary graphics device')
                }
                console.info('Done! Got Linux')
                break
            }

        }
    }
    setManual()
    isFinished = true
}