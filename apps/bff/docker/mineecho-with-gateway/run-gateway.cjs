#!/usr/bin/env node
/**
 * 在容器内启动 OpenClaw Gateway，通过 require 全局安装的 openclaw，不依赖 PATH。
 * 用法: NODE_PATH=/usr/local/lib/node_modules node run-gateway.cjs
 */
const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const port = process.env.OPENCLAW_GATEWAY_PORT || "18789";
const args = ["gateway", "--port", port, "--allow-unconfigured"];

const pkgPath = require.resolve("openclaw/package.json");
const pkgDir = path.dirname(pkgPath);
const pkg = require(pkgPath);

const binField = pkg.bin && (pkg.bin.openclaw || pkg.bin.default || Object.values(pkg.bin)[0]);
const candidates = [
  binField && path.join(pkgDir, typeof binField === "string" ? binField : binField),
  path.join(pkgDir, "openclaw.mjs"),
  path.join(pkgDir, "bin", "cli.js"),
  path.join(pkgDir, "dist", "cli.js"),
].filter(Boolean);

let binPath = candidates.find((p) => p && fs.existsSync(p));
if (!binPath) {
  console.error("[run-gateway] openclaw CLI not found. Tried:", candidates.join(", "));
  process.exit(1);
}

const child = cp.spawn(process.execPath, [binPath, ...args], {
  stdio: "inherit",
  env: process.env,
});
child.unref();
