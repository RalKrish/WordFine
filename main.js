const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
});

// Handle file open
ipcMain.handle("dialog-open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
    properties: ["openFile"],
  });
  if (canceled) return null;

  const buffer = fs.readFileSync(filePaths[0]);
  return buffer;
});

// Example: Handle word lookup (dummy, replace with DB call)
ipcMain.handle("lookup-word", async (event, word) => {
  return [{ word, pos: "noun", definition: "Sample meaning of " + word }];
});
