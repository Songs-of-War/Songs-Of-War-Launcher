const {ipcRenderer} = require('electron')
const fs            = require('fs-extra')
const fsold = require('fs')
const os            = require('os')
const path          = require('path')
const got = require('got')

const ConfigManager = require('./configmanager')
const DistroManager = require('./distromanager')
const LangLoader    = require('./langloader')
const LoggerUtils = require('./loggerutil')
const logger = LoggerUtils('%c[Preloader]', 'color: #a02d2a; font-weight: bold')
const DiscordWrapper = require('./discordwrapper')

logger.log('Loading..')

fsold.unlinkSync(ConfigManager.getLauncherDirectory() + '/latest.log')

// Load ConfigManager
ConfigManager.load()

// Load Strings
LangLoader.loadLanguage('en_US')

function onDistroLoad(data){
    if(data != null){
        
        // Resolve the selected server if its value has yet to be set.
        if(ConfigManager.getSelectedServer() == null || data.getServer(ConfigManager.getSelectedServer()) == null){
            logger.log('Determining default selected server..')
            ConfigManager.setSelectedServer(data.getMainServer().getID())
            ConfigManager.save()
        }
    }
    ipcRenderer.send('distributionIndexDone', data != null)
    const distro = DistroManager.getDistribution()
    if(distro.discord != null) {
        DiscordWrapper.initRPC(distro.discord, 'In the Launcher', new Date().getTime())
    }
}


try {
    got('https://mysql.songs-of-war.com/maintenance').then(result => {
        if(result.body === 'true') {
            onDistroLoad(null)
            console.log('Server maintenance true')
        } else {
            console.log('Server maintenance false')

            // Ensure Distribution is downloaded and cached.
            DistroManager.pullRemote().then((data) => {

                logger.log('Loaded distribution index.')

                onDistroLoad(data)

            }).catch((err) => {
                logger.log('Failed to load distribution index.')
                logger.error(err)

                onDistroLoad(null)

            })

            // Clean up temp dir incase previous launches ended unexpectedly. 
            fs.remove(path.join(os.tmpdir(), ConfigManager.getTempNativeFolder()), (err) => {
                if(err){
                    logger.warn('Error while cleaning natives directory', err)
                } else {
                    logger.log('Cleaned natives directory.')
                }
            })
        }
    })
} catch(error) {
    console.error(error)
    onDistroLoad(null)
}


