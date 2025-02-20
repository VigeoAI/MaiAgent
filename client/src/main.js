const { app, BrowserWindow, Tray, Menu,
    nativeImage, screen,
    ipcMain, desktopCapturer } = require('electron');
const path = require('path');

let mainWindow;
let tray;

// Main Window
function createWindow() {
    // Screen Size
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Position
    const windowWidth = 500; // width
    const windowHeight = 500; // height
    const x = width - windowWidth - 20;
    const y = height - windowHeight - 20;
 
    // logo
    const appLogoPath = path.join(__dirname, '../assets/logo48.png');
    const appIcon = nativeImage.createFromPath(appLogoPath);

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x, // Init X
        y: y, // Init Y
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        icon: appIcon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    //mainWindow.webContents.openDevTools();

    // Page
    mainWindow.loadFile('pages/index.html');

    // Close
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    // Tray
    const iconPath = path.join(__dirname, '../assets/logo48.png');
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);

    // Menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Main',
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: 'Quit',
            click: () => {
                quitApp();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);

    // Clock
    //tray.on('double-click', () => {
    //    mainWindow.show();
    //});
}

// Before app.whenReady() disable GPU
app.disableHardwareAcceleration();

ipcMain.on('navigate', (event, page) => {
    mainWindow.loadFile(`pages/${page}.html`);
});

//
ipcMain.handle('take-screenshot', async () => {
    mainWindow.hide();
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: 1920,
            height: 1080,
        }
    });
    mainWindow.show();
    //console.log(sources);
    const source = sources[0]; // first screen
    return source.thumbnail.toDataURL(); // Image Data URL
});

function quitApp() {
    if (tray) {
        tray.destroy();
    }
    app.quit();
    app.exit();
}

// Init
app.whenReady().then(() => {
    createWindow();

    // macOS
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Close Windows/Linux
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        quitApp();
    }
});
