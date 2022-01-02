'use strict';

const { BrowserWindow, globalShortcut, desktopCapturer, screen, ipcMain, Notification, shell, clipboard, nativeImage } = require('electron');
const sharp = require('sharp');
const needle = require('needle');
const Preferences = require('../config/preferences');
const { nanoid } = require('nanoid');

const AWS = require('aws-sdk');

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

    makeFromDesktop() {
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

    makeFromClipboard() {
        const nativeImage = clipboard.readImage();
        if (nativeImage.isEmpty()) {
            const notification = new Notification({
                title: 'Screenshot upload failed',
                body: 'No image exists on your clipboard',
            });
            notification.show();
            return;
        }

        const imageBuffer = nativeImage.toJPEG(100);
        this._onScreenshotTaken(
            imageBuffer,
        );
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
                Buffer.from(data.data.image.replace('data:image/png;base64,', ''), 'base64'),
                data.data.dimensions,
            );
        }
    }

    async _onScreenshotTaken(imageBuffer, slice) {
        if (slice) {
            imageBuffer = await sharp(imageBuffer).extract(slice).toBuffer()
        }

        let uploadResult;

        if (Preferences.value('screenshots.provider') === 'rest') {
            uploadResult = await this._uploadToRest(imageBuffer);
        } else if (Preferences.value('screenshots.provider') === 'aws') {
            uploadResult = await this._uploadToAws(imageBuffer);
        } else {
            uploadResult = await this._uploadFallback();
        }

        const notification = new Notification({
            title: uploadResult.uploaded || uploadResult.fallback ? 'Screenshot uploaded' : 'Screenshot upload failed',
            body: uploadResult.response,
        });

        notification.show();

        const clipboardData = {
            bookmark: 'Just Another Drop',
            image: nativeImage.createFromBuffer(imageBuffer),
        };

        if (uploadResult.uploaded) {
            clipboardData.text = uploadResult.response;
            notification.on('click', () => {
                shell.openExternal(uploadResult.response);
            });
        }

        clipboard.write(clipboardData);
    }

    async _uploadToRest(imageBuffer) {
        if (
            !Preferences.value('screenshots.restUploadPath')
        ) {
            return {
                uploaded: false,
                response: 'REST provider is not (correctly) configured.'
            };
        }

        const data = {
            image: { buffer: imageBuffer, content_type: 'image/jpeg' }
        }

        try {
            const response = await needle('post', Preferences.value('screenshots.restUploadPath'), data, { multipart: true });
            return {
                uploaded: true,
                response: response.body.url
            };
        } catch (error) {
            return {
                uploaded: false,
                response: error.message
            };
        }
    }

    async _uploadToAws(imageBuffer) {
        if (
            !Preferences.value('screenshots.awsAccessKeyId')
            || !Preferences.value('screenshots.awsSecretAccessKey')
            || !Preferences.value('screenshots.awsBaseUrl')
            || !Preferences.value('screenshots.awsS3Bucket')
        ) {
            return {
                uploaded: false,
                response: 'AWS provider is not (correctly) configured.'
            };
        }

        const s3 = new AWS.S3({
            accessKeyId: Preferences.value('screenshots.awsAccessKeyId'),
            secretAccessKey: Preferences.value('screenshots.awsSecretAccessKey')
        });

        try {
            const fileName = nanoid(8) + '.jpg';
            const fileUrl = Preferences.value('screenshots.awsBaseUrl').replace(/\/$/, '') + '/' + fileName;
            await s3.upload(
                {
                    Bucket: Preferences.value('screenshots.awsS3Bucket'),
                    Key: fileName,
                    ContentType: 'image/jpeg',
                    Body: imageBuffer
                }
            ).promise();

            return {
                uploaded: true,
                response: fileUrl
            };
        } catch (error) {
            return {
                uploaded: false,
                response: error.message
            };
        }
    }

    async _uploadFallback() {
        return {
            uploaded: false,
            fallback: true,
            response: 'Image copied to clipboard.'
        };
    }
}

module.exports = Screenshot;
