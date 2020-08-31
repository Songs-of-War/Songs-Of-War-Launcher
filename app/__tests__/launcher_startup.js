/* eslint-disable no-undef */
// Eslint complains for no reason here, so, disable the check for the entire file
const Application = require('spectron').Application
const electronPath = require('electron')
const path = require('path')

let app

beforeAll(() => {
    jest.setTimeout(15000)
    app = new Application({
        path: electronPath,

        args: [path.join('./')]
    })

    return app.start()
}, 15000)

afterAll(function () {
    if (app && app.isRunning()) {
        return app.stop()
    }
})

test('Displays App window', async function () {
    let windowCount = await app.client.getWindowCount()

    expect(windowCount).toBe(1)
})