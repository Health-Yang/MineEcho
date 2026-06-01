#!/usr/bin/env node

import { existsSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeVersion = process.versions.node.split(".").map((part) => Number(part));
const minNode = [22, 19, 0];

const paths = {
  bff: join(root, "apps", "bff"),
  console: join(root, "apps", "console"),
  gateway: join(root, "vendor", "openclaw-gateway"),
};

const ports = {
  bff: Number(process.env.BFF_PORT || "3085"),
  console: Number(process.env.MINEECHO_CONSOLE_PORT || "5175"),
  gateway: Number(process.env.OPENCLAW_GATEWAY_PORT || "18789"),
};

let shuttingDown = false;
const children = [];

main().catch((error) => {
  console.error(`\n启动失败: ${error.message}`);
  process.exit(1);
});

async function main() {
  assertNodeVersion();
  assertRuntimePackagePlatform();
  ensureLocalEnv(join(paths.bff, ".env.example"), join(paths.bff, ".env"));
  ensureLocalEnv(join(paths.console, ".env.example"), join(paths.console, ".env"));
  assertDependencies();
  await assertPortsAvailable();

  process.env.BFF_PORT = String(ports.bff);
  process.env.MINEECHO_CONSOLE_PORT = String(ports.console);
  process.env.OPENCLAW_GATEWAY_PORT = String(ports.gateway);
  process.env.OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || `ws://127.0.0.1:${ports.gateway}`;
  process.env.OPENCLAW_GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || `http://127.0.0.1:${ports.gateway}`;
  process.env.OPENCLAW_HOME = process.env.OPENCLAW_HOME || join(root, ".runtime", "openclaw-home");
  process.env.OPENCLAW_CONFIG_PATH = process.env.OPENCLAW_CONFIG_PATH || join(process.env.OPENCLAW_HOME, "openclaw.json");
  process.env.MINEECHO_CONFIG_HOME = process.env.MINEECHO_CONFIG_HOME || join(root, ".runtime", "mineecho-home");
  process.env.OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ensureGatewayToken(process.env.OPENCLAW_HOME);

  console.log("=== MineEcho v0.1 Runtime ===");
  console.log(`BFF:     http://127.0.0.1:${ports.bff}`);
  console.log(`Console: http://127.0.0.1:${ports.console}`);
  console.log(`Gateway: ws://127.0.0.1:${ports.gateway}`);
  console.log(`Runtime: ${join(root, ".runtime")}`);
  console.log("");
  console.log("首次使用请在 Console 设置页配置模型 Provider 和 API Key。");
  console.log("按 Ctrl+C 可停止 MineEcho。");
  console.log("");

  startService("bff", paths.bff, ["run", "dev"]);
  startService("console", paths.console, [
    "run",
    "dev",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    String(ports.console),
  ]);
}

function assertNodeVersion() {
  for (let index = 0; index < minNode.length; index += 1) {
    if (nodeVersion[index] > minNode[index]) return;
    if (nodeVersion[index] < minNode[index]) {
      throw new Error(`当前 Node.js 为 ${process.versions.node}，MineEcho v0.1 运行包需要 Node.js 22.19.0 或更高版本。`);
    }
  }
}

function assertRuntimePackagePlatform() {
  const manifestPath = join(root, "RUNTIME-MANIFEST.json");
  if (!existsSync(manifestPath)) return;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("RUNTIME-MANIFEST.json 无法解析，请重新下载完整运行包。");
  }

  const packagedPlatform = String(manifest.platform || "");
  const packagedArch = String(manifest.arch || "");
  const includesNodeModules = manifest.includesNodeModules === true;
  if (!includesNodeModules || !packagedPlatform) return;
  if (packagedPlatform === process.platform && (!packagedArch || packagedArch === process.arch)) return;

  throw new Error(
    [
      `当前运行包平台为 ${packagedPlatform}-${packagedArch || "unknown"}，当前系统为 ${process.platform}-${process.arch}。`,
      "",
      "包含 node_modules 的 MineEcho 运行包不能跨操作系统直接使用。",
      "请下载与你系统一致的运行包，例如 Windows 需要 win32-x64 包。",
      "如果你拿到的是源码包，请联网执行：npm run install:apps",
    ].join("\n"),
  );
}

function ensureLocalEnv(examplePath, envPath) {
  if (!existsSync(examplePath) || existsSync(envPath)) return;
  copyFileSync(examplePath, envPath);
}

function assertDependencies() {
  const coreFiles = [
    [join(root, "package.json"), "package.json"],
    [join(paths.bff, "package.json"), "apps/bff/package.json"],
    [join(paths.console, "package.json"), "apps/console/package.json"],
    [join(paths.gateway, "package.json"), "vendor/openclaw-gateway/package.json"],
  ];
  const missingCoreFiles = coreFiles.filter(([path]) => !existsSync(path));
  if (missingCoreFiles.length > 0) {
    const labels = missingCoreFiles.map(([, label]) => `- ${label}`).join("\n");
    throw new Error(
      [
        "运行包文件不完整，缺少核心项目文件：",
        labels,
        "",
        "请重新下载并完整解压 MineEcho 运行包。",
        "Windows 用户请确认下载的是 MineEcho-v0.1.0-runtime-win32-x64.zip，不是 runtime-darwin-* macOS 包。",
      ].join("\n"),
    );
  }

  const required = [
    [join(paths.bff, "node_modules"), "apps/bff/node_modules"],
    [join(paths.console, "node_modules"), "apps/console/node_modules"],
    [join(paths.gateway, "node_modules"), "vendor/openclaw-gateway/node_modules"],
    [join(paths.gateway, "openclaw.mjs"), "vendor/openclaw-gateway/openclaw.mjs"],
  ];

  const missing = required.filter(([path]) => !existsSync(path));
  if (missing.length === 0) return;

  const labels = missing.map(([, label]) => `- ${label}`).join("\n");
  throw new Error(
    [
      "运行包依赖不完整，缺少：",
      labels,
      "",
      "请确认你使用的是包含依赖的 MineEcho-v0.1-runtime 包。",
      "如果你拿到的是源码包，需要联网执行：npm run install:apps",
    ].join("\n"),
  );
}

function ensureGatewayToken(openclawHome) {
  const tokenPath = join(openclawHome, ".gateway-token");
  mkdirSync(openclawHome, { recursive: true });
  if (existsSync(tokenPath)) {
    const existing = readFileSync(tokenPath, "utf8").trim();
    if (existing) return existing;
  }
  const token = `mineecho-${randomBytes(24).toString("hex")}`;
  writeFileSync(tokenPath, token, "utf8");
  return token;
}

async function assertPortsAvailable() {
  for (const [name, port] of Object.entries(ports)) {
    await assertPortAvailable(name, port);
  }
}

function assertPortAvailable(name, port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", () => {
      reject(new Error(`${name} 端口 ${port} 已被占用。请关闭占用程序，或设置环境变量覆盖端口。`));
    });
    server.once("listening", () => {
      server.close(resolve);
    });
    server.listen(port, "127.0.0.1");
  });
}

function startService(name, cwd, args) {
  const child = spawn(npmCommand, args, {
    cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push(child);

  child.stdout.on("data", (chunk) => process.stdout.write(prefixLines(name, chunk)));
  child.stderr.on("data", (chunk) => process.stderr.write(prefixLines(name, chunk)));
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[${name}] exited with ${signal ?? code}`);
    shutdown(code ?? 1);
  });
}

function prefixLines(name, chunk) {
  return chunk
    .toString()
    .split(/\n/)
    .map((line, index, lines) => {
      if (index === lines.length - 1 && line === "") return "";
      return `[${name}] ${line}`;
    })
    .join("\n");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
