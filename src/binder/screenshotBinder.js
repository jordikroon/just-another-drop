'use strict';

const Screenshot = require('../initializers/screenshot');
const Preferences = require('../config/preferences');

const screenshotBinder = {
    identifier: 'screenshot',
    name: 'Screenshot',
    defaultKeyBind: Preferences.value('bindings.screenshot'),
    onActivate: (app, windowManager) => {
        new Screenshot(app, windowManager).makeFromDesktop();
    },
};

Preferences.on('save', (preferences) => {
    screenshotBinder.defaultKeyBind = preferences.bindings.screenshot;
});

module.exports = screenshotBinder;