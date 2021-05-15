/**
 * Script for login.ejs
 */


// Validation Regexes.
const validUsername         = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

let loginWindow

// Login Elements
const microsoftLoginButton  = document.getElementById('MicrosoftLoginButton')
const checkmarkContainer    = document.getElementById('checkmarkContainer')
const loginRememberOption   = document.getElementById('loginRememberOption')
const loginButton           = document.getElementById('loginButton')
const loginForm             = document.getElementById('loginForm')

// Control variables.
let lu = false, lp = false

const loggerLogin = LoggerUtil('%c[Login]', 'color: #000668; font-weight: bold')


/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validateEmail(value){
    if(value){
        if(!basicEmail.test(value) && !validUsername.test(value)){
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
            loginDisabled(true)
            lu = false
        } else {
            lu = true
            if(lp){
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(Lang.queryJS('login.error.requiredValue'))
        loginDisabled(true)
    }
}

/**
 * Validate that the password field is not empty.
 * 
 * @param {string} value The password value.
 */
function validatePassword(value){
    if(value){
        lp = true
        if(lu){
            loginDisabled(false)
        }
    } else {
        lp = false
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'))
        loginDisabled(true)
    }
}


/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v){
    if(loginButton.disabled !== v){
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v){
    if(v){
        loginButton.setAttribute('loading', v)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.login'), Lang.queryJS('login.loggingIn'))
    } else {
        loginButton.removeAttribute('loading')
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v){
    loginDisabled(v)
    if(v){
        checkmarkContainer.setAttribute('disabled', v)
    } else {
        checkmarkContainer.removeAttribute('disabled')
    }
    loginRememberOption.disabled = v
}

/**
 * Parses an error and returns a user-friendly title and description
 * for our error overlay.
 * 
 * @param {Error | {cause: string, error: string, errorMessage: string}} err A Node.js
 * error or Mojang error response.
 */
function resolveError(err){
    // Mojang Response => err.cause | err.error | err.errorMessage
    // Node error => err.code | err.message
    if(err.cause != null && err.cause === 'UserMigratedException') {
        return {
            title: Lang.queryJS('login.error.userMigrated.title'),
            desc: Lang.queryJS('login.error.userMigrated.desc')
        }
    } else {
        if(err.error != null){
            if(err.error === 'ForbiddenOperationException'){
                if(err.errorMessage != null){
                    if(err.errorMessage === 'Invalid credentials. Invalid username or password.'){
                        return {
                            title: Lang.queryJS('login.error.invalidCredentials.title'),
                            desc: Lang.queryJS('login.error.invalidCredentials.desc')
                        }
                    } else if(err.errorMessage === 'Invalid credentials.'){
                        return {
                            title: Lang.queryJS('login.error.rateLimit.title'),
                            desc: Lang.queryJS('login.error.rateLimit.desc')
                        }
                    }
                }
            }
        } else {
            // Request errors (from Node).
            if(err.code != null){
                if(err.code === 'ENOENT'){
                    // No Internet.
                    return {
                        title: Lang.queryJS('login.error.noInternet.title'),
                        desc: Lang.queryJS('login.error.noInternet.desc')
                    }
                } else if(err.code === 'ENOTFOUND'){
                    // Could not reach server.
                    return {
                        title: Lang.queryJS('login.error.authDown.title'),
                        desc: Lang.queryJS('login.error.authDown.desc')
                    }
                }
            }
        }
    }
    if(err.message != null){
        if(err.message === 'NotPaidAccount'){
            return {
                title: Lang.queryJS('login.error.notPaid.title'),
                desc: Lang.queryJS('login.error.notPaid.desc')
            }
        } else {
            // Unknown error with request.
            return {
                title: Lang.queryJS('login.error.unknown.title'),
                desc: err.message
            }
        }
    } else {
        // Unknown Mojang error.
        return {
            title: err.error,
            desc: err.errorMessage
        }
    }
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

function loginCancelEnabled(val){
    if(val){
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
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

    return path.join(__dirname, 'assets', 'images', `${filename}.${ext}`)
}

function XboxLiveError(XErr) {

    let msgString = 'Something went wrong connecting to Xbox Live services. Please try again later.'

    if(XErr === 2148916233) {
        msgString = 'Your Microsoft account is yet to become an Xbox account. Sign in with Microsoft at minecraft.net to create one.'
    } else if (XErr === 2148916238) {
        msgString = 'It seems that this account belongs to a minor. Ask an adult to add your account to a Family.'
    } else if (XErr === 111555) {
        msgString = 'Your account does not seem to own Minecraft: Java Edition'
    }


    setOverlayContent(
        'Xbox Live Authentication Error',
        msgString,
        'Okay'
    )
    setOverlayHandler(null)
    toggleOverlay(true)

}

async function handleAuthProcedures(initialLink) {
    let link = initialLink
    link = link + '&process=true'

    let RpsToken = await got.post(link, {
        throwHttpErrors: false
    })

    console.log(RpsToken.body)

    RpsToken = JSON.parse(RpsToken.body)['Ticket']


    let XboxXBLAuth = await got.post('https://user.auth.xboxlive.com/user/authenticate', {
        headers: {
            'Content-Type': 'application/json',
            'Accept' : 'application/json'
        },
        throwHttpErrors: false,
        body: '{\n' +
            '    "RelyingParty": "http://auth.xboxlive.com",\n' +
            '    "TokenType": "JWT",\n' +
            '    "Properties": {\n' +
            '        "AuthMethod": "RPS",\n' +
            '        "SiteName": "user.auth.xboxlive.com",\n' +
            `        "RpsTicket": "d=${RpsToken}"\n` +
            '    }\n' +
            '}'
    })
    if(XboxXBLAuth.statusCode !== 200) {
        XboxLiveError(undefined)
        return
    }

    let xblResponse = JSON.parse(XboxXBLAuth.body)
    let token = xblResponse['Token']
    let uhs =  xblResponse.DisplayClaims.xui[0].uhs

    let XboxXSTSAuth = await got.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        body: ' {\n' +
            '    "Properties": {\n' +
            '        "SandboxId": "RETAIL",\n' +
            '        "UserTokens": [\n' +
            `            "${token}"\n` +
            '        ]\n' +
            '    },\n' +
            '    "RelyingParty": "rp://api.minecraftservices.com/",\n' +
            '    "TokenType": "JWT"\n' +
            ' }',
        throwHttpErrors: false
    })
    if(XboxXSTSAuth.statusCode !== 200) {
        if(XboxXSTSAuth.statusCode === 401) {
            let XSTSResponse = JSON.parse(XboxXSTSAuth.body)
            if(XSTSResponse['XErr'] !== undefined) {
                XboxLiveError(XSTSResponse['XErr'])
                return
            } else {
                XboxLiveError(undefined)
                return
            }
        }
    }
    let XSTSResponse = JSON.parse(XboxXSTSAuth.body)
    let XSTSToken = XSTSResponse['Token']

    let minecraftXboxLogin = await got.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        body: '{\n' +
            `    "identityToken": "XBL3.0 x=${uhs};${XSTSToken}"\n` +
            '}',
        throwHttpErrors: false
    })

    if(minecraftXboxLogin.statusCode !== 200) {
        XboxLiveError(XSTSResponse['XErr'])
        return
    }

    let mcXboxToken = JSON.parse(minecraftXboxLogin.body)['access_token']

    let minecraftOwnership = await got('https://api.minecraftservices.com/entitlements/mcstore', {
        headers: {
            Authorization: `Bearer ${mcXboxToken}`
        },
        throwHttpErrors: false
    })

    if(minecraftOwnership.statusCode !== 200) {
        XboxLiveError(undefined)
        return
    }

    let minecraftOwnershipData = JSON.parse(minecraftOwnership.body).items

    let minecraftOwnershipConfirmation1 = false
    let minecraftOwnershipConfirmation2 = false

    minecraftOwnershipData.forEach(value => {
        if(value.name === 'product_minecraft') {
            minecraftOwnershipConfirmation1 = true
        }
        if(value.name === 'game_minecraft') {
            minecraftOwnershipConfirmation2 = true
        }
    })

    console.log('Caca')

    if(minecraftOwnershipConfirmation2 && minecraftOwnershipConfirmation1) {
        let minecraftProfile = await got('https://api.minecraftservices.com/minecraft/profile', {
            headers: {
                Authorization: `Bearer ${mcXboxToken}`
            }
        })
        if(minecraftProfile.statusCode !== 200) {
            let minecraftProfileData = JSON.parse(minecraftProfile.body)
            let minecraftUsername = minecraftProfileData.name
            let minecraftUUID = minecraftProfileData.id
        }
    } else {
        XboxLiveError(111555)
    }


    microsoftLoginButton.disabled = true

}


microsoftLoginButton.addEventListener('click', async () => {
    const elec = require('electron')

    if(loginWindow !== undefined) {
        if (!loginWindow.isDestroyed()) {
            return
        }
    }

    console.log(getPlatformIcon('SealCircle'))

    loginWindow = new elec.remote.BrowserWindow({
        width: 450,
        height: 600,
        frame: true,
        movable: false,
        minimizable: false,
        parent: elec.remote.getCurrentWindow(),
        fullscreenable: false,
        modal: true,
        title: 'Microsoft Login',
        icon: getPlatformIcon('SealCircle'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            worldSafeExecuteJavaScript: true
        },
    })

    loginWindow.setMenu(null)
    loginWindow.resizable = false

    try {
        await loginWindow.loadURL('https://login.live.com/oauth20_authorize.srf%20?client_id=34be85e8-151d-45f2-8241-3954da296908%20&response_type=code&redirect_uri=https%3A%2F%2Fsongs-of-war.com%2Fxbox%2Fauthenticate.php%20&scope=XboxLive.signin Xboxlive.offline_access')
    } catch(e) {
        loginWindow.destroy()
        setOverlayContent('An error occurred', 'An error occurred while trying to contact Microsoft servers, check your internet connection and try again.', 'Ok')
        setOverlayHandler(null)
        toggleOverlay(true)

        return
    }

    let URLUpdateEvent = loginWindow.webContents.on('update-target-url', () => {
        if(loginWindow.webContents.getURL().startsWith('https://songs-of-war.com/xbox/authenticate.php')) {
        }
    })

    let FinishLoadingEvent = loginWindow.webContents.on('did-finish-load', async () => {
        if(loginWindow.webContents.getURL().startsWith('https://songs-of-war.com/xbox/authenticate.php')) {

            handleAuthProcedures(loginWindow.webContents.getURL())
            loginWindow.webContents.removeAllListeners()
            loginWindow.destroy()


        }
    })

})






// Disable default form behavior.
loginForm.onsubmit = () => { return false }

// Bind login button behavior.
loginButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    AuthManager.addAccount(loginUsername.value, loginPassword.value).then((value) => {
        updateSelectedAccount(value)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if(loginViewOnSuccess === VIEWS.settings){
                    prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch((err) => {
        loginLoading(false)
        const errF = resolveError(err)
        setOverlayContent(errF.title, errF.desc, Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
        loggerLogin.log('Error while logging in.', err)
    })

})