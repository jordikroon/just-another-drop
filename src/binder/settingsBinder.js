'use strict';

const Settings = require('../initializers/settings');

module.exports = {
    identifier: 'settings',
    name: 'Settings',
    enabled: true,
    onActivate: (app, windowManager) => {
        new Settings(app, windowManager).initializeWindow();
    },
}