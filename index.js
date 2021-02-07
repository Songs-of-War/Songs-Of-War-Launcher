// Requirements
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const autoUpdater                   = require('electron-updater').autoUpdater
const ejse                          = require('ejs-electron')
const fs                            = require('fs')
const isDev                         = require('./app/assets/js/isdev')
const path                          = require('path')
const semver                        = require('semver')
const url                           = require('url')
/*const unhandled                     = require('electron-unhandled')
const {openNewGitHubIssue, debugInfo} = require('electron-util')

unhandled({
    reportButton: error => {
        openNewGitHubIssue({
            user: 'Songs-of-War',
            repo: 'Songs-of-War-Launcher',
            body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
        })
    },
    showDialog: true
})*/

let myWindow = null

let updateWin;

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (myWindow) {
            if (myWindow.isMinimized()) myWindow.restore()
            myWindow.focus()
        }
    })

    // Start checking for updates screen

    app.on('ready', async () => {
        updateWin = new BrowserWindow({
            darkTheme: true,
            width: 400,
            height: 300,
            icon: getPlatformIcon('SealCircle'),
            frame: false,
            resizable: false,
            closable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                worldSafeExecuteJavaScript: true,

            },
            backgroundColor: '#171614'
        })

        updateWin.loadURL(url.format({
            pathname: path.join(__dirname, 'app', 'updatecheck.ejs'),
            protocol: 'file:',
            slashes: true
        }))

        ipcMain.on('updateDownloadStatusUpdate', (event, args) => {
            if(args === 'readyToStartUpdate') {
                initAutoUpdater(event)
            }
        })

    })



    // Create myWindow, load the rest of the app, etc...
    //app.on('ready', createWindow)
    //app.on('ready', createMenu)
}

// Setup auto updater.
function initAutoUpdater(event, data) {


    autoUpdater.allowPrerelease = false
    autoUpdater.autoInstallOnAppQuit = true
    
    if(isDev){
        autoUpdater.autoInstallOnAppQuit = false
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
    }
    if(process.platform === 'darwin'){
        autoUpdater.autoDownload = false
    }
    autoUpdater.on('update-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-available', info)
        if(process.platform === 'win32') {
            console.log('New update available, sending Balloon');
            (async () => {
                const TrayBallon = new Tray(path.join(__dirname, '/app/assets/images/icon.png'))
                console.log('Waiting 5 seconds')
                setTimeout(function() {
                    TrayBallon.displayBalloon({
                        title: 'New update available for download',
                        content: 'A new update for the launcher is available! You should download it!',
                        icon: path.join(__dirname, '/app/assets/images/icon.png')
                    })
                    console.log('Sent balloon notification')
                    TrayBallon.once('balloon-closed', () => {
                        TrayBallon.destroy()
                    })
                }, 5000)            
            })()
            
            /*TrayBallon.on('balloon-closed', () => {
                TrayBallon.destroy()
            })*/
        }
    })

    autoUpdater.on('download-progress', (progress, byPs, percent, total, transferred) => {
        event.sender.send('updateDownloadStatusUpdate', 'downloading', percent)
    })

    autoUpdater.on('update-downloaded', (info) => {
        event.sender.send('autoUpdateNotification', 'update-downloaded', info)
        if(process.platform === 'win32') {
            console.log('New update ready, sending Balloon');
            (async () => {
                const TrayBallon = new Tray(path.join(__dirname, '/app/assets/images/icon.png'))
                console.log('Waiting 5 seconds')
                setTimeout(function() {
                    TrayBallon.displayBalloon({
                        title: 'New update ready',
                        content: 'A new update for the launcher is ready for installation!',
                        icon: path.join(__dirname, '/app/assets/images/icon.png')
                    })
                    console.log('Sent balloon notification')
                    TrayBallon.once('balloon-closed', () => {
                        TrayBallon.destroy()
                    })
                }, 5000)            
            })()
        }
    })
    autoUpdater.on('update-not-available', (info) => {
        event.sender.send('autoUpdateNotification', 'update-not-available', info)
    })
    autoUpdater.on('checking-for-update', () => {
        event.sender.send('autoUpdateNotification', 'checking-for-update')
    })
    autoUpdater.on('error', (err) => {
        event.sender.send('autoUpdateNotification', 'realerror', err)
    }) 
}

// Open channel to listen for update actions.
ipcMain.on('autoUpdateAction', (event, arg, data) => {
    switch(arg){
        case 'initAutoUpdater':
            console.log('Initializing auto updater.')
            initAutoUpdater(event, data)
            event.sender.send('autoUpdateNotification', 'ready')
            break
        case 'checkForUpdate':
            autoUpdater.checkForUpdates()
                .catch(err => {
                    event.sender.send('autoUpdateNotification', 'realerror', err)
                })
            break
        case 'allowPrereleaseChange':
            if(!data){
                const preRelComp = semver.prerelease(app.getVersion())
                if(preRelComp != null && preRelComp.length > 0){
                    autoUpdater.allowPrerelease = false
                } else {
                    autoUpdater.allowPrerelease = data
                }
            } else {
                autoUpdater.allowPrerelease = data
            }
            break
        case 'installUpdateNow':
            autoUpdater.quitAndInstall()
            break
        default:
            console.log('Unknown argument', arg)
            break
    }
})
// Redirect distribution index event from preloader to renderer.
ipcMain.on('distributionIndexDone', (event, res) => {
    event.sender.send('distributionIndexDone', res)
})

// Disable hardware acceleration.
// https://electronjs.org/docs/tutorial/offscreen-rendering


//app.disableHardwareAcceleration()

// https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

async function createWindow() {


    win = new BrowserWindow({
        darkTheme: true,
        width: 980,
        height: 552,
        icon: getPlatformIcon('SealCircle'),
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'app', 'assets', 'js', 'preloader.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            worldSafeExecuteJavaScript: true
        },
        backgroundColor: '#171614'
    })

    console.log(path.join(__dirname, 'app', 'assets', 'js', 'preloader.js').toString())

    myWindow = win

    ejse.data('bkid', Math.floor((Math.random() * fs.readdirSync(path.join(__dirname, 'app', 'assets', 'images', 'backgrounds')).length)))

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'app', 'app.ejs'),
        protocol: 'file:',
        slashes: true
    }))

    /*win.once('ready-to-show', () => {
        win.show()
    })*/

    win.removeMenu()

    win.resizable = true

    win.on('closed', () => {
        win = null
    })

}

function createMenu() {
    
    if(process.platform === 'darwin') {

        // Extend default included application menu to continue support for quit keyboard shortcut
        let applicationSubMenu = {
            label: 'Application',
            submenu: [{
                label: 'About Application',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => {
                    app.quit()
                }
            }]
        }

        // New edit menu adds support for text-editing keyboard shortcuts
        let editSubMenu = {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }]
        }

        // Bundle submenus into a single template and build a menu object with it
        let menuTemplate = [applicationSubMenu, editSubMenu]
        let menuObject = Menu.buildFromTemplate(menuTemplate)

        // Assign it to the application
        Menu.setApplicationMenu(menuObject)

    }

}

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'app', 'assets', 'images', `${filename}.${ext}`)
}



app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})