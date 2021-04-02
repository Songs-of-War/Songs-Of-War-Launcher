// Work in progress
const logger = require('./loggerutil')('%c[DiscordWrapper]', 'color: #7289da; font-weight: bold')

const {Client} = require('discord-rpc')
let LastDate = null
let isRPCEnabled = false

let client
let activity


exports.initRPC = function(genSettings, initialDetails = 'In the Launcher', startTimestampDate = null){
    client = new Client({ transport: 'ipc' })

    // Male sure to not reset the time when the argument isn't passed
    if(startTimestampDate != null) {
        LastDate = startTimestampDate
    }

    activity = {
        buttons: [
            { label: '🌐 Check us out', url: 'https://songs-of-war.com' },
            /*
            Adding a start game option would require adding a new protocol which is different on every OS
            on linux specifically it is different on every Desktop Environment and I'm not willing to support so many different versions.

            Pull requests are welcome if you wish to implement this.
            https://www.electronjs.org/docs/api/app#appsetasdefaultprotocolclientprotocol-path-args
            https://stackoverflow.com/a/19771330
             */
            //{ label: '🎮 Start the game', url: 'songsofwar://start' },

            { label: '🤖 Join our discord server', url: 'https://discord.songs-of-war.com'}
        ],
        details: initialDetails,
        state: 'Server', //Server name
        assets: {
            large_image: 'sealcircle',
            large_text: 'songs-of-war.com',
            small_image: genSettings.smallImageKey,
            small_text: genSettings.smallImageText
        },
        // We can have a party of 0 so we only ad the object whenever there is people online
        /*party: {
            size: [0, 150],
        },*/
        timestamps: {
            start: LastDate,
        }
    }

    client.on('ready', () => {
        logger.log('Discord RPC Connected')
        client.request('SET_ACTIVITY', { pid: process.pid, activity})
        //client.setActivity(activity, process.pid)
        isRPCEnabled = true
       
    })

    
    
    
    client.login({clientId: genSettings.clientId}).catch(error => {
        if(error.message.includes('ENOENT')) {
            logger.log('Unable to initialize Discord Rich Presence, no client detected.')
        } else {
            logger.log('Unable to initialize Discord Rich Presence: ' + error.message, error)
        }
    })


    
}


exports.updateOC = function(ocName, ocSpecies, imageKey) {
    if(!isRPCEnabled) return
    activity.assets.small_image = imageKey
    activity.assets.small_text = ocSpecies + ' OC: ' + ocName
    client.request('SET_ACTIVITY', { pid: process.pid, activity})
}

exports.resetOC = function() {
    if(!isRPCEnabled) return
    activity.assets.small_image = 'mainlogo'
    activity.assets.small_text = 'Songs of War'
    client.request('SET_ACTIVITY', { pid: process.pid, activity})
}

exports.updateDetails = function(details, startimestamp = null){
    if(!isRPCEnabled) return
    activity.details = details
    if(startimestamp != null) {
        LastDate = startimestamp
    }
    if(details == 'In the Launcher') {
        exports.resetOC()
    }
    activity.timestamps.start = LastDate
    client.request('SET_ACTIVITY', { pid: process.pid, activity})
}

exports.updatePartySize = function(curPlayers = 0, maxPlayers = 0){
    if(!isRPCEnabled) return
    if(curPlayers != 0) {
        // The size is an array
        activity.party.size = [curPlayers, maxPlayers]
    }
    client.request('SET_ACTIVITY', { pid: process.pid, activity})
}

exports.shutdownRPC = function(){
    if(!client) return
    client.clearActivity()
    client.destroy()
    client = null
    activity = null
}