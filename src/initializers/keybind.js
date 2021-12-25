'use strict';

const { globalShortcut } = require('electron');

class Keybind {
    constructor(app, windowManager) {
        this.app = app;
        this.windowManager = windowManager;
    }

    register(binders) {
        globalShortcut.unregisterAll();

        for (const binder of binders) {
            if (binder.defaultKeyBind && typeof binder.onActivate === 'function') {
                globalShortcut.register(binder.defaultKeyBind, () => {
                    binder.onActivate(this.app, this.windowManager)
                });
            }
        }
    }
}

module.exports = Keybind;