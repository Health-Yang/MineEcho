#!/usr/bin/env node
/**
 * 测试与 OpenClaw Gateway 的 WebSocket 握手，打印收到的首条消息和 connect 响应。
 * 用法：node scripts/test-gateway-connect.mjs  或  OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789 node ...
 */
import WebSocket from "ws";

const url = process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789";
const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";

console.log("Connecting to", url, "...");
const ws = new WebSocket(url);

ws.on("open", () => console.log("WS open"));
ws.on("error", (e) => console.error("WS error:", e.message));
ws.on("close", (code, reason) => console.log("WS close:", code, reason?.toString()));

ws.on("message", (data) => {
  const raw = data.toString();
  console.log("Received:", raw.slice(0, 500));
  const frame = JSON.parse(raw);
  if (frame.type === "event" && frame.event === "connect.challenge") {
    const nonce = frame.payload?.nonce;
    console.log("Got connect.challenge, nonce:", nonce ? "(present)" : "(missing)");
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: { id: "cli", version: "0.1.0", platform: "node", mode: "cli" },
      role: "operator",
      scopes: ["operator.read", "operator.write", "operator.admin"],
    };
    if (token) params.auth = { token };
    const req = { type: "req", id: "test-1", method: "connect", params };
    console.log("Sending connect:", JSON.stringify(req, null, 2));
    ws.send(JSON.stringify(req));
    return;
  }
  if (frame.type === "res" && frame.id === "test-1") {
    console.log("Connect response ok:", frame.ok, frame.error || frame.payload);
    if (!frame.ok) console.error("Error details:", frame.error);
    ws.close();
    process.exit(frame.ok ? 0 : 1);
  }
});

setTimeout(() => {
  console.error("Timeout: no connect.challenge in 8s");
  process.exit(1);
}, 8000);
