'use strict';

const { app, BrowserWindow, globalShortcut } = require('electron');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const Context = require('./src/initializers/context');
const Keybind = require('./src/initializers/keybind');
const WindowManager = require('./src/initializers/windowManager');
const binders = require('./src/binder/index');
const Preferences = require('./src/config/preferences');

const unhandled = require('electron-unhandled');
unhandled();

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const instanceLock = app.requestSingleInstanceLock();
if (!instanceLock) {
    app.quit();
}

const autoLauncher = new AutoLaunch({
    name: 'Just Another Drop',
});

app.setAppUserModelId('Just Another Drop');

app.whenReady().then(() => {
    app.updateCheckState = 'latest';

    autoUpdater.checkForUpdatesAndNotify();

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

    autoUpdater.on('checking-for-update', () => {
        app.updateCheckState = 'check';
        context.build(binders);
    });

    autoUpdater.on('update-available', (info) => {
        app.updateCheckState = 'available';
        context.build(binders);
    })
    autoUpdater.on('update-not-available', (info) => {
        app.updateCheckState = 'latest';
        context.build(binders);
    })

    autoUpdater.on('update-downloaded', () => {
        app.updateCheckState = 'available';
        context.build(binders);
    });

    context.build(binders);
    keybind.register(binders);
    registerAutoStart();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

async function registerAutoStart() {
    try {
        const isEnabled = await autoLauncher.isEnabled();
        if (!isEnabled && Preferences.value('general.autostart')) {
            autoLauncher.enable();
        }

        if (isEnabled && !Preferences.value('general.autostart')) {
            autoLauncher.disable();
        }
    } catch (error) {
    console.log(error);
        return;
    }
}