'use strict';

const path = require('path');

const getFilePath = (...pathArray) => {
    let pathString = '';
    for (const pathItem of pathArray) {
        if (pathString) {
            pathString += path.sep;
        }

        pathString += pathItem;
    }

    return pathString;
};

module.exports = {
    getFilePath,
};
