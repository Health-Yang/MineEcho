#!/usr/bin/env node
/**
 * 使用 BFF 的 device 身份测试 Gateway 握手（cli + device 签名）。
 * 需先 build 或直接用 tsx 运行 bff；此处用动态 import 加载编译后的 device-identity。
 * 用法：cd bff && node --experimental-vm-modules scripts/test-connect-with-device.mjs
 * 或：cd bff && npx tsx scripts/test-connect-with-device.ts（若改为 .ts 并从 src 导入）
 */
import WebSocket from "ws";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const url = process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789";
const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";

async function main() {
  let buildDeviceConnectParams;
  try {
    const mod = await import("../dist/gateway/device-identity.js");
    buildDeviceConnectParams = mod.buildDeviceConnectParams;
  } catch (e) {
    console.error("Build BFF first: npm run build in bff/");
    console.error(e);
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => console.log("WS open"));
    ws.on("error", (e) => { console.error("WS error:", e.message); reject(e); });
    ws.on("close", (code, reason) => console.log("WS close:", code, reason?.toString()));

    ws.on("message", (data) => {
      const raw = data.toString();
      console.log("Received:", raw.slice(0, 400));
      const frame = JSON.parse(raw);
      if (frame.type === "event" && frame.event === "connect.challenge") {
        const nonce = frame.payload?.nonce;
        if (!nonce) {
          console.error("No nonce in challenge");
          ws.close();
          return resolve();
        }
        const device = buildDeviceConnectParams({
          nonce,
          role: "operator",
          scopes: ["operator.read", "operator.write", "operator.admin"],
          clientId: "cli",
          clientMode: "cli",
          platform: "node",
          token: token || undefined,
        });
        const params = {
          minProtocol: 3,
          maxProtocol: 3,
          client: { id: "cli", version: "0.1.0", platform: "node", mode: "cli" },
          role: "operator",
          scopes: ["operator.read", "operator.write", "operator.admin"],
          device,
        };
        if (token) params.auth = { token };
        const req = { type: "req", id: "test-1", method: "connect", params };
        console.log("Sending connect with device...");
        ws.send(JSON.stringify(req));
        return;
      }
      if (frame.type === "res" && frame.id === "test-1") {
        console.log("Connect response ok:", frame.ok, frame.error || "(no error)");
        if (!frame.ok) console.error("Error:", frame.error);
        ws.close();
        process.exit(frame.ok ? 0 : 1);
      }
    });

    setTimeout(() => {
      console.error("Timeout: no response in 10s");
      process.exit(1);
    }, 10000);
  });
}

main();
