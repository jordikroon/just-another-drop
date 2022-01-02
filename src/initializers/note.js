'use strict';

const electronRemote = require('@electron/remote/main');
const { BrowserWindow, ipcMain, Notification, shell } = require('electron');
const Github = require('github-api');
const Preferences = require('../config/preferences');

electronRemote.initialize();

const IPC_CHANNEL_NAME = 'note';

class Note {
    constructor(app, windowManager) {
        this.windowManager = windowManager;
        this.noteWindow = null;
        this.eventsConfigured = false;
        this.app = app;
    }

    initialize() {
        this.noteWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            alwaysOnTop: false,
            frame: false,
            skipTaskbar: true,
            show: true,
            backgroundColor: '#2e2c29',
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        });

        electronRemote.enable(this.noteWindow.webContents);
        this.noteWindow.loadURL(`file://${__dirname}/../screens/note.html`);

        this.noteWindow.on('closed', () => {
            this.windowManager.unregister(this.noteWindow);
            this.noteWindow = null;
            delete this.noteWindow;
        });

        this.windowManager.register(this.noteWindow);

        this._registerEvents();
    }

    _closeWindow() {
        this._deRegisterEvents();
        this.noteWindow.close();
    }

    _registerEvents() {
        if (this.eventsConfigured) {
            return;
        }

        this.eventsConfigured = true;

        ipcMain.on(IPC_CHANNEL_NAME, this._onIpcMessage.bind(this));
    }

    _deRegisterEvents() {
        if (!this.eventsConfigured) {
            return;
        }
        this.eventsConfigured = false;

        ipcMain.off(IPC_CHANNEL_NAME, this._onIpcMessage.bind(this));
    }

    _onIpcMessage(event, jsonData) {
        if (!this.eventsConfigured) {
            return;
        }

        const data = JSON.parse(jsonData);

        if (data.event === 'upload') {
            this._uploadGist(data.data);
        }

        if (data.event === 'close' || data.event === 'upload') {
            this._closeWindow();
        }
    }

    _uploadGist(data) {
        const gist = new Github({
            token: Preferences.value('notes.gistAuthKey')
        }).getGist();

        gist.create({
            public: false,
            description: 'Uploaded by Just Another Drop',
            files: {
                [data.fileName]: {
                    content: data.content
                }
            }
        }).then(({ data }) => {
            const notification = new Notification({
                title: 'Note uploaded to Gist',
                body: data.html_url,
            });

            notification.show();

            notification.on('click', () => {
                shell.openExternal(data.html_url);
            });
        }).catch((error) => {
            new Notification({
                title: 'Error uploading note to Gist',
                body: error.message,
            }).show();
        });
    }
}

module.exports = Note;
