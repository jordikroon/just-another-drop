const remote = require('@electron/remote');
const { ipcRenderer } = require('electron');

const win = remote.getCurrentWindow();
const CHANNEL_NAME = 'note';

const editor = ace.edit('editor');
const modelist = ace.require('ace/ext/modelist');

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        handleWindowControls();
    }
};

window.onbeforeunload = () => {
    win.removeAllListeners();
}

editor.setTheme('ace/theme/dracula');
editor.session.setMode('ace/mode/text');
editor.session.setUseSoftTabs(true);
editor.setHighlightActiveLine(true);
editor.session.setTabSize(4);
editor.session.on('change', onChangeEditor);

editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
    hScrollBarAlwaysVisible: false,
    vScrollBarAlwaysVisible: false,
});

function handleWindowControls() {
    document.querySelector('#min-button').addEventListener('click', event => {
        win.minimize();
    });

    document.querySelector('#max-button').addEventListener('click', event => {
        win.maximize();
    });

    document.querySelector('#restore-button').addEventListener('click', event => {
        win.unmaximize();
    });

    document.querySelector('#close-button').addEventListener('click', event => {
        ipcRenderer.send(CHANNEL_NAME, JSON.stringify({
            event: 'close',
        }));
    });

    document.querySelector('input').addEventListener('change', onChangeFileName);
    document.querySelector('input').addEventListener('blur', onChangeFileName);
    document.querySelector('input').addEventListener('keyup', onChangeFileName);

    document.querySelector('button').addEventListener('click', event => {
        ipcRenderer.send(CHANNEL_NAME, JSON.stringify({
            event: 'upload',
            data: {
                fileName: document.querySelector('input').value,
                content: editor.getValue(),
            },
        }));
    });

    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);
}

function toggleMaxRestoreButtons() {
    if (win.isMaximized()) {
        document.body.classList.add('maximized');
    } else {
        document.body.classList.remove('maximized');
    }
}

function onChangeFileName(event) {
    event.stopPropagation();
    document.querySelector('button').disabled = !document.querySelector('input').value || !editor.getValue();
    editor.session.setMode(modelist.getModeForPath(document.querySelector('input').value).mode);
}

function onChangeEditor() {
    document.querySelector('button').disabled = !document.querySelector('input').value || !editor.getValue();
}