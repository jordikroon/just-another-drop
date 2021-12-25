'use strict';


class WindowManager {
    constructor() {
        this.windows = new Set();
    }

    register(window) {
        this.windows.add(window);
    }

    unregister(window) {
        this.windows.delete(window);
    }
}

module.exports = WindowManager;