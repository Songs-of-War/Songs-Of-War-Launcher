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
        details: initialDetails,
        state: 'Server', //Server name
        largeImageKey: 'sealcircle',
        largeImageText: 'Songs of War Server',
        smallImageKey: genSettings.smallImageKey,
        smallImageText: genSettings.smallImageText,
        partySize: 0,
        partyMax: 0,
        startTimestamp: LastDate,
        instance: false
    }

    client.on('ready', () => {
        logger.log('Discord RPC Connected')
        client.setActivity(activity)
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

exports.updateDetails = function(details){
    if(!isRPCEnabled) return
    activity.details = details
    client.setActivity(activity)
}

exports.updatePartySize = function(curPlayers = 0, maxPlayers = 0){
    if(!isRPCEnabled) return
    activity.partyMax = maxPlayers
    activity.partySize = curPlayers
    client.setActivity(activity)
}

exports.shutdownRPC = function(){
    if(!client) return
    client.clearActivity()
    client.destroy()
    client = null
    activity = null
}