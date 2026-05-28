#!/usr/bin/env node
/**
 * 从「临时 key 文件」或 .env 路径读取 MINIMAX_API_KEY，写入 openclaw.json。
 * 用法: node inject-minimax-key.js [key-file-path]
 *   或: node inject-minimax-key.js [env-path] [config-path]  (从 env 文件解析 key)
 * 若传入 1 个参数且文件存在，视为 key 文件（内容即 key）；若传入 2 个参数，视为 env 路径与 config 路径。
 */
const fs = require("fs");
const path = require("path");

function readKeyFromFile(keyFilePath) {
  if (!fs.existsSync(keyFilePath)) return "";
  let key = fs.readFileSync(keyFilePath, "utf8").replace(/\r/g, "").trim();
  key = key.replace(/^["']|["']$/g, "");
  return key || "";
}

function readKeyFromEnv(envPath) {
  if (!fs.existsSync(envPath)) return "";
  const content = fs.readFileSync(envPath, "utf8").replace(/\r/g, "").replace(/\uFEFF/g, "");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (t.startsWith("MINIMAX_API_KEY")) {
      const eq = t.indexOf("=");
      if (eq >= 0) {
        let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (v) return v;
      }
    }
  }
  return "";
}

function main() {
  const args = process.argv.slice(2);
  let key = "";
  let configPath = process.env.CONFIG_PATH || path.join(process.env.VOLUME_OPENCLAW || "/app/.openclaw", "openclaw.json");
  if (!configPath || !fs.existsSync(configPath)) {
    console.error("[entrypoint] inject: CONFIG_PATH missing or file not found:", configPath);
    process.exit(1);
  }

  if (args.length >= 1 && fs.existsSync(args[0])) {
    const p = args[0];
    if (args.length >= 2) {
      configPath = args[1];
      key = readKeyFromEnv(p);
    } else {
      key = readKeyFromFile(p);
    }
  } else {
    const envPath = process.env.ENV_PATH || path.join(process.env.VOLUME_MINEECHO || "/app/.mineecho", ".env");
    key = readKeyFromEnv(envPath);
  }

  if (!key) {
    console.error("[entrypoint] No MINIMAX_API_KEY found, skip inject");
    process.exit(0);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error("[entrypoint] inject read config failed:", e.message);
    process.exit(1);
  }

  if (!config.models) config.models = {};
  if (!config.models.providers) config.models.providers = {};
  if (!config.models.providers.minimax) {
    config.models.providers.minimax = {
      baseUrl: "https://api.minimax.io/anthropic",
      apiKey: key,
      api: "anthropic-messages",
      models: [
        { id: "MiniMax-M2.5", name: "MiniMax M2.5", contextWindow: 200000, maxTokens: 8192 },
        { id: "MiniMax-M2.5-highspeed", name: "MiniMax M2.5 Highspeed", contextWindow: 200000, maxTokens: 8192 },
      ],
    };
  } else {
    config.models.providers.minimax.apiKey = key;
  }

  // 强制模型为 minimax/MiniMax-M2.5，避免卷内旧配置为 anthropic/MiniMax-M2.5 导致 Unknown model
  const wantModel = "minimax/MiniMax-M2.5";
  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.model) config.agents.defaults.model = {};
  config.agents.defaults.model.primary = wantModel;
  if (Array.isArray(config.agents.list)) {
    for (const a of config.agents.list) {
      if (a && typeof a === "object" && (a.default || a.id === "main")) {
        if (!a.model) a.model = {};
        a.model.primary = wantModel;
        break;
      }
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[entrypoint] Injected MINIMAX_API_KEY into openclaw.json");
}

main();
