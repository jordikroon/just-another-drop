'use strict';

const { app, BrowserWindow, globalShortcut } = require('electron');

const Context = require('./src/initializers/context');
const Keybind = require('./src/initializers/keybind');
const WindowManager = require('./src/initializers/windowManager');
const binders = require('./src/binder/index');

app.whenReady().then(() => {
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
    });

    context.build(binders);
    keybind.register(binders);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});