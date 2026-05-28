// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { existsSync, appendFileSync, mkdirSync } from "node:fs";
var __dirname = dirname(fileURLToPath(import.meta.url));
function getLogPath() {
  const logDir = join(app.getPath("userData"), "logs");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return join(logDir, "main.log");
}
function log(level, message, ...args) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const prefix = `[${timestamp}][${level.toUpperCase()}]`;
  const line = [prefix, message, ...args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a))].join(" ");
  try {
    appendFileSync(getLogPath(), line + "\n");
  } catch {
  }
  if (level === "error") {
    console.error(prefix, message, ...args);
  } else {
    console.log(prefix, message, ...args);
  }
}
var BFF_PORT = process.env.BFF_PORT || "3085";
var BFF_HEALTH_URL = `http://127.0.0.1:${BFF_PORT}/api/health`;
var BFF_START_TIMEOUT = 6e4;
var BFF_HEALTH_INTERVAL = 500;
var bffProcess = null;
var mainWindow = null;
var bffResolved = false;
function resolveBffEntry() {
  const devPath = join(__dirname, "../../bff/dist/index.js");
  if (existsSync(devPath)) {
    return devPath;
  }
  const packagedPath = join(process.resourcesPath, "app", "bff", "dist", "index.js");
  if (existsSync(packagedPath)) {
    return packagedPath;
  }
  const extraResourcesPath = join(process.resourcesPath, "bff", "dist", "index.js");
  if (existsSync(extraResourcesPath)) {
    return extraResourcesPath;
  }
  return null;
}
async function startBff() {
  return new Promise((resolve, reject) => {
    const bffEntry = resolveBffEntry();
    if (!bffEntry) {
      reject(new Error("\u627E\u4E0D\u5230 BFF \u5165\u53E3\u6587\u4EF6\u3002\u8BF7\u786E\u8BA4\u5DF2\u6784\u5EFA BFF\uFF1Acd apps/bff && npm run build"));
      return;
    }
    log("info", `\u542F\u52A8 BFF: ${bffEntry}`);
    const nodeExecutable = process.execPath || "node";
    const isPackaged = app.isPackaged;
    const env = {
      ...process.env,
      BFF_PORT,
      NODE_ENV: isPackaged ? "production" : "development",
      ELECTRON_RUN_AS_NODE: "1",
      MINECHO_CONFIG_HOME: join(app.getPath("userData"), ".mineecho"),
      // 让 BFF 内嵌的 Gateway 能通过 NODE_PATH 找到 openclaw 包
      NODE_PATH: join(dirname(bffEntry), "node_modules")
    };
    const bffBundleRoot = join(dirname(bffEntry), "..");
    bffProcess = spawn(nodeExecutable, [bffEntry], {
      env,
      cwd: bffBundleRoot,
      stdio: "pipe"
    });
    bffProcess.stdout?.on("data", (data) => {
      log("info", `[BFF stdout] ${data.toString().trim()}`);
    });
    bffProcess.stderr?.on("data", (data) => {
      log("error", `[BFF stderr] ${data.toString().trim()}`);
    });
    bffProcess.on("error", (err) => {
      log("error", "BFF \u8FDB\u7A0B\u9519\u8BEF:", err);
      if (!bffResolved) {
        bffResolved = true;
        reject(err);
      }
    });
    bffProcess.on("exit", (code, signal) => {
      log("info", `BFF \u8FDB\u7A0B\u9000\u51FA\uFF0C\u4EE3\u7801: ${code}, \u4FE1\u53F7: ${signal}`);
      bffProcess = null;
      if (!bffResolved && code !== 0) {
        bffResolved = true;
        reject(new Error(`BFF \u8FDB\u7A0B\u5F02\u5E38\u9000\u51FA (code=${code})\u3002\u8BF7\u68C0\u67E5\u65E5\u5FD7: ${getLogPath()}`));
      }
    });
    const startTime = Date.now();
    const checkHealth = async () => {
      if (Date.now() - startTime > BFF_START_TIMEOUT) {
        if (!bffResolved) {
          bffResolved = true;
          reject(new Error(`BFF \u542F\u52A8\u8D85\u65F6 (${BFF_START_TIMEOUT}ms)\u3002\u8BF7\u68C0\u67E5\u65E5\u5FD7: ${getLogPath()}`));
        }
        return;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2e3);
        const res = await fetch(BFF_HEALTH_URL, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          log("info", "BFF \u5DF2\u5C31\u7EEA");
          if (!bffResolved) {
            bffResolved = true;
            resolve();
          }
          return;
        }
      } catch {
      }
      setTimeout(checkHealth, BFF_HEALTH_INTERVAL);
    };
    setTimeout(checkHealth, 1e3);
  });
}
function stopBff() {
  if (bffProcess) {
    log("info", "\u6B63\u5728\u505C\u6B62 BFF...");
    bffProcess.kill("SIGTERM");
    setTimeout(() => {
      if (bffProcess && !bffProcess.killed) {
        log("error", "BFF \u672A\u54CD\u5E94 SIGTERM\uFF0C\u5F3A\u5236\u7EC8\u6B62");
        bffProcess.kill("SIGKILL");
      }
    }, 5e3);
  }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    title: "MineEcho - \u804C\u573A AI \u4F34\u4FA3",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    show: false
  });
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5175");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = join(__dirname, "../dist/index.html");
    log("info", `\u52A0\u8F7D\u524D\u7AEF\u9875\u9762: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch((err) => {
      log("error", "\u52A0\u8F7D\u524D\u7AEF\u9875\u9762\u5931\u8D25:", err);
      dialog.showErrorBox("\u542F\u52A8\u9519\u8BEF", `\u65E0\u6CD5\u52A0\u8F7D\u524D\u7AEF\u9875\u9762: ${err.message}`);
    });
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(async () => {
  log("info", "Electron \u5E94\u7528\u542F\u52A8\u4E2D...");
  try {
    await startBff();
    createWindow();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "\u542F\u52A8\u5931\u8D25:", message);
    dialog.showErrorBox(
      "MineEcho \u542F\u52A8\u5931\u8D25",
      `\u540E\u7AEF\u670D\u52A1 (BFF) \u542F\u52A8\u5931\u8D25:
${message}

\u65E5\u5FD7\u4F4D\u7F6E: ${getLogPath()}

\u5EFA\u8BAE:
1. \u786E\u8BA4\u7CFB\u7EDF\u5DF2\u5B89\u88C5 Visual C++ Redistributable
2. \u68C0\u67E5\u662F\u5426\u6709\u5176\u4ED6\u7A0B\u5E8F\u5360\u7528\u4E86 3085 \u7AEF\u53E3
3. \u5C1D\u8BD5\u4EE5\u7BA1\u7406\u5458\u8EAB\u4EFD\u8FD0\u884C`
    );
    app.quit();
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  stopBff();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  stopBff();
});
ipcMain.on("renderer-ready", () => {
  log("info", "\u6E32\u67D3\u8FDB\u7A0B\u5DF2\u5C31\u7EEA");
});
