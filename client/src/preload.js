//
const { contextBridge, ipcRenderer } = require('electron');

// API
window.electron = {
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel, callback) => {
        ipcRenderer.on(channel, (event, data) => callback(data));
    },
};

// Safe API for pages
contextBridge.exposeInMainWorld('electronAPI', {
    navigate: (page) => ipcRenderer.send('navigate', page),
    takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
});
