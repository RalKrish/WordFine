const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("dialog-open-file"),
  lookup: (word) => ipcRenderer.invoke("lookup-word", word)
});
