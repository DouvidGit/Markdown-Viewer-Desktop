const { contextBridge, ipcRenderer } = require("electron");

const queuedFiles = [];
const listeners = new Set();

ipcRenderer.on("open-markdown-file", (_event, payload) => {
  queuedFiles.push(payload);
  listeners.forEach((callback) => callback(payload));
});

contextBridge.exposeInMainWorld("markdownViewer", {
  onOpenFile(callback) {
    if (typeof callback !== "function") return () => {};

    listeners.add(callback);
    queuedFiles.splice(0).forEach((payload) => callback(payload));

    return () => {
      listeners.delete(callback);
    };
  },
  onCloseRequest(callback) {
    if (typeof callback !== "function") return () => {};

    const listener = () => callback();
    ipcRenderer.on("close-request", listener);

    return () => {
      ipcRenderer.removeListener("close-request", listener);
    };
  },
  closeDecision(decision) {
    ipcRenderer.send("close-decision", decision);
  },
  saveFile(payload) {
    return ipcRenderer.invoke("save-file", payload);
  },
  savePdf(payload) {
    return ipcRenderer.invoke("save-pdf", payload);
  },
  onMenuCommand(callback) {
    if (typeof callback !== "function") return () => {};

    const listener = (_event, command) => callback(command);
    ipcRenderer.on("menu-command", listener);

    return () => {
      ipcRenderer.removeListener("menu-command", listener);
    };
  },
  appInfo() {
    return ipcRenderer.invoke("app-info");
  }
});
