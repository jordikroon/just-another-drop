'use strict';

const { getFilePath } = require('../helpers/path');
const { Menu, Tray, app } = require('electron');

class Context {
    constructor(app, windowManager) {
        this.app = app;
        this.windowManager = windowManager;
        this.tray = new Tray(getFilePath(__dirname, 'resources', 'icons', 'icon.png'));
    }

    build(binders) {
        const contextMenu = Menu.buildFromTemplate(
            binders.map((binder) => {
                if (binder.identifier === 'update') {
                    binder = this._rewriteUpdateBinder(binder);
                }

                return {
                    label: binder.name,
                    accelerator: binder.defaultKeyBind || null,
                    type: binder.type || null,
                    role: binder.role || null,
                    enabled: binder.enabled || false,
                    click: () => {
                        binder.onActivate(this.app, this.windowManager)
                    }
                }
            })
        );

        this.tray.setToolTip('Just another Drop');
        this.tray.setContextMenu(contextMenu);
    }

    _rewriteUpdateBinder(binder) {
        binder.name = 'Latest version: v' + app.getVersion();
        if (app.updateCheckState === 'available') {
            binder.name = 'Update available (Will install on quit!)';
        }

        if (app.updateCheckState === 'check') {
            binder.name = 'Checking for updates..';
        }

        return binder;
    }
}

module.exports = Context;