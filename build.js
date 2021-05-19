const builder = require('electron-builder')
const Platform = builder.Platform

function getCurrentPlatform(){
    switch(process.platform){
        case 'win32':
            return Platform.WINDOWS
        case 'darwin':
            return Platform.MAC
        case 'linux':
            return Platform.linux
        default:
            console.error('Cannot resolve current platform!')
            return undefined
    }
}

builder.build({
    targets: (process.argv[2] != null && Platform[process.argv[2]] != null ? Platform[process.argv[2]] : getCurrentPlatform()).createTarget(),
    config: {
        appId: 'SoWLauncher',
        productName: 'Songs of War Game',
        artifactName: 'Songs-of-War-Game-${os}-${version}.${ext}',
        copyright: 'Copyright © 2020-2021 Dexiam',
        directories: {
            buildResources: 'build',
            output: 'dist'
        },
        win: {
            compression: 'maximum',
            target: [
                {
                    target: 'nsis',
                    arch: 'x64'
                }
            ]
        },
        nsis: {
            oneClick: true,
            perMachine: false,
            allowElevation: true,
        },
        mac: {
            target: [
                'dmg',
                'zip'
            ],
            category: 'public.app-category.games',
            compression: 'maximum',
        },
        linux: {
            target: [
                {
                    target: 'AppImage', // Only AppImage supports auto updating
                    arch: 'x64'
                },

            ],
            maintainer: 'Songs of War Server',
            vendor: 'Songs of War Server',
            synopsis: 'Modded Minecraft Launcher',
            description: 'Launcher for the Songs of War Minecraft Server.',
            category: 'Game',
            icon: './build/icon.png'
        },
        files: [
            '!{dist,.gitignore,.vscode,docs,dev-app-update.yml,.travis.yml,.nvmrc,.eslintrc.json,build.js,.github,.nsis}'
        ],
        extraResources: [
            'libraries'
        ],
        asar: true
    }
}).then(() => {
    console.log('Build complete!')
}).catch(err => {
    console.error('Error during build!', err)
})
