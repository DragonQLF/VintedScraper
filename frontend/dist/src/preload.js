"use strict";
var _a = require('electron'), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer, shell = _a.shell;
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    openExternal: function (url) { return shell.openExternal(url); },
    minimizeWindow: function () { return ipcRenderer.send('minimize-window'); },
    maximizeWindow: function () { return ipcRenderer.send('maximize-window'); },
    closeWindow: function () { return ipcRenderer.send('close-window'); },
    showNotification: function (title, body) { return ipcRenderer.send('show-notification', { title: title, body: body }); }
});
