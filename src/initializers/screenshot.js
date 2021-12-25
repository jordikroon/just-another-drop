'use strict';

const { BrowserWindow, globalShortcut, desktopCapturer, screen, ipcMain } = require('electron');
const IPC_CHANNEL_NAME = 'main';

class Screenshot {
    constructor(app, windowManager) {
        this.windowManager = windowManager;
        this.screenshotWindow = null;
        this.eventsConfigured = false;
        this.screenshotMap = [];
        this.app = app;
        this.onScreenshotTaken = null;
    }

    makeFromDesktop(onScreenshotTaken) {
        this.onScreenshotTaken = onScreenshotTaken;

        this._fullscreenScreenshot(() => {
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            this.screenshotWindow = new BrowserWindow({
                width,
                height,
                fullscreen: true,
                alwaysOnTop: false,
                kiosk: true,
                frame: false,
                skipTaskbar: true,
                transparent: true,
                show: true,
                backgroundColor: '#2e2c29',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                }
            });
            this.screenshotWindow.loadURL(`file://${__dirname}/../screens/screenshot.html`);
            this.screenshotWindow.on('ready-to-show', () => {
                this.screenshotWindow.webContents.executeJavaScript(
                    `init('${this.screenshotMap['Entire Screen']}')`
                );
            });

            this.screenshotWindow.on('closed', () => {
                this.windowManager.unregister(this.screenshotWindow);
                this.screenshotWindow = null;
                delete this.screenshotWindow;
            });

            this.windowManager.register(this.screenshotWindow);

            this._registerEvents();
        });
    }

    _fullscreenScreenshot(callback) {
        const screenshotMap = {};
        desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 3440, height: 1440 }
        }).then(sources => {
            for (const source of sources) {
                if (source.display_id) {
                    screenshotMap[source.name] = sources[0].thumbnail.toDataURL()
                }
            }

            this.screenshotMap = screenshotMap;
            callback();
        });
    }

    _closeWindow() {
        this._deRegisterEvents();
        this.screenshotWindow.close();
        globalShortcut.unregister('Escape');
    }

    _registerEvents() {
        if (this.eventsConfigured) {
            return;
        }

        this.eventsConfigured = true;

        globalShortcut.register('Escape', () => {
            this._closeWindow();
        });

        ipcMain.on(IPC_CHANNEL_NAME, this._onIpcMessage.bind(this));
    }

    _deRegisterEvents() {
        if (!this.eventsConfigured) {
            return;
        }
        this.eventsConfigured = false;

        globalShortcut.unregister('Escape');

        ipcMain.off(IPC_CHANNEL_NAME, this._onIpcMessage.bind(this));
    }

    _onIpcMessage(event, jsonData) {
        if (!this.eventsConfigured) {
            return;
        }

        const data = JSON.parse(jsonData);
        if (data.event === 'image_loaded') {
            this.screenshotWindow.show();
        }

        if (data.event === 'screenshot_finish') {
           this._closeWindow();

            this.onScreenshotTaken(
                this.screenshotMap['Entire Screen'].replace('data:image/png;base64,', ''),
                data.data,
            );
        }
    }
}

module.exports = Screenshot;
