'use strict';

const Settings = require('../initializers/settings');

module.exports = {
    identifier: 'settings',
    name: 'Settings',
    onActivate: (app, windowManager) => {
        new Settings(app, windowManager).initializeWindow();
    },
}