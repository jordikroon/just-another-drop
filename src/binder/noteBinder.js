'use strict';

const Preferences = require('../config/preferences');
const Screenshot = require('../initializers/screenshot');

const notesBinder = {
    identifier: 'note',
    name: 'Note',
    defaultKeyBind: Preferences.value('bindings.notes'),
    onActivate: async (app, windowManager) => {
        await new Screenshot(app, windowManager).makeFromDesktop();
    },
};

Preferences.on('save', (preferences) => {
    notesBinder.defaultKeyBind = preferences.bindings.notes;
});

module.exports = notesBinder;