'use strict';

const { getFilePath } = require('../helpers/path');
const { Menu, Tray } = require('electron');

class Context {
    constructor(app, windowManager) {
        this.app = app;
        this.windowManager = windowManager;
        this.tray = null;
    }

    build(binders) {
        this.tray = new Tray(getFilePath(process.cwd(), 'resources', 'icons', 'icon.png'));
        const contextMenu = Menu.buildFromTemplate(
            binders.map((binder) => {
                return {
                    label: binder.name,
                    accelerator: binder.defaultKeyBind || null,
                    type: binder.type || null,
                    role: binder.role || null,
                    click: () => {
                        binder.onActivate(this.app, this.windowManager)
                    }
                }
            })
        );

        this.tray.setToolTip('Just another Drop');
        this.tray.setContextMenu(contextMenu);
    }
}

module.exports = Context;