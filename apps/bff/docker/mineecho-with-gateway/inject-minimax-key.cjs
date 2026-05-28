#!/usr/bin/env node
/**
 * 从「临时 key 文件」或 .env 路径读取 MINIMAX_API_KEY，写入 openclaw.json。
 * 使用 .cjs 扩展名以便在 type:module 的 /app 下以 CommonJS 运行。
 */
const fs = require("fs");
const path = require("path");

function readKeyFromFile(keyFilePath) {
  if (!fs.existsSync(keyFilePath)) return "";
  let key = fs.readFileSync(keyFilePath, "utf8")
    .replace(/\uFEFF/g, "")
    .replace(/\r/g, "")
    .trim();
  key = key.replace(/^["']|["']$/g, "").trim();
  if (key.includes("\n")) key = key.split("\n")[0].trim();
  key = key.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
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
    // 仍然需要写入技能热重载配置
    injectSkillsConfig(config, configPath);
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
      baseUrl: "https://api.minimaxi.com/anthropic",
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
  // 若 401 且 Key 已注入，可尝试更换 endpoint：在 .env 中设置 MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic 后重启
  const baseUrlEnv = process.env.MINIMAX_BASE_URL && String(process.env.MINIMAX_BASE_URL).trim();
  if (baseUrlEnv) config.models.providers.minimax.baseUrl = baseUrlEnv;

  // 强制模型为 minimax/MiniMax-M2.5，避免 OpenClaw 将 "MiniMax M2.5" 无 provider 时回退到 anthropic/MiniMax M2.5
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

  // 技能热重载配置（无论是否有 key 都要写入）
  injectSkillsConfig(config, configPath);

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[entrypoint] Injected MINIMAX_API_KEY into openclaw.json");
}

function injectSkillsConfig(config, configPath) {
  if (!config.skills) config.skills = {};
  if (!config.skills.load) config.skills.load = {};
  config.skills.load.watch = true;
  config.skills.load.watchDebounceMs = 500;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[entrypoint] Injected skills.watch config into openclaw.json");
}

main();
