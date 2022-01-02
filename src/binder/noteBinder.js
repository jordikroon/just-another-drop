'use strict';

const Preferences = require('../config/preferences');
const Note = require('../initializers/note');

const notesBinder = {
    identifier: 'note',
    name: 'Note',
    defaultKeyBind: Preferences.value('bindings.notes'),
    onActivate: async (app, windowManager) => {
        await new Note(app, windowManager).initialize();
    },
};

Preferences.on('save', (preferences) => {
    notesBinder.defaultKeyBind = preferences.bindings.notes;
});

module.exports = notesBinder;