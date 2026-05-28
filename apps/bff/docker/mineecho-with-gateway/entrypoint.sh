#!/bin/sh
set -e
# 单容器内先启动 OpenClaw Gateway，等端口就绪后再启动 MineEcho BFF
# 支持零配置启动：首次启动无需配置 API Key，用户可在 Web 界面初始化
export PATH="/usr/local/bin:$PATH"
VOLUME_OPENCLAW="/app/.openclaw"
VOLUME_MINEECHO="/app/.mineecho"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
mkdir -p "$VOLUME_OPENCLAW"
# 必须写 gateway.auth.token + gateway.remote.token；dangerouslyDisableDeviceAuth 让 BFF 仅用 token 连接
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-mineecho-in-container}"
# 使用带 provider 前缀的模型 ID；新 schema 仅用 agents.defaults + agents.list，避免 Config invalid / Legacy config keys
# API Key 由用户在 Web 界面配置后通过 restart-gateway 注入
DEFAULT_MODEL="minimax/MiniMax-M2.5"
CONFIG_JSON=$(cat << 'CONFIGEOF'
{
  "agents": {
    "defaults": { "model": { "primary": "minimax/MiniMax-M2.5", "fallbacks": [] } },
    "list": [ { "id": "main", "default": true, "identity": { "name": "MineEcho" } } ]
  },
  "models": {
    "mode": "merge",
    "providers": {
      "minimax": {
        "baseUrl": "https://api.minimaxi.com/anthropic",
        "apiKey": "${MINIMAX_API_KEY}",
        "api": "anthropic-messages",
        "models": [
          { "id": "MiniMax-M2.5", "name": "MiniMax M2.5", "contextWindow": 200000, "maxTokens": 8192 },
          { "id": "MiniMax-M2.5-highspeed", "name": "MiniMax M2.5 Highspeed", "contextWindow": 200000, "maxTokens": 8192 }
        ]
      }
    }
  },
  "gateway": {
    "mode": "local",
    "auth": { "mode": "token", "token": "GATEWAY_TOKEN_PLACEHOLDER" },
    "remote": { "token": "GATEWAY_TOKEN_PLACEHOLDER" },
    "controlUi": {
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true,
      "allowedOrigins": ["http://127.0.0.1:3085", "http://localhost:3085", "null"]
    }
  },
  "skills": {
    "load": {
      "watch": true,
      "watchDebounceMs": 500
    }
  }
}
CONFIGEOF
)
CONFIG_JSON=$(echo "$CONFIG_JSON" | sed "s|GATEWAY_TOKEN_PLACEHOLDER|$GATEWAY_TOKEN|g")
# 写入或修正配置：无文件时写入；有文件但含旧 schema（identity/agent）或 anthropic 默认时也写入，避免 Config invalid / Legacy config keys
if [ ! -f "$VOLUME_OPENCLAW/openclaw.json" ]; then
  echo "$CONFIG_JSON" > "$VOLUME_OPENCLAW/openclaw.json"
elif grep -qE 'anthropic/claude-opus|claude-opus-4' "$VOLUME_OPENCLAW/openclaw.json" 2>/dev/null; then
  echo "$CONFIG_JSON" > "$VOLUME_OPENCLAW/openclaw.json"
elif grep -qE '"identity":|"agent":\s*\{' "$VOLUME_OPENCLAW/openclaw.json" 2>/dev/null; then
  echo "$CONFIG_JSON" > "$VOLUME_OPENCLAW/openclaw.json"
fi
# 标记首次启动状态（用于前端判断）
FIRST_START="false"
if [ ! -f "$VOLUME_MINEECHO/.initialized" ]; then
  FIRST_START="true"
fi
# OpenClaw 约定：OPENCLAW_HOME 为「包含 .openclaw 的上一级目录」，内部会拼接 .openclaw 得到配置根，故不能设为 /app/.openclaw（否则会变成 /app/.openclaw/.openclaw）
# agent 目录在配置根下，即 /app/.openclaw/agents/main/agent（无重复 .openclaw）
AGENT_DIR="$VOLUME_OPENCLAW/agents/main/agent"
mkdir -p "$AGENT_DIR"
if [ ! -f "$AGENT_DIR/auth-profiles.json" ]; then
  echo '{"profiles":{}}' > "$AGENT_DIR/auth-profiles.json"
fi

# 复制内置技能到 volume（因为 /app/.openclaw 是 volume mount，构建时 COPY 会被覆盖）
if [ -d "/app/builtin-skills" ]; then
  mkdir -p "$VOLUME_OPENCLAW/extensions"
  for skill_dir in /app/builtin-skills/*; do
    if [ -d "$skill_dir" ]; then
      skill_name=$(basename "$skill_dir")
      if [ ! -d "$VOLUME_OPENCLAW/extensions/$skill_name" ]; then
        echo "[entrypoint] Installing builtin skill: $skill_name"
        cp -r "$skill_dir" "$VOLUME_OPENCLAW/extensions/"
      fi
    fi
  done
fi
# 加载卷内 .env，使 Gateway 进程能拿到 MINIMAX_API_KEY 等（初始化保存后需重启容器一次）
HAS_API_KEY="false"
if [ -f "$VOLUME_MINEECHO/.env" ]; then
  set -a
  . "$VOLUME_MINEECHO/.env" 2>/dev/null || true
  set +a
  # 检查是否有有效的 API Key
  if [ -n "$MINIMAX_API_KEY" ] && [ "$MINIMAX_API_KEY" != "your_minimax_api_key_here" ]; then
    HAS_API_KEY="true"
  fi
fi
OPENCLAW_CLI="/app/gateway/node_modules/openclaw/openclaw.mjs"
if [ ! -f "$OPENCLAW_CLI" ]; then
  OPENCLAW_CLI="/app/gateway/node_modules/openclaw/dist/index.js"
fi
# Gateway 使用 OPENCLAW_HOME=/app，内部拼接 .openclaw 后读 /app/.openclaw（即卷挂载点）
export OPENCLAW_HOME="/app"
export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
# 若卷内配置仍含 legacy keys，先执行 doctor --fix 做兼容迁移（避免 Config invalid）
node "$OPENCLAW_CLI" doctor --fix 2>/dev/null || true
# 如果有 API Key，注入到 openclaw.json
if [ "$HAS_API_KEY" = "true" ] && [ -f "$VOLUME_OPENCLAW/openclaw.json" ] && [ -f "$VOLUME_MINEECHO/.env" ]; then
  echo "[entrypoint] Injecting MINIMAX_API_KEY into openclaw.json..."
  KEY_FILE=""
  KEY_FILE=$(mktemp 2>/dev/null) || KEY_FILE="/tmp/minimax-key.$$"
  if grep -q '^MINIMAX_API_KEY=' "$VOLUME_MINEECHO/.env" 2>/dev/null; then
    grep '^MINIMAX_API_KEY=' "$VOLUME_MINEECHO/.env" 2>/dev/null | head -1 | sed 's/^MINIMAX_API_KEY=//' | tr -d '\r' > "$KEY_FILE"
    if [ -s "$KEY_FILE" ]; then
      export CONFIG_PATH="$VOLUME_OPENCLAW/openclaw.json"
      node /app/inject-minimax-key.cjs "$KEY_FILE" || echo "[entrypoint] inject script failed, check above for error"
    fi
  fi
  rm -f "$KEY_FILE" 2>/dev/null || true
fi
# 启动 Gateway：有 API Key 时正常启动，无 API Key 时使用 --allow-unconfigured 允许未配置启动
if [ "$HAS_API_KEY" = "true" ]; then
  echo "[entrypoint] Starting Gateway with configured API Key..."
  node "$OPENCLAW_CLI" gateway --port "$GATEWAY_PORT" &
else
  echo "[entrypoint] Starting Gateway in unconfigured mode (API Key will be set via Web UI)..."
  node "$OPENCLAW_CLI" gateway --port "$GATEWAY_PORT" --allow-unconfigured &
fi
# 等待 Gateway 端口就绪（openclaw 冷启动较慢，最多 90 秒）
if node /app/wait-for-port.js "$GATEWAY_PORT" 90000; then
  # BFF 直接读 openclaw.json，需指向配置根 /app/.openclaw
  export OPENCLAW_HOME="$VOLUME_OPENCLAW"
  exec node /app/dist/index.js
else
  echo "[entrypoint] WARN: Gateway port $GATEWAY_PORT not ready, starting BFF anyway. Check logs for openclaw errors."
  export OPENCLAW_HOME="$VOLUME_OPENCLAW"
  exec node /app/dist/index.js
fi
