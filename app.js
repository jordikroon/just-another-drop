'use strict';

import { app, BrowserWindow, globalShortcut } from 'electron';

import Context from './src/initializers/context';
import Keybind from'./src/initializers/keybind';
import WindowManager from './src/initializers/windowManager';
import binders from './src/binder/index';

const instanceLock = app.requestSingleInstanceLock();
if (!instanceLock) {
    app.quit();
}

app.setAppUserModelId('Just Another Drop');

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