'use strict';
const Preferences = require('../config/preferences');
const Screenshot = require('../initializers/screenshot');

const clipboardBinder = {
    identifier: 'clipboard',
    name: 'Clipboard',
    defaultKeyBind: Preferences.value('bindings.clipboard'),
    onActivate: async (app, windowManager) => {
        await new Screenshot(app, windowManager).makeFromClipboard();
    },
};

Preferences.on('save', (preferences) => {
    clipboardBinder.defaultKeyBind = preferences.bindings.clipboard;
});

module.exports = clipboardBinder;