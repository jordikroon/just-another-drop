'use strict';

const { BrowserWindow, globalShortcut, desktopCapturer, screen, ipcMain } = require('electron');
const sharp = require('sharp');
const FormData = require('form-data');
const { Readable } = require('stream');

// TODO: https://stackoverflow.com/questions/63644840/electron-upload-with-progress
const IPC_CHANNEL_NAME = 'screenshot';

class Screenshot {
    constructor(app, windowManager) {
        this.windowManager = windowManager;
        this.screenshotWindow = null;
        this.eventsConfigured = false;
        this.screenshotMap = [];
        this.app = app;
        this.generatingScreenshotForScreen = null;

    }

    makeFromDesktop(onScreenshotTaken) {
        const { getCursorScreenPoint, getDisplayNearestPoint } = screen
        this.generatingScreenshotForScreen = getDisplayNearestPoint(getCursorScreenPoint())
        const { width, height } = this.generatingScreenshotForScreen.size;

        this._fullscreenScreenshot(() => {
            this.screenshotWindow = new BrowserWindow({
                width,
                height,
                fullscreen: true,
                alwaysOnTop: false,
                kiosk: true,
                frame: false,
                skipTaskbar: true,
                transparent: true,
                show: false,
                backgroundColor: '#2e2c29',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                }
            });

            this.screenshotWindow.webContents.openDevTools();
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
        const { width, height } = this.generatingScreenshotForScreen.size;

        const screenshotMap = {};
        desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: width, height: height }
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

            this._onScreenshotTaken(
                data.data.image.replace('data:image/png;base64,', ''),
                data.data.dimensions,
            );
        }
    }

    async _onScreenshotTaken(image, slice) {
        let imageBuffer = Buffer.from(image, 'base64');

        if (slice) {
            imageBuffer = await sharp(imageBuffer).extract(slice).toBuffer()
        }

        await this._uploadToRest(imageBuffer);
    }

    async _uploadToRest(imageBuffer) {
        const formData = new FormData();
        const stream = new Readable({
            read() {
                this.push(imageBuffer);
            },
        })

        formData.append('file', stream, 'screenshot.jpg');
    }
}

module.exports = Screenshot;
