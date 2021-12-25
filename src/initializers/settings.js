'use strict';

const Preferences = require('./../config/preferences');

class Settings {
    constructor(app, windowManager) {
        this.windowManager = windowManager;
		this.app = app;
		this.settingsWindow = null;
    }

    initializeWindow() {
        this.app.emit('settings-opened');
        Preferences.show();

        Preferences.prefsWindow.on('closed', () => {
            this.app.emit('settings-closed');
        });
    }
}

module.exports = Settings;
