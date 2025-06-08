const { contextBridge, ipcRenderer, shell } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    openExternal: (url: string) => shell.openExternal(url),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', { title, body }),
    triggerScraper: () => ipcRenderer.send('trigger-scraper'),
    getAuthToken: () => ipcRenderer.invoke('get-auth-token')
  }
); 