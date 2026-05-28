#!/usr/bin/env node
/**
 * 等待指定端口可连接，用于单容器内等 Gateway 就绪后再启动 BFF。
 * 用法: node wait-for-port.js [port] [timeoutMs]
 * 使用 ESM 以兼容 /app 下 package.json 的 "type": "module"
 */
import net from "net";

const port = parseInt(process.argv[2] || "18789", 10);
const timeoutMs = parseInt(process.argv[3] || "30000", 10);
const host = "127.0.0.1";
const start = Date.now();

function tryConnect() {
  const c = net.createConnection(port, host, () => {
    c.destroy();
    process.exit(0);
  });
  c.on("error", () => {
    if (Date.now() - start > timeoutMs) {
      console.error("[entrypoint] Gateway port", port, "did not become ready in time");
      process.exit(1);
    }
    setTimeout(tryConnect, 500);
  });
}

tryConnect();
