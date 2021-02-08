const {ipcRenderer, remote, shell, webFrame} = require('electron')

let progressBar = document.getElementById('updateProgress')
let messageText = document.getElementById('updateText')

progressBar.value = 0

ipcRenderer.on('updateDownloadStatusUpdate', (event, args, percentage) => {
    switch (args) {
        case 'downloading':
            progressBar.value = percentage
            messageText.textContent = 'Downloading update'
            break
    }
})

ipcRenderer.send('updateDownloadStatusUpdate', 'readyToStartUpdate')
