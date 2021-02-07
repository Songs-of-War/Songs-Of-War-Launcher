const {ipcRenderer, remote, shell, webFrame} = require('electron')

let progressBar = document.getElementById('updateProgress')

ipcRenderer.on('updateDownloadStatusUpdate', (event, args, percentage) => {
    switch (args) {
        case 'downloading':
            progressBar.value = percentage
            break
    }
})

ipcRenderer.send('updateDownloadStatusUpdate', 'readyToStartUpdate')