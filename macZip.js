const {
    generateZipandBlockmap
} = require('@imjs/electron-differential-updater')
const fs = require('fs')
  
generateZipandBlockmap()

let packageFile = require('./package.json')


fs.renameSync(`./dist/Songs of War Game-${packageFile.version}-mac.zip`, `./dist/Songs-of-War-Game-mac-${packageFile.version}.zip`)
fs.renameSync(`./dist/Songs of War Game-${packageFile.version}-mac.zip.blockmap`, `./dist/Songs-of-War-Game-mac-${packageFile.version}.zip.blockmap`)
