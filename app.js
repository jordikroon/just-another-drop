'use strict';

const { app, BrowserWindow, globalShortcut } = require('electron');
const AutoLaunch = require('auto-launch');

const Context = require('./src/initializers/context');
const Keybind = require('./src/initializers/keybind');
const WindowManager = require('./src/initializers/windowManager');
const binders = require('./src/binder/index');
const Preferences = require('./src/config/preferences');

const instanceLock = app.requestSingleInstanceLock();
if (!instanceLock) {
    app.quit();
}

const autoLauncher = new AutoLaunch({
    name: 'Just Another Drop',
});

app.setAppUserModelId('Just Another Drop');

app.whenReady().then(() => {
    registerAutoStart();

    const windowManager = new WindowManager();
    const baseWindow = new BrowserWindow({ show: false });
    windowManager.register(baseWindow);

    const context = new Context(app, windowManager);
    const keybind = new Keybind(app, windowManager);

    app.on('settings-opened', () => {
        globalShortcut.unregisterAll();
    });

    app.on('settings-closed', () => {
        context.build(binders);
        keybind.register(binders);
        registerAutoStart();
    });

    context.build(binders);
    keybind.register(binders);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

async function registerAutoStart() {
    try {
        const isEnabled = await autoLauncher.isEnabled();
        if (!isEnabled && Preferences.value('general.autostart')) {
            console.log('Marked enabled');
            autoLauncher.enable();
        }

        if (isEnabled && !Preferences.value('general.autostart')) {
            autoLauncher.disable();
        }
    } catch (error) {
        return;
    }
}