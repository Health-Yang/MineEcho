import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, appendFileSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 日志文件 ─────────────────────────────────────────────────────────────────
function getLogPath(): string {
  const logDir = join(app.getPath("userData"), "logs");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  return join(logDir, "main.log");
}

function log(level: "info" | "error", message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${level.toUpperCase()}]`;
  const line = [prefix, message, ...args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a))].join(" ");

  // 写入日志文件
  try {
    appendFileSync(getLogPath(), line + "\n");
  } catch {
    // 忽略日志写入失败
  }

  // 控制台输出
  if (level === "error") {
    console.error(prefix, message, ...args);
  } else {
    console.log(prefix, message, ...args);
  }
}

// ── 配置 ─────────────────────────────────────────────────────────────────────
const BFF_PORT = process.env.BFF_PORT || "3085";
const BFF_HEALTH_URL = `http://127.0.0.1:${BFF_PORT}/api/health`;
const BFF_START_TIMEOUT = 60000; // 60 秒启动超时
const BFF_HEALTH_INTERVAL = 500; // 每 500ms 检查一次健康状态

// ── 进程引用 ─────────────────────────────────────────────────────────────────
let bffProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let bffResolved = false;

// ── 解析 BFF 入口路径 ────────────────────────────────────────────────────────
function resolveBffEntry(): string | null {
  // 1. 开发环境：从 electron 目录向上找到 apps/bff/dist/index.js
  const devPath = join(__dirname, "../../bff/dist/index.js");
  if (existsSync(devPath)) {
    return devPath;
  }

  // 2. 打包环境 (asar): resources/app/bff/dist/index.js
  const packagedPath = join(process.resourcesPath, "app", "bff", "dist", "index.js");
  if (existsSync(packagedPath)) {
    return packagedPath;
  }

  // 3. 打包环境 (extraResources): resources/bff/dist/index.js
  const extraResourcesPath = join(process.resourcesPath, "bff", "dist", "index.js");
  if (existsSync(extraResourcesPath)) {
    return extraResourcesPath;
  }

  return null;
}

// ── 启动 BFF ─────────────────────────────────────────────────────────────────
async function startBff(): Promise<void> {
  return new Promise((resolve, reject) => {
    const bffEntry = resolveBffEntry();
    if (!bffEntry) {
      reject(new Error("找不到 BFF 入口文件。请确认已构建 BFF：cd apps/bff && npm run build"));
      return;
    }

    log("info", `启动 BFF: ${bffEntry}`);

    const nodeExecutable = process.execPath || "node";
    const isPackaged = app.isPackaged;

    const env = {
      ...process.env,
      BFF_PORT,
      NODE_ENV: isPackaged ? "production" : "development",
      ELECTRON_RUN_AS_NODE: "1",
      MINECHO_CONFIG_HOME: join(app.getPath("userData"), ".mineecho"),
      // 让 BFF 内嵌的 Gateway 能通过 NODE_PATH 找到 openclaw 包
      NODE_PATH: join(dirname(bffEntry), "node_modules"),
    };

    // BFF bundle 根目录（BFF 入口在 dist/index.js，node_modules 在根目录）
    const bffBundleRoot = join(dirname(bffEntry), "..");
    bffProcess = spawn(nodeExecutable, [bffEntry], {
      env,
      cwd: bffBundleRoot,
      stdio: "pipe",
    });

    bffProcess.stdout?.on("data", (data: Buffer) => {
      log("info", `[BFF stdout] ${data.toString().trim()}`);
    });

    bffProcess.stderr?.on("data", (data: Buffer) => {
      log("error", `[BFF stderr] ${data.toString().trim()}`);
    });

    bffProcess.on("error", (err) => {
      log("error", "BFF 进程错误:", err);
      if (!bffResolved) {
        bffResolved = true;
        reject(err);
      }
    });

    bffProcess.on("exit", (code, signal) => {
      log("info", `BFF 进程退出，代码: ${code}, 信号: ${signal}`);
      bffProcess = null;
      if (!bffResolved && code !== 0) {
        bffResolved = true;
        reject(new Error(`BFF 进程异常退出 (code=${code})。请检查日志: ${getLogPath()}`));
      }
    });

    // 轮询检查 BFF 健康状态
    const startTime = Date.now();
    const checkHealth = async () => {
      if (Date.now() - startTime > BFF_START_TIMEOUT) {
        if (!bffResolved) {
          bffResolved = true;
          reject(new Error(`BFF 启动超时 (${BFF_START_TIMEOUT}ms)。请检查日志: ${getLogPath()}`));
        }
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(BFF_HEALTH_URL, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          log("info", "BFF 已就绪");
          if (!bffResolved) {
            bffResolved = true;
            resolve();
          }
          return;
        }
      } catch {
        // 还没准备好，继续等待
      }
      setTimeout(checkHealth, BFF_HEALTH_INTERVAL);
    };

    setTimeout(checkHealth, 1000);
  });
}

// ── 停止 BFF ─────────────────────────────────────────────────────────────────
function stopBff() {
  if (bffProcess) {
    log("info", "正在停止 BFF...");
    bffProcess.kill("SIGTERM");
    setTimeout(() => {
      if (bffProcess && !bffProcess.killed) {
        log("error", "BFF 未响应 SIGTERM，强制终止");
        bffProcess.kill("SIGKILL");
      }
    }, 5000);
  }
}

// ── 创建主窗口 ───────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "MineEcho - 职场 AI 伴侣",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: false,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5175");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = join(__dirname, "../dist/index.html");
    log("info", `加载前端页面: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch((err) => {
      log("error", "加载前端页面失败:", err);
      dialog.showErrorBox("启动错误", `无法加载前端页面: ${err.message}`);
    });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── Electron 生命周期 ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  log("info", "Electron 应用启动中...");

  try {
    await startBff();
    createWindow();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "启动失败:", message);
    dialog.showErrorBox(
      "MineEcho 启动失败",
      `后端服务 (BFF) 启动失败:\n${message}\n\n日志位置: ${getLogPath()}\n\n建议:\n1. 确认系统已安装 Visual C++ Redistributable\n2. 检查是否有其他程序占用了 3085 端口\n3. 尝试以管理员身份运行`
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

// ── IPC 通信 ─────────────────────────────────────────────────────────────────
ipcMain.on("renderer-ready", () => {
  log("info", "渲染进程已就绪");
});
