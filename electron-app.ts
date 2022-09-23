
import { app, BrowserWindow, globalShortcut, Menu, MenuItemConstructorOptions, Rectangle } from 'electron';
import { screen } from 'electron/main';
import { readFileSync, writeFileSync } from 'jsonfile';
import { sync } from 'mkdirp';
import { dirname, join } from 'path';
import { debounceTime, filter, mergeWith, Subject, switchMap, take, takeUntil, tap, timer } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { serve } = require('diagnostic-server');

interface UserPreferences {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    isMaximized?: boolean;
    isFullScreen?: boolean;
    displayBounds?: Rectangle;
    zoomFactor?: number;
}

interface Config {
    file: string;
    path: string;
    defaultWidth: number;
    defaultHeight: number;
}

const ready$ = new Subject<void>();
const destroy$ = new Subject<void>();

ready$.pipe(
    take(1),
    switchMap(() => {
        let userPrefs: UserPreferences | undefined;
        const saveState$ = new Subject<void>();

        const config = {
            file: 'user-pref.json',
            path: app.getPath('userData')
        } as Config;
        const fullStoreFileName = join(config.path, config.file);

        // Load the previous state with fallback to defaults
        // Load previous state
        try {
            userPrefs = readFileSync(fullStoreFileName) as UserPreferences;
            // console.log('state loaded from ', fullStoreFileName, state);
        } catch (err) {
            // Don't care
            console.log('Error loading state', err);
        }

        const hasBounds = (): boolean => !!(userPrefs &&
            Number.isInteger(userPrefs.x) &&
            Number.isInteger(userPrefs.y) &&
            userPrefs.width && Number.isInteger(userPrefs.width) && userPrefs.width > 0 &&
            userPrefs.height && Number.isInteger(userPrefs.height) && userPrefs.height > 0);

        const resetStateToDefault = (): void => {
            const displayBounds = screen.getPrimaryDisplay().bounds;

            // Reset state to default values on the primary display
            userPrefs = {
                width: config.defaultWidth || 800,
                height: config.defaultHeight || 600,
                x: 0,
                y: 0,
                displayBounds
            };
        };

        const windowWithinBounds = (bounds: Rectangle): boolean => !userPrefs ||
            !!(userPrefs.x && userPrefs.x >= bounds.x &&
                userPrefs.y && userPrefs.y >= bounds.y &&
                userPrefs.x && userPrefs.width && userPrefs.x + userPrefs.width <= bounds.x + bounds.width &&
                userPrefs.y && userPrefs.height && userPrefs.y + userPrefs.height <= bounds.y + bounds.height);

        const ensureWindowVisibleOnSomeDisplay = (): void => {
            const visible = screen.getAllDisplays().some(display => windowWithinBounds(display.bounds));

            if (!visible) {
                // Window is partially or fully not visible now.
                // Reset it to safe defaults.
                return resetStateToDefault();
            }

            return undefined;
        };

        const validateState = (): void => {
            const isValid = userPrefs && (hasBounds() || userPrefs.isMaximized || userPrefs.isFullScreen);
            if (!isValid) {
                userPrefs = undefined;
                return;
            }

            if (hasBounds() && userPrefs?.displayBounds) {
                ensureWindowVisibleOnSomeDisplay();
            }
        };

        const stateChangeHandler = (): void => {
            saveState$.next();
        };

        const zoom = (zoomIn: boolean): void => {
            const step = zoomIn ? 1 : -1;
            const nextZoom = win.webContents.getZoomFactor() + step * 0.1;
            win.webContents.zoomFactor = Math.max(0.25, Math.min(3, nextZoom));
        };

        const zoomChangeHandler = (_event: Event, zoomDirection: 'in' | 'out'): void => {
            zoom(zoomDirection === 'in');
            saveState$.next();
        };

        const closedHandler = (): void => {
            // Unregister listeners and save state
            unmanage();
        };

        const unmanage = (): void => {
            win.removeListener('resize', stateChangeHandler);
            win.removeListener('move', stateChangeHandler);
            win.removeListener('enter-html-full-screen', stateChangeHandler);
            win.removeListener('enter-full-screen', stateChangeHandler);
            win.removeListener('maximize', stateChangeHandler);
            win.removeListener('unmaximize', stateChangeHandler);
            win.removeListener('closed', closedHandler);
            destroy$.next();
        };

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
        ] as Array<MenuItemConstructorOptions>;

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        const win = new BrowserWindow({
            x: (userPrefs?.x) || undefined,
            y: (userPrefs?.y) || undefined,
            width: (userPrefs?.width) || undefined,
            height: (userPrefs?.height) || undefined,
            darkTheme: true,
            autoHideMenuBar: true
        });

        void win.loadURL(join('file://', __dirname, '../dist/index.html'));

        globalShortcut.register('Control+O', () => win.webContents.zoomFactor = 1);
        globalShortcut.register('Control+numadd', () => zoom(true));
        globalShortcut.register('Control+numsub', () => zoom(false));

        if (userPrefs?.isMaximized) {
            win.maximize();
        }
        if (userPrefs?.isFullScreen) {
            win.setFullScreen(true);
        }

        const initZoomFactor$ = timer(100).pipe(
            filter(() => !!userPrefs?.zoomFactor),
            tap(() => win.webContents.zoomFactor = userPrefs?.zoomFactor || 1)
        );

        win.addListener('resize', stateChangeHandler);
        win.addListener('enter-html-full-screen', stateChangeHandler);
        win.addListener('enter-full-screen', stateChangeHandler);
        win.addListener('maximize', stateChangeHandler);
        win.addListener('unmaximize', stateChangeHandler);
        win.addListener('move', stateChangeHandler);
        win.addListener('closed', closedHandler);
        win.webContents.addListener('zoom-changed', zoomChangeHandler);

        validateState();

        // Load local server
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            serve();
        } catch (err) {
            console.error('Fail to load local server', err);
        }

        return saveState$.pipe(
            debounceTime(1000),
            tap(() => {
                // Save state
                try {
                    const isNormal = !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
                    const winBounds = win.getBounds();
                    userPrefs = userPrefs || {};
                    if (isNormal) {
                        userPrefs.x = winBounds.x;
                        userPrefs.y = winBounds.y;
                        userPrefs.width = winBounds.width;
                        userPrefs.height = winBounds.height;
                    }
                    userPrefs.isMaximized = win.isMaximized();
                    userPrefs.isFullScreen = win.isFullScreen();
                    userPrefs.displayBounds = screen.getDisplayMatching(winBounds).bounds;
                    userPrefs.zoomFactor = win.webContents.getZoomFactor();

                    sync(dirname(fullStoreFileName));
                    writeFileSync(fullStoreFileName, userPrefs);
                    console.log('State saved in', fullStoreFileName, userPrefs);
                } catch (err) {
                    console.error('Error saving state', err);
                }
            }),
            mergeWith(initZoomFactor$)
        );
    }),
    takeUntil(destroy$)
).subscribe();

app.addListener('ready', () => ready$.next());
