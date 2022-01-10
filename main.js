'use strict';

const { app, screen, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');
const jsonfile = require('jsonfile');
const mkdirp = require('mkdirp');
const url = require('url');
const { serve } = require('diagnostic-server');

function onReady() {
    let state;
    let win;
    let stateChangeTimer;
    const eventHandlingDelay = 1000;

    const config = {
        file: 'user-pref.json',
        path: app.getPath('userData')
    };
    const fullStoreFileName = path.join(config.path, config.file);

    // Load the previous state with fallback to defaults
    // Load previous state
    try {
        state = jsonfile.readFileSync(fullStoreFileName);
        // console.log('state loaded from ', fullStoreFileName, state);
    } catch (err) {
        // Don't care
        console.log('Error loading state', err);
    }

    function isNormal() {
        return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
    }

    function hasBounds() {
        return state &&
            Number.isInteger(state.x) &&
            Number.isInteger(state.y) &&
            Number.isInteger(state.width) && state.width > 0 &&
            Number.isInteger(state.height) && state.height > 0;
    }

    function resetStateToDefault() {
        const displayBounds = screen.getPrimaryDisplay().bounds;

        // Reset state to default values on the primary display
        state = {
            width: config.defaultWidth || 800,
            height: config.defaultHeight || 600,
            x: 0,
            y: 0,
            displayBounds
        };
    }

    function windowWithinBounds(bounds) {
        return (
            state.x >= bounds.x &&
            state.y >= bounds.y &&
            state.x + state.width <= bounds.x + bounds.width &&
            state.y + state.height <= bounds.y + bounds.height
        );
    }

    function ensureWindowVisibleOnSomeDisplay() {
        const visible = screen.getAllDisplays().some(display => {
            return windowWithinBounds(display.bounds);
        });

        if (!visible) {
            // Window is partially or fully not visible now.
            // Reset it to safe defaults.
            return resetStateToDefault();
        }
    }

    function validateState() {
        const isValid = state && (hasBounds() || state.isMaximized || state.isFullScreen);
        if (!isValid) {
            state = null;
            return;
        }

        if (hasBounds() && state.displayBounds) {
            ensureWindowVisibleOnSomeDisplay();
        }
    }

    function saveState() {
        // Save state
        try {
            const winBounds = win.getBounds();
            state = state || {};
            if (isNormal()) {
                state.x = winBounds.x;
                state.y = winBounds.y;
                state.width = winBounds.width;
                state.height = winBounds.height;
            }
            state.isMaximized = win.isMaximized();
            state.isFullScreen = win.isFullScreen();
            state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
            state.zoomFactor = win.webContents.getZoomFactor();

            mkdirp.sync(path.dirname(fullStoreFileName));
            jsonfile.writeFileSync(fullStoreFileName, state);
            console.info('State saved in', fullStoreFileName, state);
        } catch (err) {
            console.error('Error saving state', err);
        }
    }

    function stateChangeHandler() {
        // Handles both 'resize' and 'move'
        clearTimeout(stateChangeTimer);
        stateChangeTimer = setTimeout(saveState, eventHandlingDelay);
    }

    function zoomChangeHandler(_event, zoomDirection) {
        const zoom = (zoomIn) => {
            var step = zoomIn ? 1 : -1;
            var nextZoom = win.webContents.getZoomFactor() + step * 0.1;
            win.webContents.zoomFactor = Math.max(0.25, Math.min(3, nextZoom));
        }

        zoom(zoomDirection === "in");
        stateChangeHandler();
    }

    function closedHandler() {
        // Unregister listeners and save state
        unmanage();
    }

    function unmanage() {
        win.removeListener('resize', stateChangeHandler);
        win.removeListener('move', stateChangeHandler);
        win.removeListener('enter-html-full-screen', stateChangeHandler);
        win.removeListener('enter-full-screen', stateChangeHandler);
        win.removeListener('maximize', stateChangeHandler);
        win.removeListener('unmaximize', stateChangeHandler);
        win.removeListener('closed', closedHandler);
        clearTimeout(stateChangeTimer);
    }

    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
                { role: 'minimize' }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    win = new BrowserWindow({
        x: (state && state.x) || undefined,
        y: (state && state.y) || undefined,
        width: (state && state.width) || undefined,
        height: (state && state.height) || undefined,
        darkTheme: true,
        autoHideMenuBar: true
    });

    win.loadURL(url.format({
        pathname: path.join(
            __dirname,
            'dist/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    globalShortcut.register('Control+O', () => win.webContents.zoomFactor = 1);
    globalShortcut.register('Control+numadd', () => zoom(true));
    globalShortcut.register('Control+numsub', () => zoom(false));

    if (state && state.isMaximized) {
        win.maximize();
    }
    if (state && state.isFullScreen) {
        win.setFullScreen(true);
    }
    if (state && state.zoomFactor) {
        setTimeout(() => {
            win.webContents.zoomFactor = state.zoomFactor;
        }, 100);
    }

    win.addListener('resize', stateChangeHandler);
    win.addListener('enter-html-full-screen', stateChangeHandler);
    win.addListener('enter-full-screen', stateChangeHandler);
    win.addListener('maximize', stateChangeHandler);
    win.addListener('unmaximize', stateChangeHandler);
    win.addListener('move', stateChangeHandler);
    win.addListener('closed', closedHandler);
    win.webContents.addListener("zoom-changed", zoomChangeHandler);

    validateState();

    // Load local server
    try {
        serve();
    } catch (err) {
        console.error('Fail to load local server', err);
    }
}

app.addListener('ready', onReady);

