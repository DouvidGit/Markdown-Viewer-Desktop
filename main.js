const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let pendingFiles = [];
let forceClose = false;

const allowedExtensions = new Set([".md", ".markdown", ".txt"]);

function getFilePayload(filePath) {
  if (!filePath || typeof filePath !== "string") return null;

  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase();
  if (!allowedExtensions.has(ext)) return null;

  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return null;

    return {
      fileName: path.basename(resolved),
      filePath: resolved,
      content: fs.readFileSync(resolved, "utf8")
    };
  } catch (error) {
    return {
      fileName: path.basename(resolved),
      filePath: resolved,
      content: "",
      error: error.message
    };
  }
}

function extractFilePayloads(argv) {
  return argv
    .map((arg) => getFilePayload(arg))
    .filter(Boolean);
}

function sendPayloads(payloads) {
  if (!mainWindow || mainWindow.isDestroyed() || !payloads.length) return;

  if (!mainWindow.webContents.isLoading()) {
    payloads.forEach((payload) => {
      mainWindow.webContents.send("open-markdown-file", payload);
    });
    return;
  }

  pendingFiles.push(...payloads);
}

function flushPendingFiles() {
  if (!pendingFiles.length) return;
  const files = pendingFiles;
  pendingFiles = [];
  sendPayloads(files);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#f7f4ef",
    title: "Markdown Viewer",
    icon: path.join(__dirname, "assets", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.on("did-finish-load", flushPendingFiles);
  mainWindow.on("close", (event) => {
    if (forceClose) return;
    event.preventDefault();
    mainWindow.webContents.send("close-request");
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function sendMenuCommand(command) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("menu-command", command);
  }
}

function createAppMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { label: "Import / Open Markdown...", accelerator: "Ctrl+O", click: () => sendMenuCommand("open") },
        { label: "New Tab", accelerator: "Ctrl+N", click: () => sendMenuCommand("new-tab") },
        { type: "separator" },
        { label: "Save as .md", accelerator: "Ctrl+S", click: () => sendMenuCommand("save-md") },
        { label: "Export PDF", click: () => sendMenuCommand("export-pdf") },
        { label: "Export HTML", click: () => sendMenuCommand("export-html") },
        { type: "separator" },
        { label: "Print / PDF Preview", accelerator: "Ctrl+P", click: () => sendMenuCommand("export-pdf") },
        { type: "separator" },
        { label: "Exit", role: "quit" }
      ]
    },
    {
      label: "Help",
      submenu: [
        { label: "Editing and Preview", click: () => sendMenuCommand("help-editing") },
        { label: "Tabs and Files", click: () => sendMenuCommand("help-tabs") },
        { label: "Exporting", click: () => sendMenuCommand("help-export") },
        { label: "Search and View", click: () => sendMenuCommand("help-view") },
        { label: "About Markdown Viewer", click: () => sendMenuCommand("help-about") }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const payloads = extractFilePayloads(argv);
    if (!mainWindow) {
      pendingFiles.push(...payloads);
      createWindow();
      return;
    }

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    sendPayloads(payloads);
  });

  app.whenReady().then(() => {
    createAppMenu();
    pendingFiles = extractFilePayloads(process.argv);
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

ipcMain.handle("app-info", () => ({
  isElectron: true,
  platform: process.platform
}));

ipcMain.on("close-decision", (_event, decision) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (decision === "cancel") return;

  forceClose = true;
  mainWindow.close();
});

ipcMain.handle("save-file", async (_event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };

  const type = payload?.type || "md";
  const defaultPath = payload?.defaultPath || "markdown-notes.md";
  const filters = {
    md: [{ name: "Markdown", extensions: ["md"] }],
    html: [{ name: "HTML", extensions: ["html"] }]
  };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: type === "html" ? "Save as HTML" : "Save as Markdown",
    defaultPath,
    filters: filters[type] || filters.md
  });

  if (result.canceled || !result.filePath) return { canceled: true };

  fs.writeFileSync(result.filePath, payload?.content || "", "utf8");
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle("save-pdf", async (_event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save as PDF",
    defaultPath: payload?.defaultPath || "markdown-notes.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });

  if (result.canceled || !result.filePath) return { canceled: true };

  const printWindow = new BrowserWindow({
    show: false,
    width: 900,
    height: 1200,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload?.html || "")}`);
    const pdf = await printWindow.webContents.printToPDF({
      printBackground: true,
      marginsType: 1,
      pageSize: "A4"
    });
    fs.writeFileSync(result.filePath, pdf);
    return { canceled: false, filePath: result.filePath };
  } finally {
    printWindow.close();
  }
});
