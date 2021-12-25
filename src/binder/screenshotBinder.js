'use strict';

const Screenshot = require('../initializers/screenshot');
const Preferences = require('../config/preferences');
const sharp = require('sharp');

function _sliceImage(image, slice) {
    const imageBuffer = Buffer.from(image, 'base64');
    sharp(imageBuffer).extract(slice).toBuffer()
        .then(info => {
            console.log(info)
        })
        .catch(err => {
            console.log(err)
        });
}

const screenshotBinder = {
    identifier: 'screenshot',
    name: 'Screenshot',
    defaultKeyBind: Preferences.value('bindings.screenshot'),
    onActivate: (app, windowManager) => {
        new Screenshot(app, windowManager).makeFromDesktop((image, slice) => {
            _sliceImage(image, slice);
        });
    },
};

Preferences.on('save', (preferences) => {
    screenshotBinder.defaultKeyBind = preferences.bindings.screenshot;
});

module.exports = screenshotBinder;